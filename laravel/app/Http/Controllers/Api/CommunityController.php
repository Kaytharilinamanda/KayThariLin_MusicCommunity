<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommunityMember;
use App\Models\Follow;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\Topic;
use App\Support\Records;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function posts(Request $request)
    {
        $userId = auth('sanctum')->user()?->id;
        $posts = Post::query()
            ->with('comments')
            ->where('status', 'Visible')
            ->orderByDesc('id')
            ->get();
        $liked = $userId
            ? PostLike::query()->where('user_id', $userId)->pluck('post_id')->all()
            : [];

        return ['posts' => $posts->map(fn (Post $post) => $this->post($post, in_array($post->id, $liked, true)))->values()];
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
            'avatar' => '/avatars/sam.svg',
            'role_label' => 'Member',
            'topic' => trim((string) $request->input('topic', 'Community')) ?: 'Community',
            'text' => $text,
            'image' => trim((string) $request->input('image')),
            'likes_count' => 0,
            'status' => 'Visible',
        ]);
        Records::notifyAdmins('New community post', $actor->name);

        return response()->json(['post' => $this->post($post, false)], 201);
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

        return ['post' => $this->post($post->fresh('comments'), $liked)];
    }

    public function comment(Request $request, Post $post)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $text = trim((string) $request->input('text'));
        if ($text === '') {
            Records::fail('Write a comment first.');
        }
        Comment::create([
            'post_id' => $post->id,
            'user_id' => $actor->id,
            'author_name' => $actor->name,
            'avatar' => '/avatars/sam.svg',
            'text' => $text,
        ]);
        $liked = PostLike::query()->where('post_id', $post->id)->where('user_id', $actor->id)->exists();

        return response()->json(['post' => $this->post($post->fresh('comments'), $liked)], 201);
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

    private function post(Post $post, bool $liked): array
    {
        return [
            'id' => $post->id,
            'author' => $post->author_name,
            'handle' => $post->handle,
            'avatar' => $post->avatar,
            'role' => $post->role_label,
            'time' => Records::ago($post->created_at),
            'topic' => $post->topic,
            'text' => $post->text,
            'image' => $post->image,
            'likes' => (int) $post->likes_count,
            'liked' => $liked,
            'comments' => $post->comments->map(fn (Comment $comment) => [
                'id' => $comment->id,
                'author' => $comment->author_name,
                'avatar' => $comment->avatar,
                'text' => $comment->text,
                'time' => Records::ago($comment->created_at),
            ])->values(),
        ];
    }
}
