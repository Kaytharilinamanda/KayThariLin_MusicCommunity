<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Comment;
use App\Models\CommunityMember;
use App\Models\CourseEnrollment;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Program;
use App\Models\Review;
use App\Models\Ticket;
use App\Models\TicketOrder;
use App\Models\Topic;
use App\Models\User;
use App\Models\WorkshopRegistration;
use Illuminate\Database\Seeder;

class HarmonySeeder extends Seeder
{
    public function run(): void
    {
        $catalog = json_decode(file_get_contents(database_path('seeders/catalog.json')), true);
        $admin = User::create([
            'name' => 'Harmony Admin',
            'email' => 'admin@harmony.community',
            'password' => 'HarmonyAdmin1',
            'role' => 'admin',
            'status' => 'active',
            'phone' => '+95 9 000 000 001',
            'city' => 'Yangon',
            'organization' => 'Harmony',
        ]);
        $organizer = User::create([
            'name' => 'Yangon Live',
            'email' => 'organizer@harmony.community',
            'password' => 'Organizer123',
            'role' => 'organizer',
            'status' => 'active',
            'phone' => '+95 9 420 118 220',
            'city' => 'Yangon',
            'organization' => 'Yangon Live',
        ]);
        $listener = User::create([
            'name' => 'Hnin',
            'email' => 'user@harmony.community',
            'password' => 'Listener123',
            'role' => 'user',
            'status' => 'active',
            'phone' => '+95 9 111 222 333',
            'city' => 'Yangon',
            'organization' => '',
        ]);

        $events = [];
        foreach ($catalog['events'] as $event) {
            $row = Event::create([
                'organizer_id' => $organizer->id,
                'slug' => $event['id'],
                'title' => $event['title'],
                'artist' => $event['artist'],
                'category' => $event['category'],
                'event_date' => $event['date'],
                'event_time' => $event['time'],
                'venue' => $event['venue'],
                'address' => $event['address'] ?? '',
                'city' => $event['city'],
                'price' => $event['price'],
                'image' => $event['image'] ?? '/images/crowd.jpg',
                'image_class' => $event['imageClass'] ?? '',
                'featured' => (bool) ($event['featured'] ?? false),
                'blurb' => $event['blurb'] ?? '',
                'description' => $event['description'] ?? '',
                'lineup' => $event['lineup'] ?? [],
                'approval_status' => 'approved',
            ]);
            $events[$event['title']] = $row;
            foreach ($event['tickets'] ?? [] as $ticket) {
                Ticket::create([
                    'event_id' => $row->id,
                    'organizer_id' => $organizer->id,
                    'slug' => $ticket['id'],
                    'name' => $ticket['name'],
                    'price' => $ticket['price'],
                    'note' => $ticket['note'] ?? '',
                    'quantity' => (int) ($ticket['left'] ?? 0),
                    'sold' => 0,
                    'approval_status' => 'approved',
                ]);
            }
        }

        $schools = collect($catalog['schools'])->keyBy('id');
        foreach ($catalog['workshops'] as $workshop) {
            $slug = $workshop['id'];
            unset($workshop['id']);
            Program::create([
                'organizer_id' => $organizer->id,
                'kind' => 'workshop',
                'slug' => $slug,
                'payload' => $workshop,
                'approval_status' => 'approved',
            ]);
        }
        foreach ($catalog['courses'] as $course) {
            $slug = $course['id'];
            $school = $schools->get($course['centerId'] ?? '');
            unset($course['id']);
            $course['center'] = $school['name'] ?? ($course['center'] ?? '');
            if ($school) {
                $course['school'] = $school;
            }
            Program::create([
                'organizer_id' => $organizer->id,
                'kind' => 'course',
                'slug' => $slug,
                'payload' => $course,
                'approval_status' => 'approved',
            ]);
        }
        foreach ($catalog['schools'] as $school) {
            $slug = $school['id'];
            unset($school['id']);
            Program::create([
                'organizer_id' => $organizer->id,
                'kind' => 'center',
                'slug' => $slug,
                'payload' => $school,
                'approval_status' => 'approved',
            ]);
        }
        $courseCounts = collect($catalog['courses'])->countBy('instrument');
        foreach ($catalog['instruments'] as $name) {
            Program::create([
                'organizer_id' => $organizer->id,
                'kind' => 'category',
                'slug' => str($name)->slug(),
                'payload' => ['name' => $name, 'courses' => (int) ($courseCounts[$name] ?? 0)],
                'approval_status' => 'approved',
            ]);
        }
        foreach ($catalog['enrollments'] as $enrollment) {
            $status = $enrollment['status'] === 'Confirmed' ? 'approved' : 'pending';
            Program::create([
                'organizer_id' => $organizer->id,
                'kind' => 'enrollment',
                'slug' => strtolower($enrollment['id']),
                'payload' => [
                    'student' => $enrollment['student'],
                    'email' => $enrollment['email'],
                    'course' => $enrollment['course'],
                    'center' => $enrollment['center'],
                    'date' => $enrollment['date'],
                ],
                'approval_status' => $status,
            ]);
            CourseEnrollment::create([
                'user_id' => null,
                'title' => $enrollment['course'],
                'center' => $enrollment['center'],
                'event_date' => $enrollment['date'],
                'name' => $enrollment['student'],
                'email' => $enrollment['email'],
                'status' => $enrollment['status'],
            ]);
        }

        foreach ($catalog['orders'] as $order) {
            $event = $events[$order['event']] ?? null;
            $ticket = $event?->tickets()->where('name', $order['tier'])->first();
            if ($ticket) {
                $ticket->sold = min((int) $ticket->quantity, (int) $ticket->sold + (int) $order['qty']);
                $ticket->save();
            }
            TicketOrder::create([
                'user_id' => null,
                'event_id' => $event?->id,
                'ticket_id' => $ticket?->id,
                'code' => $order['id'],
                'buyer_name' => $order['buyer'],
                'email' => $order['email'],
                'event_title' => $order['event'],
                'tier' => $order['tier'],
                'qty' => $order['qty'],
                'total' => $order['total'],
                'status' => $order['status'],
                'created_at' => $order['date'].' 12:00:00',
                'updated_at' => $order['date'].' 12:00:00',
            ]);
        }

        foreach ($catalog['announcements'] as $note) {
            Announcement::create([
                'user_id' => $organizer->id,
                'kind' => 'announcement',
                'title' => $note['title'],
                'audience' => $note['audience'],
                'channel' => $note['channel'],
                'status' => $note['status'],
                'published_on' => $note['date'],
                'event_name' => '',
            ]);
        }

        foreach ($catalog['posts'] as $post) {
            $row = Post::create([
                'user_id' => null,
                'author_name' => $post['author'],
                'handle' => $post['handle'],
                'avatar' => $post['avatar'],
                'role_label' => $post['role'],
                'topic' => $post['topic'],
                'text' => $post['text'],
                'image' => $post['image'] ?? '',
                'likes_count' => (int) ($post['likes'] ?? 0),
                'status' => 'Visible',
                'created_at' => now()->subHours(2),
            ]);
            foreach ($post['comments'] ?? [] as $comment) {
                Comment::create([
                    'post_id' => $row->id,
                    'author_name' => $comment['author'],
                    'avatar' => $comment['avatar'] ?? '/avatars/sam.svg',
                    'text' => $comment['text'],
                    'created_at' => now()->subHour(),
                ]);
            }
        }

        foreach ($catalog['members'] as $member) {
            CommunityMember::create([
                'name' => $member['name'],
                'role_label' => $member['role'],
                'city' => $member['city'],
                'avatar' => $member['avatar'],
            ]);
        }
        foreach ($catalog['topics'] as $topic) {
            Topic::create(['tag' => $topic['tag'], 'posts_count' => $topic['posts']]);
        }

        Review::create([
            'user_id' => $listener->id,
            'target' => 'One Night',
            'kind' => 'Event',
            'rating' => 5,
            'text' => 'The second song filled the floor. Sound was clear from the lounge.',
            'status' => 'New',
        ]);

        Notification::create([
            'user_id' => $admin->id,
            'title' => 'Studio is ready',
            'detail' => 'Accounts, events, and the community feed are in MySQL.',
        ]);
        Notification::create([
            'user_id' => $organizer->id,
            'title' => 'New ticket order',
            'detail' => 'NR-2048 · One Night',
        ]);

        WorkshopRegistration::create([
            'user_id' => $listener->id,
            'title' => $catalog['workshops'][0]['title'] ?? 'Workshop',
            'event_date' => $catalog['workshops'][0]['date'] ?? '',
            'city' => $catalog['workshops'][0]['city'] ?? '',
            'name' => $listener->name,
            'email' => $listener->email,
            'phone' => $listener->phone,
            'status' => 'Confirmed',
        ]);
    }
}
