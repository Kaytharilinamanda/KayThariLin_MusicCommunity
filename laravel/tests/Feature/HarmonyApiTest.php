<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class HarmonyApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_health_and_public_catalog(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJson(['ok' => true]);
        $this->getJson('/api/events/public')->assertOk()->assertJsonStructure(['events']);
        $this->getJson('/api/posts')->assertOk()->assertJsonStructure(['posts']);
        $this->getJson('/api/announcements')->assertOk()->assertJsonStructure(['announcements']);
    }

    public function test_login_roles_and_single_admin(): void
    {
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();

        $this->postJson('/api/register', [
            'name' => 'Second Admin',
            'email' => 'boss@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ])->assertStatus(400);

        $this->withToken($admin['token'])->postJson('/api/users', [
            'name' => 'Extra Admin',
            'email' => 'extra@example.com',
            'password' => 'password123',
            'role' => 'admin',
            'status' => 'active',
        ])->assertStatus(400);

        $this->withToken($admin['token'])->postJson('/api/events', [
            'title' => 'Admin should not create this',
            'artist' => 'Nobody',
            'category' => 'Pop',
            'date' => '2026-12-01',
            'time' => '7:00 PM',
            'venue' => 'Hall',
            'city' => 'Yangon',
            'price' => 10,
        ])->assertStatus(403);
    }

    public function test_organizer_submit_and_admin_review(): void
    {
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();

        $created = $this->withToken($organizer['token'])->postJson('/api/events', [
            'title' => 'Desk Check',
            'artist' => 'Night Band',
            'category' => 'Rock',
            'date' => '2026-12-20',
            'time' => '8:00 PM',
            'venue' => 'Thuwunna',
            'city' => 'Yangon',
            'address' => 'Thuwunna Road',
            'price' => 20,
            'blurb' => 'A late set.',
        ])->assertCreated()->json('event');

        $this->assertSame('Pending', $created['status']);

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->json();

        auth()->forgetGuards();
        $this->withToken($admin['token'])->patchJson('/api/events/'.$created['id'].'/review', [
            'decision' => 'rejected',
            'reason' => 'Add the door time.',
        ])->assertOk();

        auth()->forgetGuards();
        $resubmitted = $this->withToken($organizer['token'])->patchJson('/api/events/'.$created['id'], [
            'title' => 'Desk Check',
            'artist' => 'Night Band',
            'category' => 'Rock',
            'date' => '2026-12-20',
            'time' => '8:00 PM',
            'venue' => 'Thuwunna',
            'city' => 'Yangon',
            'price' => 20,
            'blurb' => 'Doors at 7.',
        ])->assertOk()->json('event');

        $this->assertSame('Pending', $resubmitted['status']);
        $this->assertSame('', $resubmitted['rejectionReason']);

        auth()->forgetGuards();
        $this->withToken($admin['token'])->patchJson('/api/events/'.$created['id'].'/review', [
            'decision' => 'approved',
        ])->assertOk();

        $public = collect($this->getJson('/api/events/public')->json('events'));
        $this->assertSame('Desk Check', $public->first()['title']);
    }

    public function test_user_can_reserve_a_ticket(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $event = collect($this->getJson('/api/events/public')->json('events'))->first();
        $ticket = $event['tickets'][0];

        $order = $this->withToken($user['token'])->postJson('/api/orders', [
            'eventId' => $event['id'],
            'ticketId' => $ticket['id'],
            'qty' => 1,
            'name' => 'Hnin',
            'email' => 'user@harmony.community',
        ])->assertCreated()->json('order');

        $this->assertSame('Pending', $order['status']);
        $this->assertSame($event['title'], $order['event']);

        $this->withToken($user['token'])->getJson('/api/orders')->assertOk()->assertJsonFragment(['event' => $event['title']]);
        $this->withToken($user['token'])->patchJson('/api/orders/'.$order['recordId'], [
            'status' => 'Confirmed',
        ])->assertStatus(400);

        auth()->forgetGuards();
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();
        $confirmed = $this->withToken($organizer['token'])->patchJson('/api/orders/'.$order['recordId'], [
            'status' => 'Confirmed',
        ])->assertOk()->json('order');
        $this->assertSame('Confirmed', $confirmed['status']);
        $this->withToken($organizer['token'])->patchJson('/api/orders/'.$order['recordId'], [
            'status' => 'Confirmed',
        ])->assertStatus(400);
    }

    public function test_user_and_organizer_can_upload_a_profile_photo(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $uploaded = $this->withToken($user['token'])->post('/api/me/photo', [
            'photo' => $this->photoUpload('face.png'),
        ])->assertOk();

        $avatar = $uploaded->json('user.avatar');
        $this->assertMatchesRegularExpression('#^/avatars/uploads/'.preg_quote((string) $user['user']['id'], '#').'-[a-f0-9]+\\.png$#', $avatar);
        $this->assertFileExists(storage_path('framework/testing/avatars/'.basename($avatar)));

        $replaced = $this->withToken($user['token'])->post('/api/me/photo', [
            'photo' => $this->photoUpload('next.png'),
        ])->assertOk()->json('user.avatar');
        $this->assertNotSame($avatar, $replaced);
        $this->assertFileExists(storage_path('framework/testing/avatars/'.basename($replaced)));
        $this->assertFileDoesNotExist(storage_path('framework/testing/avatars/'.basename($avatar)));

        $this->withToken($user['token'])->post('/api/me/photo', [
            'photo' => UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf'),
        ])->assertStatus(422);

        auth()->forgetGuards();
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();
        $this->withToken($organizer['token'])->post('/api/me/photo', [
            'photo' => $this->photoUpload('desk.png'),
        ])->assertOk()->assertJsonPath('user.role', 'organizer');

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $this->withToken($admin['token'])->post('/api/me/photo', [
            'photo' => $this->photoUpload('admin.png'),
        ])->assertStatus(403);
    }

    public function test_community_posts_use_the_profile_photo(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $avatar = $this->withToken($user['token'])->post('/api/me/photo', [
            'photo' => $this->photoUpload('face.png'),
        ])->assertOk()->json('user.avatar');

        $post = $this->withToken($user['token'])->postJson('/api/posts', [
            'text' => 'Hello from the room',
        ])->assertCreated()->json('post');

        $this->assertSame($avatar, $post['avatar']);
        $listed = collect($this->withToken($user['token'])->getJson('/api/posts')->json('posts'));
        $this->assertTrue($listed->contains(fn ($item) => $item['text'] === 'Hello from the room' && $item['avatar'] === $avatar));
        $this->assertTrue($listed->firstWhere('text', 'Hello from the room')['mine']);

        auth()->forgetGuards();
        $other = $this->postJson('/api/register', [
            'name' => 'Other Listener',
            'email' => 'other@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertCreated()->json();
        $this->withToken($other['token'])->deleteJson('/api/posts/'.$post['id'])->assertStatus(403);

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $managed = collect($this->withToken($admin['token'])->getJson('/api/posts/manage')->assertOk()->json('posts'));
        $this->assertTrue($managed->contains(fn ($item) => $item['excerpt'] === 'Hello from the room'));
        auth()->forgetGuards();
        $this->withToken($user['token'])->deleteJson('/api/posts/manage/'.$post['id'])->assertStatus(403);
        auth()->forgetGuards();
        $this->withToken($admin['token'])->deleteJson('/api/posts/manage/'.$post['id'])->assertOk();
        $this->withToken($user['token'])->deleteJson('/api/posts/'.$post['id'])->assertStatus(404);
        $after = collect($this->withToken($user['token'])->getJson('/api/posts')->json('posts'));
        $this->assertFalse($after->contains(fn ($item) => $item['text'] === 'Hello from the room'));
    }

    public function test_admin_can_view_and_delete_an_announcement(): void
    {
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();
        $created = $this->withToken($organizer['token'])->postJson('/api/announcements', [
            'title' => 'Room note',
            'body' => 'Bring a pencil.',
            'audience' => 'Students',
            'channel' => 'Community',
            'status' => 'Published',
        ])->assertCreated()->json('announcement');
        $this->withToken($organizer['token'])->postJson('/api/announcements', [
            'kind' => 'ad',
            'title' => 'Home banner',
            'placement' => 'Home',
        ])->assertStatus(404);

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $managed = collect($this->withToken($admin['token'])->getJson('/api/announcements/manage')->assertOk()->json('announcements'));
        $this->assertTrue($managed->contains(fn ($row) => $row['title'] === 'Room note' && $row['body'] === 'Bring a pencil.'));
        auth()->forgetGuards();
        $this->withToken($organizer['token'])->patchJson('/api/announcements/manage/'.$created['id'], [
            'status' => 'Draft',
        ])->assertStatus(403);
        auth()->forgetGuards();
        $updated = $this->withToken($admin['token'])->patchJson('/api/announcements/manage/'.$created['id'], [
            'status' => 'Draft',
        ])->assertOk()->json('announcement');
        $this->assertSame('Draft', $updated['status']);
        $this->withToken($admin['token'])->patchJson('/api/announcements/manage/'.$created['id'], [
            'status' => 'Hidden',
        ])->assertStatus(400);
        auth()->forgetGuards();
        $this->withToken($organizer['token'])->deleteJson('/api/announcements/manage/'.$created['id'])->assertStatus(403);
        auth()->forgetGuards();
        $this->withToken($admin['token'])->deleteJson('/api/announcements/manage/'.$created['id'])->assertOk();
        $public = collect($this->getJson('/api/announcements')->assertOk()->json('announcements'));
        $this->assertFalse($public->contains(fn ($row) => $row['title'] === 'Room note'));
    }

    public function test_a_user_can_reshare_someone_elses_post(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $original = collect($this->withToken($user['token'])->getJson('/api/posts')->json('posts'))
            ->first(fn ($post) => ! $post['mine']);
        $this->assertNotNull($original);

        $shared = $this->withToken($user['token'])->postJson('/api/posts/'.$original['id'].'/share', [
            'text' => 'Passing this on',
        ])->assertCreated()->json('post');

        $this->assertTrue($shared['mine']);
        $this->assertSame('Passing this on', $shared['text']);
        $this->assertSame($original['id'], $shared['share']['id']);
        $this->assertSame($original['author'], $shared['share']['author']);
        $this->assertSame($original['text'], $shared['share']['text']);

        $own = $this->withToken($user['token'])->postJson('/api/posts', [
            'text' => 'My own note here',
        ])->assertCreated()->json('post');
        $this->withToken($user['token'])->postJson('/api/posts/'.$own['id'].'/share', [
            'text' => 'Again',
        ])->assertStatus(403);
    }

    public function test_a_user_can_reply_to_a_comment(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $post = $this->withToken($user['token'])->postJson('/api/posts', [
            'text' => 'A note worth answering',
        ])->assertCreated()->json('post');

        $commented = $this->withToken($user['token'])->postJson('/api/posts/'.$post['id'].'/comments', [
            'text' => 'First thought',
        ])->assertCreated()->json('post');

        $this->assertCount(1, $commented['comments']);
        $this->assertSame('First thought', $commented['comments'][0]['text']);
        $this->assertSame([], $commented['comments'][0]['replies']);

        $replied = $this->withToken($user['token'])->postJson('/api/posts/'.$post['id'].'/comments', [
            'text' => 'Same here',
            'parent_id' => $commented['comments'][0]['id'],
        ])->assertCreated()->json('post');

        $this->assertCount(1, $replied['comments']);
        $this->assertSame('Same here', $replied['comments'][0]['replies'][0]['text']);

        $this->withToken($user['token'])->postJson('/api/posts/'.$post['id'].'/comments', [
            'text' => 'Still with you',
            'parent_id' => $replied['comments'][0]['replies'][0]['id'],
        ])->assertCreated()->assertJsonPath('post.comments.0.replies.1.text', 'Still with you');

        $this->withToken($user['token'])->postJson('/api/posts/'.$post['id'].'/comments', [
            'text' => 'Nope',
            'parent_id' => 999999,
        ])->assertStatus(404);

        $listed = collect($this->withToken($user['token'])->getJson('/api/posts')->json('posts'))
            ->firstWhere('id', $post['id']);
        $this->assertCount(2, $listed['comments'][0]['replies']);
    }

    public function test_a_user_can_delete_their_own_feedback(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $review = $this->withToken($user['token'])->postJson('/api/reviews', [
            'target' => 'One Night',
            'kind' => 'Event',
            'rating' => 4,
            'text' => 'A short note',
        ])->assertCreated()->json('review');

        $this->withToken($user['token'])->deleteJson('/api/reviews/'.$review['id'])->assertOk();
        $left = collect($this->withToken($user['token'])->getJson('/api/reviews')->json('reviews'));
        $this->assertFalse($left->contains(fn ($row) => $row['id'] === $review['id']));

        auth()->forgetGuards();
        $other = $this->postJson('/api/register', [
            'name' => 'Another Listener',
            'email' => 'another-listener@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertCreated()->json();
        $kept = $this->withToken($other['token'])->postJson('/api/reviews', [
            'target' => 'One Night',
            'kind' => 'Event',
            'rating' => 3,
            'text' => 'Leave this one',
        ])->assertCreated()->json('review');

        auth()->forgetGuards();
        $this->withToken($user['token'])->deleteJson('/api/reviews/'.$kept['id'])->assertStatus(403);

        auth()->forgetGuards();
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();
        $organizerNotes = collect($this->withToken($organizer['token'])->getJson('/api/reviews')->assertOk()->json('reviews'));
        $this->assertTrue($organizerNotes->contains(fn ($row) => $row['text'] === 'Leave this one' && $row['from'] !== ''));

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $adminNotes = collect($this->withToken($admin['token'])->getJson('/api/reviews')->assertOk()->json('reviews'));
        $this->assertTrue($adminNotes->contains(fn ($row) => $row['text'] === 'Leave this one'));
    }

    public function test_a_user_sees_only_their_own_notifications(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $event = collect($this->getJson('/api/events/public')->json('events'))->first();
        $this->withToken($user['token'])->postJson('/api/orders', [
            'eventId' => $event['id'],
            'ticketId' => $event['tickets'][0]['id'],
            'qty' => 1,
            'name' => 'Hnin',
            'email' => 'user@harmony.community',
        ])->assertCreated();

        $notes = collect($this->withToken($user['token'])->getJson('/api/notifications')->assertOk()->json('notifications'));
        $mine = $notes->first(fn ($note) => $note['title'] === 'Tickets reserved' && $note['date']);
        $this->assertNotNull($mine);
        $this->assertTrue($mine['unread']);

        $this->withToken($user['token'])->patchJson('/api/notifications/'.$mine['id'])->assertOk()->assertJsonPath('notification.unread', false);

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $this->withToken($admin['token'])->patchJson('/api/notifications/'.$mine['id'])->assertStatus(403);
        $adminNotes = collect($this->withToken($admin['token'])->getJson('/api/notifications')->assertOk()->json('notifications'));
        $this->assertFalse($adminNotes->contains(fn ($note) => $note['title'] === 'Tickets reserved'));
    }

    public function test_organizer_can_upload_an_event_poster(): void
    {
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();

        $image = $this->withToken($organizer['token'])->post('/api/events/image', [
            'photo' => $this->photoUpload('poster.png'),
        ])->assertOk()->json('image');

        $this->assertMatchesRegularExpression('#^/uploads/events/'.preg_quote((string) $organizer['user']['id'], '#').'-[a-f0-9]{16}\.png$#', $image);
        $this->assertFileExists(storage_path('framework/testing/uploads/events/'.basename($image)));

        $payload = [
            'title' => 'Poster Night',
            'artist' => 'Night Band',
            'category' => 'Rock',
            'date' => '2026-12-20',
            'time' => '8:00 PM',
            'venue' => 'Thuwunna',
            'city' => 'Yangon',
            'price' => 20,
            'image' => $image,
        ];
        $created = $this->withToken($organizer['token'])->postJson('/api/events', $payload)->assertCreated()->json('event');
        $this->assertSame($image, $created['image']);

        $replaced = $this->withToken($organizer['token'])->post('/api/events/image', [
            'photo' => $this->photoUpload('next.png'),
        ])->assertOk()->json('image');
        $updated = $this->withToken($organizer['token'])->patchJson('/api/events/'.$created['id'], [
            ...$payload,
            'image' => $replaced,
        ])->assertOk()->json('event');
        $this->assertSame($replaced, $updated['image']);
        $this->assertFileDoesNotExist(storage_path('framework/testing/uploads/events/'.basename($image)));
        $this->assertFileExists(storage_path('framework/testing/uploads/events/'.basename($replaced)));

        $this->withToken($organizer['token'])->post('/api/events/image', [
            'photo' => UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf'),
        ])->assertStatus(422);

        $this->withToken($organizer['token'])->postJson('/api/events', [
            ...$payload,
            'title' => 'Bad Poster',
            'image' => 'https://evil.example/poster.jpg',
        ])->assertStatus(400);

        $this->withToken($organizer['token'])->deleteJson('/api/events/'.$created['id'])->assertOk();
        $this->assertFileDoesNotExist(storage_path('framework/testing/uploads/events/'.basename($replaced)));

        auth()->forgetGuards();
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();
        $this->withToken($user['token'])->post('/api/events/image', [
            'photo' => $this->photoUpload('listener.png'),
        ])->assertStatus(403);
    }

    public function test_course_enrollments_stay_with_the_organizer(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $course = collect($this->getJson('/api/programs/courses/public')->json('items'))->first();
        $created = $this->withToken($user['token'])->postJson('/api/enrollments', [
            'courseId' => $course['id'],
            'name' => 'Hanni',
            'email' => 'hanni@gmail.com',
            'phone' => '09123456789',
            'message' => 'Evening class please',
        ])->assertCreated()->json('enrollment');
        $this->assertSame('Pending', $created['status']);
        $this->withToken($user['token'])->patchJson('/api/enrollments/'.$created['id'], [
            'status' => 'Enrolled',
        ])->assertStatus(403);

        $mine = collect($this->withToken($user['token'])->getJson('/api/enrollments')->assertOk()->json('enrollments'));
        $this->assertTrue($mine->contains(fn ($row) => $row['title'] === $created['title'] && $row['status'] === 'Pending'));

        auth()->forgetGuards();
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();
        $desk = collect($this->withToken($organizer['token'])->getJson('/api/enrollments')->assertOk()->json('enrollments'));
        $this->assertTrue($desk->contains(fn ($row) => $row['name'] === 'Hanni' && $row['message'] === 'Evening class please' && $row['status'] === 'Pending'));
        $confirmed = $this->withToken($organizer['token'])->patchJson('/api/enrollments/'.$created['id'], [
            'status' => 'Enrolled',
        ])->assertOk()->json('enrollment');
        $this->assertSame('Enrolled', $confirmed['status']);
        $this->withToken($organizer['token'])->patchJson('/api/enrollments/'.$created['id'], [
            'status' => 'Enrolled',
        ])->assertStatus(400);

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $this->withToken($admin['token'])->getJson('/api/enrollments')->assertStatus(403);
        $this->withToken($admin['token'])->getJson('/api/programs/enrollments')->assertStatus(404);
        $this->withToken($organizer['token'])->postJson('/api/programs/centers', [
            'name' => 'Melody',
            'city' => 'Magway',
            'email' => 'melody@example.com',
        ])->assertStatus(404);
        $this->getJson('/api/programs/centers/public')->assertStatus(404);
    }

    public function test_workshop_registrations_stay_with_the_organizer(): void
    {
        $user = $this->postJson('/api/login', [
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
        ])->assertOk()->json();

        $workshop = collect($this->getJson('/api/programs/workshops/public')->json('items'))->first();
        $created = $this->withToken($user['token'])->postJson('/api/workshop-registrations', [
            'workshopId' => $workshop['id'],
            'name' => 'Hanni',
            'email' => 'hanni@gmail.com',
            'phone' => '09123456789',
            'level' => 'Some experience',
        ])->assertCreated()->json('registration');
        $this->assertSame($workshop['title'], $created['title']);
        $this->assertSame('Pending', $created['status']);

        auth()->forgetGuards();
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();
        $desk = collect($this->withToken($organizer['token'])->getJson('/api/workshop-registrations')->assertOk()->json('registrations'));
        $this->assertTrue($desk->contains(fn ($row) => $row['name'] === 'Hanni' && $row['title'] === $created['title'] && $row['status'] === 'Pending'));
        $confirmed = $this->withToken($organizer['token'])->patchJson('/api/workshop-registrations/'.$created['id'], [
            'status' => 'Confirmed',
        ])->assertOk()->json('registration');
        $this->assertSame('Confirmed', $confirmed['status']);
        $this->withToken($organizer['token'])->patchJson('/api/workshop-registrations/'.$created['id'], [
            'status' => 'Confirmed',
        ])->assertStatus(400);

        auth()->forgetGuards();
        $admin = $this->postJson('/api/login', [
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
        ])->assertOk()->json();
        $this->withToken($admin['token'])->getJson('/api/workshop-registrations')->assertStatus(403);
    }

    public function test_organizer_can_upload_a_workshop_and_course_photo(): void
    {
        $organizer = $this->postJson('/api/login', [
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
        ])->assertOk()->json();

        $image = $this->withToken($organizer['token'])->post('/api/programs/image', [
            'photo' => $this->photoUpload('class.png'),
        ])->assertOk()->json('image');
        $this->assertMatchesRegularExpression('#^/uploads/programs/'.preg_quote((string) $organizer['user']['id'], '#').'-[a-f0-9]{16}\.png$#', $image);
        $this->assertFileExists(storage_path('framework/testing/uploads/programs/'.basename($image)));

        $workshop = $this->withToken($organizer['token'])->postJson('/api/programs/workshops', [
            'title' => 'Photo Lab',
            'instructor' => 'Hnin',
            'category' => 'Vocals',
            'date' => '2026-12-20',
            'startTime' => '18:00',
            'endTime' => '20:00',
            'location' => 'Studio',
            'city' => 'Yangon',
            'fee' => 15,
            'seats' => 12,
            'image' => $image,
        ])->assertCreated()->json('item');
        $this->assertSame($image, $workshop['image']);

        $courseImage = $this->withToken($organizer['token'])->post('/api/programs/image', [
            'photo' => $this->photoUpload('course.png'),
        ])->assertOk()->json('image');
        $course = $this->withToken($organizer['token'])->postJson('/api/programs/courses', [
            'title' => 'Photo Piano',
            'instrument' => 'Piano',
            'level' => 'Beginner',
            'instructor' => 'Hnin',
            'center' => 'Harbor',
            'date' => '2026-12-20',
            'startTime' => '18:00',
            'endTime' => '20:00',
            'location' => 'Studio',
            'schedule' => 'Mondays',
            'price' => 40,
            'image' => $courseImage,
        ])->assertCreated()->json('item');
        $this->assertSame($courseImage, $course['image']);

        $this->withToken($organizer['token'])->postJson('/api/programs/workshops', [
            'title' => 'Bad Photo',
            'instructor' => 'Hnin',
            'category' => 'Vocals',
            'date' => '2026-12-20',
            'startTime' => '18:00',
            'endTime' => '20:00',
            'location' => 'Studio',
            'city' => 'Yangon',
            'image' => 'https://evil.example/photo.jpg',
        ])->assertStatus(400);

        $this->withToken($organizer['token'])->deleteJson('/api/programs/workshops/'.$workshop['id'])->assertOk();
        $this->assertFileDoesNotExist(storage_path('framework/testing/uploads/programs/'.basename($image)));
        $this->withToken($organizer['token'])->deleteJson('/api/programs/courses/'.$course['id'])->assertOk();
        $this->assertFileDoesNotExist(storage_path('framework/testing/uploads/programs/'.basename($courseImage)));
    }

    private function photoUpload(string $name): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        return UploadedFile::fake()->createWithContent($name, $png);
    }
}
