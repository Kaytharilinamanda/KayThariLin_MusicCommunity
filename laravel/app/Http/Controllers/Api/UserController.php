<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Records;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        Records::requireAdmin($request->user());

        return [
            'users' => User::query()->orderByDesc('id')->get()->map(fn (User $user) => Records::user($user))->values(),
        ];
    }

    public function store(Request $request)
    {
        Records::requireAdmin($request->user());
        if ($request->input('role') === 'admin') {
            Records::fail('The studio already has its one admin account.');
        }
        $fields = $this->fields($request->all(), true);

        $user = User::create($fields);

        return response()->json(['user' => Records::user($user)], 201);
    }

    public function update(Request $request, User $user)
    {
        Records::requireAdmin($request->user());
        if ($user->role === 'admin') {
            Records::fail('The studio admin account is not edited here.');
        }
        $fields = $this->fields(array_merge($request->all(), [
            'email' => $request->input('email', $user->email),
        ]), false, $user);
        if (($fields['password'] ?? '') === '') {
            unset($fields['password']);
        }
        $user->fill($fields)->save();

        return ['user' => Records::user($user->fresh())];
    }

    public function status(Request $request, User $user)
    {
        Records::requireAdmin($request->user());
        $status = (string) $request->input('status');
        if (! in_array($status, ['active', 'pending', 'suspended', 'rejected'], true)) {
            Records::fail('That status is not available.');
        }
        if ($user->role === 'admin') {
            Records::fail('The studio admin account stays active.');
        }
        $user->status = $status;
        $user->save();

        return ['user' => Records::user($user)];
    }

    public function destroy(Request $request, User $user)
    {
        Records::requireAdmin($request->user());
        if ($user->role === 'admin') {
            Records::fail('The studio admin account cannot be deleted.');
        }
        $user->tokens()->delete();
        $user->tickets()->delete();
        $user->events()->delete();
        $user->programs()->delete();
        $user->delete();

        return ['ok' => true];
    }

    private function fields(array $body, bool $creating, ?User $current = null): array
    {
        $name = trim((string) ($body['name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? $current?->email ?? '')));
        $password = (string) ($body['password'] ?? '');
        $role = ($body['role'] ?? '') === 'organizer' ? 'organizer' : (($body['role'] ?? '') === 'user' ? 'user' : '');
        $phone = trim((string) ($body['phone'] ?? ''));
        $city = trim((string) ($body['city'] ?? ''));
        $organization = trim((string) ($body['organization'] ?? ''));
        $status = in_array($body['status'] ?? '', ['active', 'pending', 'suspended', 'rejected'], true) ? $body['status'] : '';

        if (strlen($name) < 2) {
            Records::fail('Add the account name.');
        }
        if (! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
            Records::fail('Enter a valid email address.');
        }
        if ($email === Records::ADMIN_EMAIL && $current?->role !== 'admin') {
            Records::fail('That email is reserved for the studio admin.');
        }
        if ($role === '') {
            Records::fail('Choose a user or organizer account.');
        }
        if ($creating && strlen($password) < 8) {
            Records::fail('Use at least 8 characters.');
        }
        if (! $creating && $password !== '' && strlen($password) < 8) {
            Records::fail('Use at least 8 characters.');
        }
        if ($role === 'organizer' && strlen($organization) < 2) {
            Records::fail('Add the organizer or company name.');
        }
        if ($status === '') {
            Records::fail('Choose a status.');
        }
        $taken = User::query()->where('email', $email)->when($current, fn ($query) => $query->where('id', '!=', $current->id))->exists();
        if ($taken) {
            Records::fail('An account with that email already exists.', 409);
        }

        return [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => $role,
            'status' => $status,
            'phone' => $phone,
            'city' => $city,
            'organization' => $organization,
        ];
    }
}
