<?php

namespace App\Support;

use App\Models\Event;
use App\Models\Notification;
use App\Models\TicketOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class Desk
{
    public static function for(User $user): ?array
    {
        if ($user->role === 'organizer') {
            return self::organizer($user);
        }
        if ($user->role === 'admin') {
            return self::admin($user);
        }

        return null;
    }

    public static function organizer(User $user): array
    {
        $row = DB::selectOne(
            "SELECT
                (SELECT COUNT(*) FROM events WHERE organizer_id = ?) AS events,
                (SELECT COALESCE(SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END), 0) FROM events WHERE organizer_id = ?) AS approved,
                (SELECT COALESCE(SUM(CASE WHEN o.status IN ('Paid', 'Confirmed') THEN o.total ELSE 0 END), 0)
                    FROM ticket_orders o INNER JOIN events e ON e.id = o.event_id WHERE e.organizer_id = ?) AS sales,
                (SELECT COALESCE(SUM(o.qty), 0)
                    FROM ticket_orders o INNER JOIN events e ON e.id = o.event_id WHERE e.organizer_id = ?) AS seats",
            [$user->id, $user->id, $user->id, $user->id]
        );

        return [
            'role' => 'organizer',
            'events' => (int) $row->events,
            'approved' => (int) $row->approved,
            'sales' => (float) $row->sales,
            'seats' => (int) $row->seats,
        ];
    }

    public static function admin(User $user): array
    {
        $row = DB::selectOne(
            "SELECT
                (SELECT COUNT(*) FROM ticket_orders) AS orders,
                (SELECT COALESCE(SUM(CASE WHEN status IN ('Paid', 'Confirmed') THEN total ELSE 0 END), 0) FROM ticket_orders) AS sales,
                (SELECT COALESCE(SUM(CASE WHEN status IN ('Paid', 'Confirmed') THEN qty ELSE 0 END), 0) FROM ticket_orders) AS seats,
                (SELECT COUNT(*) FROM events) AS events,
                (SELECT COALESCE(SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END), 0) FROM events) AS pending_events,
                (SELECT COUNT(*) FROM programs WHERE kind = 'workshop') AS workshops,
                (SELECT COUNT(*) FROM workshop_registrations) AS registrations,
                (SELECT COUNT(*) FROM users) AS accounts,
                (SELECT COUNT(*) FROM announcements WHERE status = 'Published') AS announcements"
        );
        $colors = ['Pop' => '#f6c9cb', 'Hip-Hop' => '#b42334', 'R&B' => '#7a1220', 'Rock' => '#e7a4a8'];
        $genre = Event::query()
            ->where('approval_status', 'approved')
            ->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->category,
                'value' => (int) $row->total,
                'color' => $colors[$row->category] ?? '#e7a4a8',
            ])->values();

        return [
            'role' => 'admin',
            'sales' => (float) $row->sales,
            'seats' => (int) $row->seats,
            'orders' => (int) $row->orders,
            'events' => (int) $row->events,
            'pendingEvents' => (int) $row->pending_events,
            'workshops' => (int) $row->workshops,
            'registrations' => (int) $row->registrations,
            'accounts' => (int) $row->accounts,
            'announcements' => (int) $row->announcements,
            'revenueSeries' => self::revenue(),
            'genreSplit' => $genre,
            'waiting' => Event::query()
                ->with('organizer:id,name,organization')
                ->where('approval_status', 'pending')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (Event $event) => [
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
            'activity' => Notification::query()->where('user_id', $user->id)->latest()->limit(6)->get()->map(fn (Notification $note) => [
                'id' => $note->id,
                'text' => $note->title.($note->detail ? ' · '.$note->detail : ''),
                'time' => Records::ago($note->created_at),
            ])->values(),
        ];
    }

    private static function revenue()
    {
        $month = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";
        $buckets = TicketOrder::query()
            ->whereIn('status', ['Paid', 'Confirmed'])
            ->where('created_at', '>=', now()->startOfMonth()->subMonths(5))
            ->selectRaw("{$month} as ym, SUM(total) as total")
            ->groupBy(DB::raw($month))
            ->pluck('total', 'ym');

        return collect(range(5, 0))->map(function ($ago) use ($buckets) {
            $date = now()->startOfMonth()->subMonths($ago);

            return [
                'label' => $date->format('M'),
                'value' => (int) round((float) ($buckets[$date->format('Y-m')] ?? 0)),
            ];
        })->values();
    }
}
