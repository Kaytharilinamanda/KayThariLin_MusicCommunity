<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommunityMember;
use App\Models\Follow;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\Topic;
use App\Models\User;
use App\Support\Records;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function posts(Request $request)
    {
        $userId = auth('sanctum')->user()?->id;
        $posts = Post::query()
            ->with($this->feedWith())
            ->where('status', 'Visible')
            ->orderByDesc('id')
            ->get();
        $liked = $userId
            ? PostLike::query()->where('user_id', $userId)->pluck('post_id')->all()
            : [];

        return ['posts' => $posts->map(fn (Post $post) => $this->post($post, in_array($post->id, $liked, true), $userId))->values()];
    }

    public function managePosts(Request $request)
    {
        Records::requireAdmin($request->user());
        $posts = Post::query()->orderByDesc('id')->get();

        return ['posts' => $posts->map(fn (Post $post) => [
            'id' => $post->id,
            'author' => $post->author_name,
            'excerpt' => $post->text,
            'topic' => $post->topic,
            'likes' => (int) $post->likes_count,
            'status' => $post->status,
        ])->values()];
    }

    public function storePost(Request $request)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $text = trim((string) $request->input('text'));
        if (strlen($text) < 2) {
            Records::fail('Write something before posting.');
        }
        $handle = '@'.strtolower(preg_replace('/[^a-z0-9]+/i', '', $actor->name) ?: 'member');
        $post = Post::create([
            'user_id' => $actor->id,
            'author_name' => $actor->name,
            'handle' => $handle,
            'avatar' => $this->face($actor, ''),
            'role_label' => 'Member',
            'topic' => trim((string) $request->input('topic', 'Community')) ?: 'Community',
            'text' => $text,
            'image' => trim((string) $request->input('image')),
            'likes_count' => 0,
            'status' => 'Visible',
        ]);
        Records::notifyAdmins('New community post', $actor->name);
        $post->load($this->feedWith());

        return response()->json(['post' => $this->post($post, false, $actor->id)], 201);
    }

    public function like(Request $request, Post $post)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        if ($post->status !== 'Visible') {
            Records::fail('That post is not available.', 404);
        }
        $existing = PostLike::query()->where('post_id', $post->id)->where('user_id', $actor->id)->first();
        if ($existing) {
            $existing->delete();
            $post->decrement('likes_count');
            $liked = false;
        } else {
            PostLike::create(['post_id' => $post->id, 'user_id' => $actor->id]);
            $post->increment('likes_count');
            $liked = true;
        }

        return ['post' => $this->post($post->fresh($this->feedWith()), $liked, $actor->id)];
    }

    public function uploadImage(Request $request)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ], [
            'photo.required' => 'Choose a photo to upload.',
            'photo.image' => 'Use a JPG, PNG, WEBP, or GIF photo.',
            'photo.mimes' => 'Use a JPG, PNG, WEBP, or GIF photo.',
            'photo.max' => 'Choose a photo smaller than 2 MB.',
        ]);

        return ['image' => $this->storeUpload($request->file('photo'), 'uploads/posts')];
    }

    public function comment(Request $request, Post $post)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        if ($post->status !== 'Visible') {
            Records::fail('That post is not available.', 404);
        }
        $text = trim((string) $request->input('text'));
        if ($text === '') {
            Records::fail('Write a comment first.');
        }
        Comment::create([
            'post_id' => $post->id,
            'parent_id' => $this->replyParent($request, $post)?->id,
            'user_id' => $actor->id,
            'author_name' => $actor->name,
            'avatar' => $this->face($actor, ''),
            'text' => $text,
        ]);
        $liked = PostLike::query()->where('post_id', $post->id)->where('user_id', $actor->id)->exists();

        return response()->json(['post' => $this->post($post->fresh($this->feedWith()), $liked, $actor->id)], 201);
    }

    public function share(Request $request, Post $post)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        if ($post->status !== 'Visible') {
            Records::fail('That post is not available.', 404);
        }
        $original = $post->shared_post_id
            ? (Post::query()->where('status', 'Visible')->find($post->shared_post_id) ?? $post)
            : $post;
        if ($original->status !== 'Visible') {
            Records::fail('That post is not available.', 404);
        }
        if ((int) $original->user_id === (int) $actor->id) {
            Records::fail('Share someone else’s post.', 403);
        }

        $note = trim((string) $request->input('text'));
        $handle = '@'.strtolower(preg_replace('/[^a-z0-9]+/i', '', $actor->name) ?: 'member');
        $share = Post::create([
            'user_id' => $actor->id,
            'shared_post_id' => $original->id,
            'author_name' => $actor->name,
            'handle' => $handle,
            'avatar' => $this->face($actor, ''),
            'role_label' => 'Member',
            'topic' => $original->topic ?: 'Community',
            'text' => $note,
            'image' => '',
            'likes_count' => 0,
            'shares_count' => 0,
            'status' => 'Visible',
        ]);
        $original->increment('shares_count');
        $share->load($this->feedWith());

        return response()->json(['post' => $this->post($share, false, $actor->id)], 201);
    }

    public function destroy(Request $request, Post $post)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        if ((int) $post->user_id !== (int) $actor->id) {
            Records::fail('You can only delete your own posts.', 403);
        }
        if ($post->shared_post_id) {
            Post::query()->whereKey($post->shared_post_id)->where('shares_count', '>', 0)->decrement('shares_count');
        }
        $this->forgetUpload($post->image);
        $post->delete();

        return ['ok' => true];
    }

    public function members(Request $request)
    {
        $userId = auth('sanctum')->user()?->id;
        $ids = $userId
            ? Follow::query()->where('user_id', $userId)->pluck('community_member_id')->all()
            : [];

        return ['members' => CommunityMember::query()->orderBy('name')->get()->map(fn (CommunityMember $member) => [
            'id' => $member->id,
            'name' => $member->name,
            'role' => $member->role_label,
            'city' => $member->city,
            'avatar' => $member->avatar,
            'following' => in_array($member->id, $ids, true),
        ])->values()];
    }

    public function follow(Request $request, CommunityMember $member)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $existing = Follow::query()->where('user_id', $actor->id)->where('community_member_id', $member->id)->first();
        if ($existing) {
            $existing->delete();
            $following = false;
        } else {
            Follow::create(['user_id' => $actor->id, 'community_member_id' => $member->id]);
            $following = true;
        }

        return ['following' => $following];
    }

    public function topics()
    {
        return ['topics' => Topic::query()->orderByDesc('posts_count')->get()->map(fn (Topic $topic) => [
            'tag' => $topic->tag,
            'posts' => (int) $topic->posts_count,
        ])->values()];
    }

    private function post(Post $post, bool $liked, ?int $viewerId = null): array
    {
        return [
            'id' => $post->id,
            'author' => $post->author_name,
            'handle' => $post->handle,
            'avatar' => $this->face($post->user, $post->avatar),
            'mine' => $viewerId !== null && (int) $post->user_id === $viewerId,
            'role' => $post->role_label,
            'time' => Records::ago($post->created_at),
            'topic' => $post->topic,
            'text' => $post->text,
            'image' => $post->image,
            'likes' => (int) $post->likes_count,
            'shares' => (int) $post->shares_count,
            'liked' => $liked,
            'share' => $this->sharedCard($post),
            'comments' => $post->comments->map(fn (Comment $comment) => $this->commentCard($comment))->values(),
        ];
    }

    private function feedWith(): array
    {
        return ['user', 'comments.user', 'comments.replies.user', 'sharedPost.user'];
    }

    private function replyParent(Request $request, Post $post): ?Comment
    {
        $parentId = $request->input('parent_id');
        if ($parentId === null || $parentId === '') {
            return null;
        }
        $parent = Comment::query()->where('post_id', $post->id)->whereKey($parentId)->first();
        if (! $parent) {
            Records::fail('That comment is not on this post.', 404);
        }
        if ($parent->parent_id) {
            $root = Comment::query()->where('post_id', $post->id)->whereKey($parent->parent_id)->whereNull('parent_id')->first();
            if (! $root) {
                Records::fail('Reply to the original comment.', 404);
            }
            $parent = $root;
        }

        return $parent;
    }

    private function commentCard(Comment $comment, bool $withReplies = true): array
    {
        $card = [
            'id' => $comment->id,
            'author' => $comment->author_name,
            'avatar' => $this->face($comment->user, $comment->avatar),
            'text' => $comment->text,
            'time' => Records::ago($comment->created_at),
        ];
        if ($withReplies) {
            $card['replies'] = $comment->replies
                ->sortBy('id')
                ->map(fn (Comment $reply) => $this->commentCard($reply, false))
                ->values();
        }

        return $card;
    }

    private function sharedCard(Post $post): ?array
    {
        if (! $post->shared_post_id) {
            return null;
        }
        $original = $post->sharedPost;
        if (! $original || $original->status !== 'Visible') {
            return ['missing' => true];
        }

        return [
            'id' => $original->id,
            'author' => $original->author_name,
            'handle' => $original->handle,
            'avatar' => $this->face($original->user, $original->avatar),
            'time' => Records::ago($original->created_at),
            'topic' => $original->topic,
            'text' => $original->text,
            'image' => $original->image,
            'missing' => false,
        ];
    }

    private function face(?User $user, ?string $stored): string
    {
        $photo = trim((string) ($user->avatar ?? ''));
        if ($photo !== '') {
            return $photo;
        }
        $stored = trim((string) $stored);

        return $stored !== '' ? $stored : '/avatars/sam.svg';
    }

    private function storeUpload($file, string $folder): string
    {
        $extension = strtolower((string) ($file->guessExtension() ?: 'jpg'));
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }
        if (! in_array($extension, ['jpg', 'png', 'webp', 'gif'], true)) {
            Records::fail('Use a JPG, PNG, WEBP, or GIF photo.');
        }
        $name = request()->user()->id.'-'.bin2hex(random_bytes(8)).'.'.$extension;
        $bytes = file_get_contents($file->getRealPath());
        if ($bytes === false) {
            Records::fail('That photo could not be read.');
        }
        foreach ($this->uploadDirectories($folder) as $directory) {
            if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
                Records::fail('The photo could not be saved.');
            }
            if (file_put_contents($directory.DIRECTORY_SEPARATOR.$name, $bytes) === false) {
                Records::fail('The photo could not be saved.');
            }
        }

        return '/'.$folder.'/'.$name;
    }

    private function forgetUpload(?string $url): void
    {
        if (! is_string($url) || ! str_starts_with($url, '/uploads/posts/')) {
            return;
        }
        $name = basename($url);
        if (! preg_match('/^[A-Za-z0-9._-]+$/', $name)) {
            return;
        }
        foreach ($this->uploadDirectories('uploads/posts') as $directory) {
            $file = $directory.DIRECTORY_SEPARATOR.$name;
            if (is_file($file)) {
                unlink($file);
            }
        }
    }

    private function uploadDirectories(string $folder): array
    {
        $relative = str_replace('/', DIRECTORY_SEPARATOR, $folder);
        if (app()->runningUnitTests()) {
            return [storage_path('framework/testing/'.$relative)];
        }

        return [
            public_path($relative),
            dirname(base_path()).DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.$relative,
        ];
    }
}
