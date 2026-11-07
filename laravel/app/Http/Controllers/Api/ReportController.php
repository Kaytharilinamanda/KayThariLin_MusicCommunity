<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Program;
use App\Models\Ticket;
use App\Models\TicketOrder;
use App\Models\User;
use App\Models\WorkshopRegistration;
use App\Support\Records;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function show(Request $request)
    {
        Records::requireAdmin($request->user());
        $accounts = User::query()->selectRaw("
            SUM(role = 'user') as users,
            SUM(role = 'organizer') as organizers,
            SUM(role = 'user' AND status = 'active') as active_users,
            SUM(role = 'organizer' AND status = 'pending') as pending_organizers,
            SUM(role = 'admin') as admins
        ")->first();
        $pendingEvents = Event::query()->with('organizer')->where('approval_status', 'pending')->latest()->limit(8)->get();
        $pendingTickets = Ticket::query()->with(['event', 'organizer'])->where('approval_status', 'pending')->latest()->limit(8)->get();

        return ['report' => [
            'generatedAt' => now()->toIso8601String(),
            'admins' => (int) ($accounts->admins ?? 0),
            'accounts' => [
                'users' => (int) ($accounts->users ?? 0),
                'activeUsers' => (int) ($accounts->active_users ?? 0),
                'organizers' => (int) ($accounts->organizers ?? 0),
                'pendingOrganizers' => (int) ($accounts->pending_organizers ?? 0),
            ],
            'events' => $this->tally(Event::class),
            'tickets' => $this->tally(Ticket::class),
            'waiting' => [
                ...$pendingEvents->map(fn (Event $event) => [
                    'kind' => 'Event',
                    'title' => $event->title,
                    'owner' => $event->organizer?->name ?? '',
                ]),
                ...$pendingTickets->map(fn (Ticket $ticket) => [
                    'kind' => 'Ticket',
                    'title' => ($ticket->event?->title ?? 'Event').' · '.$ticket->name,
                    'owner' => $ticket->organizer?->name ?? '',
                ]),
            ],
        ]];
    }

    public function dashboard(Request $request)
    {
        Records::requireAdmin($request->user());
        $orders = TicketOrder::query()->get();
        $paid = $orders->where('status', 'Paid');
        $events = Event::query()->get();
        $colors = ['Pop' => '#f6c9cb', 'Hip-Hop' => '#b42334', 'R&B' => '#7a1220', 'Rock' => '#e7a4a8'];
        $genre = $events->where('approval_status', 'approved')->groupBy('category')->map(function ($group, $label) use ($colors) {
            return ['label' => $label, 'value' => $group->count(), 'color' => $colors[$label] ?? '#e7a4a8'];
        })->values();
        $series = collect(range(5, 0))->map(function ($ago) {
            $month = now()->subMonths($ago);
            $total = TicketOrder::query()
                ->where('status', 'Paid')
                ->whereBetween('created_at', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
                ->sum('total');

            return ['label' => $month->format('M'), 'value' => (int) round($total)];
        })->values();
        $pending = Event::query()->with('organizer')->where('approval_status', 'pending')->latest()->limit(5)->get();

        return ['dashboard' => [
            'sales' => (float) $paid->sum('total'),
            'seats' => (int) $paid->sum('qty'),
            'orders' => $orders->count(),
            'events' => $events->count(),
            'pendingEvents' => $events->where('approval_status', 'pending')->count(),
            'workshops' => Program::query()->where('kind', 'workshop')->count(),
            'enrollments' => CourseEnrollment::query()->count() + Program::query()->where('kind', 'enrollment')->count(),
            'registrations' => WorkshopRegistration::query()->count(),
            'accounts' => User::query()->count(),
            'announcements' => \App\Models\Announcement::query()->where('status', 'Published')->count(),
            'revenueSeries' => $series,
            'genreSplit' => $genre,
            'waiting' => $pending->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'detail' => ($event->organizer?->organization ?: $event->organizer?->name).' · waiting for approval',
                'to' => '/admin/events',
                'status' => 'Pending',
            ])->values(),
            'ordersList' => TicketOrder::query()->latest()->limit(5)->get()->map(fn (TicketOrder $order) => [
                'id' => $order->code,
                'buyer' => $order->buyer_name,
                'event' => $order->event_title,
                'total' => (float) $order->total,
                'status' => $order->status,
            ])->values(),
            'activity' => Notification::query()->where('user_id', $request->user()->id)->latest()->limit(6)->get()->map(fn (Notification $note) => [
                'id' => $note->id,
                'text' => $note->title.($note->detail ? ' · '.$note->detail : ''),
                'time' => Records::ago($note->created_at),
            ])->values(),
        ]];
    }

    public function notifications(Request $request)
    {
        return ['notifications' => Notification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(40)
            ->get()
            ->map(fn (Notification $note) => $this->note($note))->values()];
    }

    public function readNotification(Request $request, Notification $notification)
    {
        $this->ownNote($request, $notification);
        if (! $notification->read_at) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return ['notification' => $this->note($notification)];
    }

    public function readNotifications(Request $request)
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return ['ok' => true];
    }

    private function ownNote(Request $request, Notification $notification): void
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            Records::fail('You can only update your own notifications.', 403);
        }
    }

    private function note(Notification $note): array
    {
        return [
            'id' => $note->id,
            'title' => $note->title,
            'detail' => $note->detail,
            'time' => Records::ago($note->created_at),
            'date' => Records::day($note->created_at),
            'unread' => $note->read_at === null,
        ];
    }

    private function tally(string $model): array
    {
        $rows = $model::query()->selectRaw('approval_status, COUNT(*) as total')->groupBy('approval_status')->get();

        return [
            'pending' => (int) ($rows->firstWhere('approval_status', 'pending')->total ?? 0),
            'approved' => (int) ($rows->firstWhere('approval_status', 'approved')->total ?? 0),
            'rejected' => (int) ($rows->firstWhere('approval_status', 'rejected')->total ?? 0),
        ];
    }
}
