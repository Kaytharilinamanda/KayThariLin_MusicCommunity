<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\Event;
use App\Models\Program;
use App\Models\Review;
use App\Models\Ticket;
use App\Models\TicketOrder;
use App\Models\WorkshopRegistration;
use App\Support\Records;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function orders(Request $request)
    {
        $actor = $request->user();
        $query = TicketOrder::query()->orderByDesc('id');
        if ($actor->role === 'admin') {
            $rows = $query->get();
        } elseif ($actor->role === 'organizer') {
            $eventIds = Event::query()->where('organizer_id', $actor->id)->pluck('id');
            $rows = $query->whereIn('event_id', $eventIds)->get();
        } else {
            $rows = $query->where('user_id', $actor->id)->get();
        }

        return ['orders' => $rows->map(fn (TicketOrder $order) => $this->order($order))->values()];
    }

    public function storeOrder(Request $request)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $name = trim((string) $request->input('name'));
        $email = Records::email((string) $request->input('email'));
        $qty = (int) $request->input('qty');
        if (strlen($name) < 2) {
            Records::fail('Add the name for the tickets.');
        }
        if ($qty < 1 || $qty > 6) {
            Records::fail('Choose between 1 and 6 tickets.');
        }
        $event = $this->findEvent($request->input('eventId'));
        $ticket = $this->findTicket($event, $request->input('ticketId'));
        if ($ticket->approval_status !== 'approved' || $event->approval_status !== 'approved') {
            Records::fail('Those tickets are not on sale.', 403);
        }
        $left = (int) $ticket->quantity - (int) $ticket->sold;
        if ($qty > $left) {
            Records::fail('Not enough tickets left.');
        }
        $subtotal = (float) $ticket->price * $qty;
        $total = $subtotal + round($subtotal * 0.08);

        $order = DB::transaction(function () use ($actor, $event, $ticket, $name, $email, $qty, $total) {
            $ticket->increment('sold', $qty);
            $order = TicketOrder::create([
                'user_id' => $actor->id,
                'event_id' => $event->id,
                'ticket_id' => $ticket->id,
                'code' => 'NR-'.str_pad((string) (TicketOrder::query()->max('id') + 1), 4, '0', STR_PAD_LEFT),
                'buyer_name' => $name,
                'email' => $email,
                'event_title' => $event->title,
                'tier' => $ticket->name,
                'qty' => $qty,
                'total' => $total,
                'status' => 'Paid',
            ]);
            $order->code = 'NR-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT);
            $order->save();

            return $order;
        });

        Records::notify($event->organizer_id, 'New ticket order', $order->code.' · '.$event->title);
        Records::notifyAdmins('New ticket order', $order->code.' · '.$event->title);
        Records::notify($actor->id, 'Tickets reserved', $order->code.' · '.$event->title);

        return response()->json(['order' => $this->order($order)], 201);
    }

    public function updateOrder(Request $request, TicketOrder $order)
    {
        $actor = $request->user();
        if ($actor->role !== 'admin' && $order->user_id !== $actor->id) {
            Records::fail('You can only change your own orders.', 403);
        }
        $status = (string) $request->input('status');
        if (! in_array($status, ['Cancelled', 'Refund requested', 'Paid', 'Pending'], true)) {
            Records::fail('That order status is not available.');
        }
        if (in_array($order->status, ['Cancelled', 'Refunded'], true)) {
            Records::fail('This order is already closed.');
        }
        if ($status === 'Cancelled' && $order->ticket) {
            $order->ticket->decrement('sold', min((int) $order->qty, (int) $order->ticket->sold));
        }
        $order->status = $status;
        $order->save();

        return ['order' => $this->order($order)];
    }

    public function workshops(Request $request)
    {
        return [
            'registrations' => WorkshopRegistration::query()
                ->where('user_id', $request->user()->id)
                ->orderByDesc('id')
                ->get()
                ->map(fn (WorkshopRegistration $row) => [
                    'id' => $row->id,
                    'title' => $row->title,
                    'date' => $row->event_date,
                    'city' => $row->city,
                    'status' => $row->status,
                ])->values(),
        ];
    }

    public function storeWorkshop(Request $request)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $name = trim((string) $request->input('name'));
        $email = Records::email((string) $request->input('email'));
        $phone = trim((string) $request->input('phone'));
        if (strlen($name) < 2) {
            Records::fail('Add your name.');
        }
        if (strlen($phone) < 6) {
            Records::fail('Add a phone number.');
        }
        $program = $this->findProgram('workshop', $request->input('workshopId'));
        $payload = $program->payload ?? [];
        $row = WorkshopRegistration::create([
            'user_id' => $actor->id,
            'program_id' => $program->id,
            'title' => $payload['title'] ?? 'Workshop',
            'event_date' => $payload['date'] ?? '',
            'city' => $payload['city'] ?? '',
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'level' => trim((string) $request->input('level')),
            'status' => 'Confirmed',
        ]);
        Records::notify($program->organizer_id, 'Workshop registration', $row->title);
        Records::notify($actor->id, 'Workshop seat saved', $row->title);

        return response()->json(['registration' => [
            'id' => $row->id,
            'title' => $row->title,
            'date' => $row->event_date,
            'city' => $row->city,
            'status' => $row->status,
        ]], 201);
    }

    public function updateWorkshop(Request $request, WorkshopRegistration $registration)
    {
        $actor = $request->user();
        if ($registration->user_id !== $actor->id) {
            Records::fail('You can only change your own registrations.', 403);
        }
        if ($request->input('status') !== 'Cancelled') {
            Records::fail('That status is not available.');
        }
        $registration->status = 'Cancelled';
        $registration->save();

        return ['registration' => [
            'id' => $registration->id,
            'title' => $registration->title,
            'date' => $registration->event_date,
            'city' => $registration->city,
            'status' => $registration->status,
        ]];
    }

    public function enrollments(Request $request)
    {
        return [
            'enrollments' => CourseEnrollment::query()
                ->where('user_id', $request->user()->id)
                ->orderByDesc('id')
                ->get()
                ->map(fn (CourseEnrollment $row) => [
                    'id' => $row->id,
                    'title' => $row->title,
                    'center' => $row->center,
                    'date' => $row->event_date,
                    'status' => $row->status,
                ])->values(),
        ];
    }

    public function storeEnrollment(Request $request)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $name = trim((string) $request->input('name'));
        $email = Records::email((string) $request->input('email'));
        $phone = trim((string) $request->input('phone'));
        $message = trim((string) $request->input('message'));
        if (strlen($name) < 2) {
            Records::fail('Add your name.');
        }
        if (strlen($phone) < 6) {
            Records::fail('Add a phone number.');
        }
        $program = $this->findProgram('course', $request->input('courseId'));
        $payload = $program->payload ?? [];
        $row = CourseEnrollment::create([
            'user_id' => $actor->id,
            'program_id' => $program->id,
            'title' => $payload['title'] ?? 'Course',
            'center' => $payload['center'] ?? '',
            'event_date' => now()->toDateString(),
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'message' => $message,
            'status' => 'Pending',
        ]);
        if ($message !== '') {
            Review::create([
                'user_id' => $actor->id,
                'target' => $row->title,
                'kind' => 'Course',
                'rating' => 0,
                'text' => $message,
                'status' => 'New',
            ]);
        }
        Records::notify($program->organizer_id, 'Course enrollment', $row->title.' · '.$name);
        Records::notifyAdmins('Enrollment waiting', $row->title.' · '.$name);
        Records::notify($actor->id, 'Enrollment request saved', $row->title);

        return response()->json(['enrollment' => [
            'id' => $row->id,
            'title' => $row->title,
            'center' => $row->center,
            'date' => $row->event_date,
            'status' => $row->status,
        ]], 201);
    }

    public function reviews(Request $request)
    {
        $actor = $request->user();
        $query = Review::query()->with('user')->orderByDesc('id');
        if ($actor->role === 'organizer') {
            $titles = $this->organizerTitles($actor->id);
            $query->whereIn('target', $titles);
        } elseif ($actor->role !== 'admin') {
            $query->where('user_id', $actor->id);
        }

        return ['reviews' => $query->get()->map(fn (Review $review) => $this->review($review))->values()];
    }

    public function storeReview(Request $request)
    {
        $actor = $request->user();
        Records::requireUser($actor);
        $target = trim((string) $request->input('target'));
        $text = trim((string) $request->input('text'));
        $kind = in_array($request->input('kind'), ['Event', 'Workshop', 'Course', 'Complaint'], true) ? $request->input('kind') : 'Event';
        $rating = (int) $request->input('rating', 5);
        if (strlen($target) < 2) {
            Records::fail('Say what the note is about.');
        }
        if (strlen($text) < 4) {
            Records::fail('Add a short note before sending feedback.');
        }
        if ($rating < 0 || $rating > 5) {
            Records::fail('Choose a rating from 1 to 5.');
        }
        $review = Review::create([
            'user_id' => $actor->id,
            'target' => $target,
            'kind' => $kind,
            'rating' => $rating,
            'text' => $text,
            'status' => 'New',
        ]);
        Records::notifyAdmins('New feedback', $target);
        $this->notifyOrganizerForTarget($target, 'New enquiry', $actor->name.': '.$text);

        return response()->json(['review' => $this->review($review->load('user'))], 201);
    }

    public function updateReview(Request $request, Review $review)
    {
        Records::requireAdmin($request->user());
        $review->fill([
            'target' => trim((string) $request->input('target', $review->target)),
            'kind' => (string) $request->input('kind', $review->kind),
            'rating' => (int) $request->input('rating', $review->rating),
            'text' => trim((string) $request->input('text', $review->text)),
            'status' => (string) $request->input('status', $review->status),
        ])->save();

        return ['review' => $this->review($review->fresh('user'))];
    }

    public function destroyReview(Request $request, Review $review)
    {
        $actor = $request->user();
        if ($actor->role !== 'admin' && (int) $review->user_id !== (int) $actor->id) {
            Records::fail('You can only delete your own feedback.', 403);
        }
        $review->delete();

        return ['ok' => true];
    }

    public function enquiries(Request $request)
    {
        $actor = $request->user();
        if ($actor->role !== 'organizer') {
            Records::fail('Only an organizer can view these enquiries.', 403);
        }
        $titles = $this->organizerTitles($actor->id);
        $rows = Review::query()->with('user')->whereIn('target', $titles)->orderByDesc('id')->get();

        return ['enquiries' => $rows->map(fn (Review $review) => [
            'id' => $review->id,
            'from' => $review->user?->name ?? 'Member',
            'event' => $review->target,
            'message' => $review->text,
            'status' => $review->status,
        ])->values()];
    }

    private function order(TicketOrder $order): array
    {
        return [
            'id' => $order->code,
            'recordId' => $order->id,
            'event' => $order->event_title,
            'tier' => $order->tier,
            'qty' => (int) $order->qty,
            'total' => (float) $order->total,
            'status' => $order->status,
            'date' => Records::day($order->created_at),
            'buyer' => $order->buyer_name,
            'email' => $order->email,
        ];
    }

    private function review(Review $review): array
    {
        return [
            'id' => $review->id,
            'target' => $review->target,
            'kind' => $review->kind,
            'rating' => (int) $review->rating,
            'text' => $review->text,
            'status' => $review->status,
            'date' => Records::day($review->created_at),
            'from' => $review->user?->name ?? '',
        ];
    }

    private function findEvent(mixed $publicId): Event
    {
        $key = (string) $publicId;
        $event = null;
        if (str_starts_with($key, 'live-') && ! str_starts_with($key, 'live-tk-')) {
            $event = Event::query()->find((int) substr($key, 5));
        }
        $event ??= Event::query()->where('slug', $key)->first();
        if (! $event && ctype_digit($key)) {
            $event = Event::query()->find((int) $key);
        }
        if (! $event) {
            Records::fail('That event was not found.', 404);
        }

        return $event;
    }

    private function findTicket(Event $event, mixed $publicId): Ticket
    {
        $key = (string) $publicId;
        $ticket = null;
        if (str_starts_with($key, 'live-tk-')) {
            $ticket = Ticket::query()->where('event_id', $event->id)->find((int) substr($key, 8));
        }
        $ticket ??= Ticket::query()->where('event_id', $event->id)->where('slug', $key)->first();
        if (! $ticket) {
            Records::fail('That ticket was not found.', 404);
        }

        return $ticket;
    }

    private function findProgram(string $kind, mixed $publicId): Program
    {
        $key = (string) $publicId;
        $query = Program::query()->where('kind', $kind)->where('approval_status', 'approved');
        $program = null;
        if (str_starts_with($key, 'live-')) {
            $program = (clone $query)->find((int) preg_replace('/\D+/', '', $key));
        }
        $program ??= (clone $query)->where('slug', $key)->first();
        if (! $program && ctype_digit($key)) {
            $program = (clone $query)->find((int) $key);
        }
        if (! $program) {
            Records::fail('That listing was not found.', 404);
        }

        return $program;
    }

    private function organizerTitles(int $organizerId): array
    {
        $events = Event::query()->where('organizer_id', $organizerId)->pluck('title');
        $programs = Program::query()->where('organizer_id', $organizerId)->get()->map(function (Program $program) {
            return $program->payload['title'] ?? $program->payload['name'] ?? null;
        })->filter();

        return $events->merge($programs)->unique()->values()->all();
    }

    private function notifyOrganizerForTarget(string $target, string $title, string $detail): void
    {
        $event = Event::query()->where('title', $target)->first();
        if ($event) {
            Records::notify($event->organizer_id, $title, $detail);

            return;
        }
        $program = Program::query()->get()->first(function (Program $row) use ($target) {
            return ($row->payload['title'] ?? $row->payload['name'] ?? '') === $target;
        });
        if ($program) {
            Records::notify($program->organizer_id, $title, $detail);
        }
    }
}
