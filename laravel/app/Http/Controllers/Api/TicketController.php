<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\User;
use App\Support\Records;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $actor = $request->user();
        $query = Ticket::query()->with(['event', 'organizer'])->orderByDesc('created_at');
        if ($actor?->role === 'admin') {
            return ['tickets' => $query->get()->map(fn (Ticket $ticket) => $this->desk($ticket))->values()];
        }
        if ($actor?->role === 'organizer') {
            return ['tickets' => $query->where('organizer_id', $actor->id)->get()->map(fn (Ticket $ticket) => $this->desk($ticket))->values()];
        }
        Records::fail('Only the admin or an organizer can view this desk.', 403);
    }

    public function store(Request $request)
    {
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $event = $this->eventFor($actor, $request->input('eventId'));
        $fields = $this->fields($request->all());
        $ticket = Ticket::create([
            ...$fields,
            'event_id' => $event->id,
            'organizer_id' => $actor->id,
            'approval_status' => 'pending',
        ]);
        Records::notifyAdmins('Ticket waiting for approval', $event->title.' · '.$ticket->name);

        return response()->json(['ticket' => $this->desk($ticket->load(['event', 'organizer']))], 201);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $this->own($actor, $ticket);
        $event = $this->eventFor($actor, $request->input('eventId'));
        $ticket->fill([
            ...$this->fields($request->all()),
            'event_id' => $event->id,
            'approval_status' => 'pending',
            'rejection_reason' => '',
        ])->save();
        Records::notifyAdmins('Ticket resubmitted', $event->title.' · '.$ticket->name);

        return ['ticket' => $this->desk($ticket->fresh(['event', 'organizer']))];
    }

    public function destroy(Request $request, Ticket $ticket)
    {
        Records::requireOrganizer($request->user());
        $this->own($request->user(), $ticket);
        $ticket->delete();

        return ['ok' => true];
    }

    public function review(Request $request, Ticket $ticket)
    {
        Records::requireAdmin($request->user());
        $decision = Records::decision($request->all());
        $ticket->approval_status = $decision;
        $ticket->rejection_reason = Records::reason($request->all(), $decision);
        $ticket->save();
        $ticket->load('event');
        Records::notify(
            $ticket->organizer_id,
            $decision === 'approved' ? 'Ticket approved' : 'Ticket needs changes',
            ($ticket->event?->title ?? 'Ticket').' · '.$ticket->name
        );

        return ['ok' => true];
    }

    private function own(User $actor, Ticket $ticket): void
    {
        if ($ticket->organizer_id !== $actor->id) {
            Records::fail('You can only change your own tickets.', 403);
        }
    }

    private function eventFor(User $actor, mixed $eventId): Event
    {
        $event = Event::query()->find((int) $eventId);
        if (! $event || $event->organizer_id !== $actor->id) {
            Records::fail('Choose one of your events.', 403);
        }

        return $event;
    }

    private function fields(array $body): array
    {
        $name = trim((string) ($body['tier'] ?? $body['name'] ?? ''));
        $price = is_numeric($body['price'] ?? null) ? (float) $body['price'] : NAN;
        $quantity = is_numeric($body['quantity'] ?? null) ? (float) $body['quantity'] : NAN;
        $note = substr(trim((string) ($body['note'] ?? '')), 0, 255);
        $salesStart = Records::dateOrNull($body['salesStart'] ?? '', 'sales start');
        $salesEnd = Records::dateOrNull($body['salesEnd'] ?? '', 'sales end');
        if (strlen($name) < 2) {
            Records::fail('Name the ticket.');
        }
        if (! is_finite($price) || $price < 0) {
            Records::fail('Enter a ticket price of zero or more.');
        }
        if (! is_finite($quantity) || (int) $quantity != $quantity || $quantity < 0) {
            Records::fail('Enter a whole ticket quantity.');
        }
        if ($salesStart && $salesEnd && $salesEnd < $salesStart) {
            Records::fail('Sales end is before the start date.');
        }

        return [
            'name' => $name,
            'price' => $price,
            'quantity' => (int) $quantity,
            'note' => $note,
            'sales_start' => $salesStart,
            'sales_end' => $salesEnd,
        ];
    }

    private function desk(Ticket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'eventId' => $ticket->event_id,
            'event' => $ticket->event?->title ?? '',
            'organizerId' => $ticket->organizer_id,
            'organizer' => $ticket->organizer?->name ?? '',
            'organization' => $ticket->organizer?->organization ?? '',
            'tier' => $ticket->name,
            'price' => (float) $ticket->price,
            'note' => $ticket->note,
            'quantity' => (int) $ticket->quantity,
            'salesStart' => Records::day($ticket->sales_start),
            'salesEnd' => Records::day($ticket->sales_end),
            'status' => Records::label($ticket->approval_status),
            'rejectionReason' => $ticket->rejection_reason ?? '',
        ];
    }
}
