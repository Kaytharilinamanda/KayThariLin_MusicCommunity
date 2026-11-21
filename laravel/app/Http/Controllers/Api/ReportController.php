<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;
use App\Support\Desk;
use App\Support\Records;
use Illuminate\Http\Request;

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
        $user = $request->user();
        if ($user->role === 'organizer') {
            return ['dashboard' => Desk::organizer($user)];
        }
        Records::requireAdmin($user);

        return ['dashboard' => Desk::admin($user)];
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
