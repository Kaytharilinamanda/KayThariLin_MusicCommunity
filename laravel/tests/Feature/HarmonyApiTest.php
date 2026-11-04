<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $this->assertTrue($public->contains(fn ($event) => $event['title'] === 'Desk Check'));
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

        $this->assertSame('Paid', $order['status']);
        $this->assertSame($event['title'], $order['event']);

        $this->withToken($user['token'])->getJson('/api/orders')->assertOk()->assertJsonFragment(['event' => $event['title']]);
    }
}
