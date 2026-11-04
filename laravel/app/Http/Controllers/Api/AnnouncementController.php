<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Support\Records;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function mine(Request $request)
    {
        $request->merge(['mine' => true]);

        return $this->index($request);
    }

    public function index(Request $request)
    {
        $query = Announcement::query()->orderByDesc('published_on')->orderByDesc('id');
        $actor = $request->user();
        if ($request->boolean('mine')) {
            if (! $actor) {
                Records::fail('Sign in again.', 401);
            }
            $query->where('user_id', $actor->id);
            if ($request->filled('kind')) {
                $query->where('kind', $request->input('kind'));
            }
        } else {
            $query->where('status', 'Published');
            $query->where('kind', 'announcement');
        }

        return ['announcements' => $query->get()->map(fn (Announcement $row) => $this->row($row))->values()];
    }

    public function manage(Request $request)
    {
        Records::requireAdmin($request->user());

        return ['announcements' => Announcement::query()->orderByDesc('id')->get()->map(fn (Announcement $row) => $this->row($row))->values()];
    }

    public function store(Request $request)
    {
        $actor = $request->user();
        if (! $actor || ! in_array($actor->role, ['organizer', 'admin'], true)) {
            Records::fail('Only an organizer can publish this.', 403);
        }
        if ($actor->role === 'organizer' && in_array($actor->status, ['suspended', 'rejected'], true)) {
            Records::fail('This organizer account cannot submit changes.', 403);
        }
        $title = trim((string) $request->input('title'));
        if (strlen($title) < 3) {
            Records::fail('Add a title.');
        }
        $kind = $request->input('kind') === 'ad' ? 'ad' : 'announcement';
        $row = Announcement::create([
            'user_id' => $actor->id,
            'kind' => $kind,
            'title' => $title,
            'event_name' => trim((string) $request->input('event', '')),
            'audience' => trim((string) $request->input('audience', 'Ticket holders')),
            'placement' => trim((string) $request->input('placement', '')),
            'channel' => trim((string) $request->input('channel', $kind === 'ad' ? 'Event page' : 'Community')) ?: 'Community',
            'body' => trim((string) $request->input('body', '')),
            'status' => in_array($request->input('status'), ['Published', 'Draft', 'Scheduled'], true) ? $request->input('status') : 'Published',
            'published_on' => Records::dateOrNull($request->input('date', now()->toDateString()), 'date') ?: now()->toDateString(),
        ]);

        return response()->json(['announcement' => $this->row($row)], 201);
    }

    private function row(Announcement $row): array
    {
        return [
            'id' => $row->id,
            'title' => $row->title,
            'event' => $row->event_name,
            'audience' => $row->audience,
            'placement' => $row->placement,
            'channel' => $row->channel,
            'status' => $row->status,
            'date' => Records::day($row->published_on),
            'kind' => $row->kind,
        ];
    }
}
