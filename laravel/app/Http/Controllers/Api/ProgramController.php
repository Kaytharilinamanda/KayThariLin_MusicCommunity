<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\User;
use App\Support\Records;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    private const KINDS = [
        'workshops' => 'workshop',
        'courses' => 'course',
        'categories' => 'category',
        'centers' => 'center',
        'enrollments' => 'enrollment',
    ];

    private const SPECS = [
        'workshop' => ['required' => ['title', 'instructor', 'category', 'date', 'startTime', 'endTime', 'location', 'city'], 'numbers' => ['fee', 'seats']],
        'course' => ['required' => ['title', 'instrument', 'level', 'instructor', 'center', 'date', 'startTime', 'endTime', 'location'], 'numbers' => ['price'], 'text' => ['schedule']],
        'category' => ['required' => ['name'], 'numbers' => ['courses']],
        'center' => ['required' => ['name', 'city', 'email'], 'text' => ['area', 'phone', 'hours', 'focus']],
        'enrollment' => ['required' => ['student', 'email', 'course', 'center', 'date']],
    ];

    private const KEEP = ['slug', 'image', 'imageClass', 'avatar', 'instructorRole', 'summary', 'description', 'learn', 'includes', 'outcomes', 'duration', 'popular', 'centerId', 'school', 'address', 'blurb', 'time'];

    public function index(Request $request, string $kind)
    {
        $programKind = $this->kind($kind);
        $actor = $request->user();
        $query = Program::query()->with('organizer')->where('kind', $programKind)->orderByDesc('created_at');
        if ($actor?->role === 'admin') {
            return ['items' => $query->get()->map(fn (Program $row) => $this->desk($row))->values()];
        }
        if ($actor?->role === 'organizer') {
            return ['items' => $query->where('organizer_id', $actor->id)->get()->map(fn (Program $row) => $this->desk($row))->values()];
        }
        Records::fail('Only the admin or an organizer can view this desk.', 403);
    }

    public function publicIndex(string $kind)
    {
        $programKind = $this->kind($kind);
        $rows = Program::query()
            ->with('organizer')
            ->where('kind', $programKind)
            ->where('approval_status', 'approved')
            ->whereHas('organizer', fn ($query) => $query->where('status', 'active'))
            ->orderByDesc('created_at')
            ->get();

        return [
            'items' => $rows->map(function (Program $row) {
                return array_merge($row->payload ?? [], [
                    'id' => $row->id,
                    'slug' => $row->slug,
                ]);
            })->values(),
        ];
    }

    public function store(Request $request, string $kind)
    {
        $programKind = $this->kind($kind);
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $row = Program::create([
            'organizer_id' => $actor->id,
            'kind' => $programKind,
            'payload' => $this->sanitize($programKind, $request->all()),
            'approval_status' => 'pending',
        ]);
        Records::notifyAdmins('Submission waiting for approval', $row->payload['title'] ?? $row->payload['name'] ?? $programKind);

        return response()->json(['item' => $this->desk($row->load('organizer'))], 201);
    }

    public function update(Request $request, string $kind, Program $program)
    {
        $programKind = $this->kind($kind);
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $this->own($actor, $program, $programKind);
        $payload = $this->sanitize($programKind, $request->all());
        foreach (self::KEEP as $key) {
            if (! array_key_exists($key, $payload) && isset($program->payload[$key])) {
                $payload[$key] = $program->payload[$key];
            }
        }
        $program->fill([
            'payload' => $payload,
            'approval_status' => 'pending',
            'rejection_reason' => '',
        ])->save();
        Records::notifyAdmins('Submission resubmitted', $payload['title'] ?? $payload['name'] ?? $programKind);

        return ['item' => $this->desk($program->fresh('organizer'))];
    }

    public function destroy(Request $request, string $kind, Program $program)
    {
        $programKind = $this->kind($kind);
        Records::requireOrganizer($request->user());
        $this->own($request->user(), $program, $programKind);
        $program->delete();

        return ['ok' => true];
    }

    public function review(Request $request, string $kind, Program $program)
    {
        $programKind = $this->kind($kind);
        Records::requireAdmin($request->user());
        if ($program->kind !== $programKind) {
            Records::fail('That record was not found.', 404);
        }
        $decision = Records::decision($request->all());
        $program->approval_status = $decision;
        $program->rejection_reason = Records::reason($request->all(), $decision);
        $program->save();
        $label = $program->payload['title'] ?? $program->payload['name'] ?? $program->payload['student'] ?? 'Submission';
        Records::notify(
            $program->organizer_id,
            $decision === 'approved' ? 'Submission approved' : 'Submission needs changes',
            $decision === 'approved' ? $label : $label.': '.$program->rejection_reason
        );

        return ['ok' => true];
    }

    private function kind(string $kind): string
    {
        if (! isset(self::KINDS[$kind])) {
            Records::fail('That program is not available.', 404);
        }

        return self::KINDS[$kind];
    }

    private function own(User $actor, Program $program, string $kind): void
    {
        if ($program->kind !== $kind) {
            Records::fail('That record was not found.', 404);
        }
        if ($program->organizer_id !== $actor->id) {
            Records::fail('You can only change your own records.', 403);
        }
    }

    private function sanitize(string $kind, array $body): array
    {
        $spec = self::SPECS[$kind];
        $payload = [];
        foreach ($spec['required'] as $key) {
            $value = trim((string) ($body[$key] ?? ''));
            if ($value === '') {
                Records::fail('Fill in every required field.');
            }
            if ($key === 'email' && ! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $value)) {
                Records::fail('Enter a valid email address.');
            }
            if ($key === 'date' && ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                Records::fail('Enter a valid date.');
            }
            $payload[$key] = $value;
        }
        foreach ($spec['numbers'] ?? [] as $key) {
            $raw = $body[$key] ?? 0;
            $value = ($raw === '' || $raw === null) ? 0 : (float) $raw;
            if (! is_finite($value) || $value < 0) {
                Records::fail('Enter a number that is zero or more.');
            }
            $payload[$key] = $value;
        }
        foreach ($spec['text'] ?? [] as $key) {
            $payload[$key] = trim((string) ($body[$key] ?? ''));
        }

        return $payload;
    }

    private function desk(Program $row): array
    {
        return array_merge($row->payload ?? [], [
            'id' => $row->id,
            'organizerId' => $row->organizer_id,
            'organizer' => $row->organizer?->name ?? '',
            'organization' => $row->organizer?->organization ?? '',
            'status' => Records::label($row->approval_status),
            'rejectionReason' => $row->rejection_reason ?? '',
        ]);
    }
}
