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
    ];

    private const SPECS = [
        'workshop' => ['required' => ['title', 'instructor', 'category', 'date', 'startTime', 'endTime', 'location', 'city'], 'numbers' => ['fee', 'seats']],
        'course' => ['required' => ['title', 'instrument', 'level', 'instructor', 'center', 'date', 'startTime', 'endTime', 'location'], 'numbers' => ['price'], 'text' => ['schedule']],
        'category' => ['required' => ['name'], 'numbers' => ['courses']],
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
            ->orderByDesc('id')
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
            'payload' => $this->payload($actor, $programKind, null, $request->all()),
            'approval_status' => 'pending',
        ]);
        Records::notifyAdmins('Submission waiting for approval', $row->payload['title'] ?? $row->payload['name'] ?? $programKind);

        return response()->json(['item' => $this->desk($row->load('organizer'))], 201);
    }

    public function uploadImage(Request $request)
    {
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ], [
            'photo.required' => 'Choose a photo to upload.',
            'photo.image' => 'Use a JPG, PNG, WEBP, or GIF photo.',
            'photo.mimes' => 'Use a JPG, PNG, WEBP, or GIF photo.',
            'photo.max' => 'Choose a photo smaller than 2 MB.',
        ]);

        return ['image' => $this->storeUpload($request->file('photo'), $actor)];
    }

    public function update(Request $request, string $kind, Program $program)
    {
        $programKind = $this->kind($kind);
        $actor = $request->user();
        Records::requireOrganizer($actor);
        $this->own($actor, $program, $programKind);
        $payload = $this->payload($actor, $programKind, $program, $request->all());
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
        $this->forgetUpload($program->payload['image'] ?? null);
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

    private function payload(User $actor, string $kind, ?Program $program, array $body): array
    {
        $payload = $this->sanitize($kind, $body);
        if (! in_array($kind, ['workshop', 'course'], true)) {
            return $payload;
        }
        $image = $this->image($actor, $program, $body);
        if ($image !== null) {
            $payload['image'] = $image;
        }

        return $payload;
    }

    private function image(User $actor, ?Program $program, array $body): ?string
    {
        $submitted = trim((string) ($body['image'] ?? ''));
        $current = $program ? (string) ($program->payload['image'] ?? '') : '';
        if ($submitted === '' || ($program && $submitted === $current)) {
            return $current !== '' ? $current : null;
        }
        $pattern = '#^/uploads/programs/'.preg_quote((string) $actor->id, '#').'-[a-f0-9]{16}\.(jpg|png|webp|gif)$#';
        if (! preg_match($pattern, $submitted) || ! $this->uploadExists($submitted)) {
            Records::fail('Upload a JPG, PNG, WEBP, or GIF photo.');
        }
        if ($current !== '' && $current !== $submitted) {
            $this->forgetUpload($current);
        }

        return $submitted;
    }

    private function storeUpload($file, User $actor): string
    {
        $extension = strtolower((string) ($file->guessExtension() ?: 'jpg'));
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }
        if (! in_array($extension, ['jpg', 'png', 'webp', 'gif'], true)) {
            Records::fail('Use a JPG, PNG, WEBP, or GIF photo.');
        }
        $name = $actor->id.'-'.bin2hex(random_bytes(8)).'.'.$extension;
        $bytes = file_get_contents($file->getRealPath());
        if ($bytes === false) {
            Records::fail('That photo could not be read.');
        }
        foreach ($this->uploadDirectories() as $directory) {
            if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
                Records::fail('The photo could not be saved.');
            }
            if (file_put_contents($directory.DIRECTORY_SEPARATOR.$name, $bytes) === false) {
                Records::fail('The photo could not be saved.');
            }
        }

        return '/uploads/programs/'.$name;
    }

    private function uploadExists(string $url): bool
    {
        $name = basename($url);
        foreach ($this->uploadDirectories() as $directory) {
            if (is_file($directory.DIRECTORY_SEPARATOR.$name)) {
                return true;
            }
        }

        return false;
    }

    private function forgetUpload(?string $url): void
    {
        if (! is_string($url) || ! preg_match('#^/uploads/programs/[A-Za-z0-9._-]+$#', $url)) {
            return;
        }
        $name = basename($url);
        foreach ($this->uploadDirectories() as $directory) {
            $file = $directory.DIRECTORY_SEPARATOR.$name;
            if (is_file($file)) {
                unlink($file);
            }
        }
    }

    private function uploadDirectories(): array
    {
        if (app()->runningUnitTests()) {
            return [storage_path('framework/testing/uploads/programs')];
        }

        return [
            public_path('uploads/programs'),
            dirname(base_path()).DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'uploads'.DIRECTORY_SEPARATOR.'programs',
        ];
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
