<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Records;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $name = trim((string) $request->input('name'));
        $email = strtolower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');
        $role = $request->input('role') === 'organizer' ? 'organizer' : ($request->input('role') === 'user' ? 'user' : '');
        $phone = trim((string) $request->input('phone'));
        $city = trim((string) $request->input('city'));
        $organization = trim((string) $request->input('organization'));

        if (strlen($name) < 2) {
            Records::fail('Add your name.');
        }
        if (! preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
            Records::fail('Enter a valid email address.');
        }
        if (strlen($password) < 8) {
            Records::fail('Use at least 8 characters.');
        }
        if ($role === '') {
            Records::fail('Choose a user or organizer account. Admin is not open for registration.');
        }
        if ($email === Records::ADMIN_EMAIL) {
            Records::fail('That email is reserved for the studio admin.');
        }
        if ($role === 'organizer' && strlen($organization) < 2) {
            Records::fail('Add the organizer or company name.');
        }
        if (User::query()->where('email', $email)->exists()) {
            Records::fail('An account with that email already exists.', 409);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => $role,
            'status' => $role === 'organizer' ? 'pending' : 'active',
            'phone' => $phone,
            'city' => $city,
            'organization' => $organization,
        ]);

        return response()->json([
            'token' => $user->createToken('harmony')->plainTextToken,
            'user' => Records::user($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $email = strtolower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');
        $role = $request->input('role');
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            Records::fail('Email or password is incorrect.', 401);
        }
        if ($role && $user->role !== $role) {
            Records::fail('This email is a '.($user->role ?: 'member').' account.', 403);
        }
        if ($user->status === 'suspended') {
            Records::fail('This account is suspended.', 403);
        }
        if ($user->status === 'rejected') {
            Records::fail('This organizer registration was not approved.', 403);
        }

        return [
            'token' => $user->createToken('harmony')->plainTextToken,
            'user' => Records::user($user),
        ];
    }

    public function me(Request $request)
    {
        return ['user' => Records::user($request->user())];
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $name = trim((string) $request->input('name'));
        $organization = trim((string) $request->input('organization', $user->organization));
        if (strlen($name) < 2) {
            Records::fail('Add your name.');
        }
        if ($user->role === 'organizer' && strlen($organization) < 2) {
            Records::fail('Add the organizer or company name.');
        }
        $user->fill([
            'name' => $name,
            'phone' => trim((string) $request->input('phone')),
            'city' => trim((string) $request->input('city')),
            'organization' => $organization,
        ])->save();

        return ['user' => Records::user($user->fresh())];
    }
}
