<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Carbon;

class Records
{
    public const ADMIN_EMAIL = 'admin@harmony.community';

    public const EVENT_CATEGORIES = ['Pop', 'Hip-Hop', 'R&B', 'Rock'];

    public static function fail(string $message, int $status = 400): never
    {
        throw new ApiException($message, $status);
    }

    public static function user(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone' => $user->phone ?? '',
            'city' => $user->city ?? '',
            'organization' => $user->organization ?? '',
        ];
    }

    public static function label(string $value): string
    {
        return match ($value) {
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => 'Pending',
        };
    }

    public static function day(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        if ($value instanceof Carbon) {
            return $value->toDateString();
        }

        return substr((string) $value, 0, 10);
    }

    public static function ago(mixed $value): string
    {
        $time = $value instanceof Carbon ? $value : Carbon::parse($value);
        $minutes = (int) abs(now()->diffInMinutes($time));
        if ($minutes < 1) {
            return 'Just now';
        }
        if ($minutes < 60) {
            return $minutes.'m';
        }
        $hours = (int) abs(now()->diffInHours($time));
        if ($hours < 24) {
            return $hours.'h';
        }

        return ((int) abs(now()->diffInDays($time))).'d';
    }

    public static function requireAdmin(?User $actor): void
    {
        if (! $actor) {
            self::fail('Sign in again.', 401);
        }
        if ($actor->role !== 'admin') {
            self::fail('Only the admin can do that.', 403);
        }
    }

    public static function requireOrganizer(?User $actor): void
    {
        if (! $actor) {
            self::fail('Sign in again.', 401);
        }
        if ($actor->role !== 'organizer') {
            self::fail('Only an organizer can change events and tickets.', 403);
        }
        if (in_array($actor->status, ['suspended', 'rejected'], true)) {
            self::fail('This organizer account cannot submit changes.', 403);
        }
    }

    public static function requireUser(?User $actor): void
    {
        if (! $actor) {
            self::fail('Sign in again.', 401);
        }
        if ($actor->role !== 'user') {
            self::fail('This action uses a user account.', 403);
        }
        if ($actor->status === 'suspended') {
            self::fail('This account is suspended.', 403);
        }
    }

    public static function email(string $value): string
    {
        $email = strtolower(trim($value));
        if (! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
            self::fail('Enter a valid email address.');
        }

        return $email;
    }

    public static function dateOrNull(mixed $value, string $label): ?string
    {
        $text = trim((string) ($value ?? ''));
        if ($text === '') {
            return null;
        }
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $text)) {
            self::fail("Enter a valid {$label}.");
        }

        return $text;
    }

    public static function decision(array $body): string
    {
        $decision = $body['decision'] ?? '';
        if (! in_array($decision, ['approved', 'rejected'], true)) {
            self::fail('Choose approve or reject.');
        }
        $reason = trim((string) ($body['reason'] ?? ''));
        if ($decision === 'rejected' && strlen($reason) < 3) {
            self::fail('Add a rejection reason.');
        }

        return $decision;
    }

    public static function reason(array $body, string $decision): string
    {
        $reason = substr(trim((string) ($body['reason'] ?? '')), 0, 500);

        return $decision === 'rejected' ? $reason : '';
    }

    public static function notify(?int $userId, string $title, string $detail = ''): void
    {
        if (! $userId) {
            return;
        }
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'detail' => substr($detail, 0, 255),
        ]);
    }

    public static function notifyAdmins(string $title, string $detail = ''): void
    {
        User::query()->where('role', 'admin')->pluck('id')->each(
            fn ($id) => self::notify((int) $id, $title, $detail)
        );
    }
}
