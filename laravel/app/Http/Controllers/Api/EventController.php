<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use App\Support\Records;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $actor = $request->user();
        $query = Event::query()->with('organizer')->orderByDesc('created_at');
        if ($actor?->role === 'admin') {
            return ['events' => $query->get()->map(fn (Event $event) => $this->desk($event))->values()];
        }
        if ($actor?->role === 'organizer') {
            return ['events' => $query->where('organizer_id', $actor->id)->get()->map(fn (Event $event) => $this->desk($event))->values()];
        }
        Records::fail('Only the admin or an organizer can view this desk.', 403);
    }

    public function publicIndex()
    {
        $events = Event::query()
            ->with(['organizer', 'tickets' => fn ($query) => $query->where('approval_status', 'approved')->orderBy('price')])
            ->where('approval_status', 'approved')
            ->whereHas('organizer', fn ($query) => $query->where('status', 'active'))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return ['events' => $events->map(fn (Event $event) => $this->publicEvent($event))->values()];
    }

    public function store(Request $request)
    {
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $fields = $this->fields($request->all());
        $event = Event::create([
            ...$fields,
            'organizer_id' => $actor->id,
            'description' => $fields['blurb'],
            'approval_status' => 'pending',
        ]);
        Records::notifyAdmins('Event waiting for approval', $event->title);

        return response()->json(['event' => $this->desk($event->load('organizer'))], 201);
    }

    public function update(Request $request, Event $event)
    {
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $this->own($actor, $event);
        $fields = $this->fields($request->all());
        $event->fill([
            ...$fields,
            'description' => $fields['blurb'],
            'approval_status' => 'pending',
            'rejection_reason' => '',
        ])->save();
        Records::notifyAdmins('Event resubmitted', $event->title);

        return ['event' => $this->desk($event->fresh('organizer'))];
    }

    public function destroy(Request $request, Event $event)
    {
        Records::requireOrganizer($request->user());
        $this->own($request->user(), $event);
        $event->delete();

        return ['ok' => true];
    }

    public function review(Request $request, Event $event)
    {
        Records::requireAdmin($request->user());
        $decision = Records::decision($request->all());
        $event->approval_status = $decision;
        $event->rejection_reason = Records::reason($request->all(), $decision);
        $event->save();
        Records::notify(
            $event->organizer_id,
            $decision === 'approved' ? 'Event approved' : 'Event needs changes',
            $decision === 'approved' ? $event->title : $event->title.': '.$event->rejection_reason
        );

        return ['ok' => true];
    }

    private function own(User $actor, Event $event): void
    {
        if ($event->organizer_id !== $actor->id) {
            Records::fail('You can only change your own events.', 403);
        }
    }

    private function fields(array $body): array
    {
        $title = trim((string) ($body['title'] ?? ''));
        $artist = trim((string) ($body['artist'] ?? ''));
        $category = in_array($body['category'] ?? '', Records::EVENT_CATEGORIES, true) ? $body['category'] : '';
        $eventDate = Records::dateOrNull($body['date'] ?? '', 'date');
        $eventTime = trim((string) ($body['time'] ?? ''));
        $venue = trim((string) ($body['venue'] ?? ''));
        $city = trim((string) ($body['city'] ?? ''));
        $address = trim((string) ($body['address'] ?? ''));
        $blurb = substr(trim((string) ($body['blurb'] ?? '')), 0, 500);
        $price = is_numeric($body['price'] ?? null) ? (float) $body['price'] : NAN;

        if (strlen($title) < 2) {
            Records::fail('Add an event title.');
        }
        if (strlen($artist) < 2) {
            Records::fail('Add the artist.');
        }
        if ($category === '') {
            Records::fail('Choose a category.');
        }
        if (! $eventDate) {
            Records::fail('Add the event date.');
        }
        if ($eventTime === '') {
            Records::fail('Add the start time.');
        }
        if (strlen($venue) < 2) {
            Records::fail('Add the venue.');
        }
        if (strlen($city) < 2) {
            Records::fail('Add the city.');
        }
        if (! is_finite($price) || $price < 0) {
            Records::fail('Enter a price of zero or more.');
        }

        return [
            'title' => $title,
            'artist' => $artist,
            'category' => $category,
            'event_date' => $eventDate,
            'event_time' => $eventTime,
            'venue' => $venue,
            'city' => $city,
            'address' => $address,
            'blurb' => $blurb,
            'price' => $price,
        ];
    }

    private function desk(Event $event): array
    {
        $organizer = $event->organizer;

        return [
            'id' => $event->id,
            'organizerId' => $event->organizer_id,
            'organizer' => $organizer?->name ?? '',
            'organization' => $organizer?->organization ?? '',
            'title' => $event->title,
            'artist' => $event->artist,
            'category' => $event->category,
            'date' => Records::day($event->event_date),
            'time' => $event->event_time,
            'venue' => $event->venue,
            'address' => $event->address,
            'city' => $event->city,
            'price' => (float) $event->price,
            'blurb' => $event->blurb,
            'status' => Records::label($event->approval_status),
            'rejectionReason' => $event->rejection_reason ?? '',
        ];
    }

    private function publicEvent(Event $event): array
    {
        return [
            'id' => $event->slug ?: 'live-'.$event->id,
            'title' => $event->title,
            'artist' => $event->artist,
            'category' => $event->category,
            'date' => Records::day($event->event_date),
            'time' => $event->event_time,
            'venue' => $event->venue,
            'address' => $event->address ?: $event->venue,
            'city' => $event->city,
            'price' => (float) $event->price,
            'image' => $event->image ?: '/images/crowd.jpg',
            'imageClass' => $event->image_class ?? '',
            'featured' => (bool) $event->featured,
            'status' => 'Approved',
            'blurb' => $event->blurb ?: $event->artist.' at '.$event->venue.'.',
            'description' => $event->description ?: $event->blurb,
            'lineup' => $event->lineup ?: array_values(array_filter([$event->artist])),
            'tickets' => $event->tickets->map(fn ($ticket) => [
                'id' => $ticket->slug ?: 'live-tk-'.$ticket->id,
                'name' => $ticket->name,
                'price' => (float) $ticket->price,
                'note' => $ticket->note ?: 'General admission',
                'left' => max(0, (int) $ticket->quantity - (int) $ticket->sold),
            ])->values(),
        ];
    }
}
