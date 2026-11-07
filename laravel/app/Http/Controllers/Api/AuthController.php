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

    public function photo(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role, ['user', 'organizer'], true)) {
            Records::fail('Profile photos are for user and organizer accounts.', 403);
        }

        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ], [
            'photo.required' => 'Choose a photo to upload.',
            'photo.image' => 'Use a JPG, PNG, WEBP, or GIF photo.',
            'photo.mimes' => 'Use a JPG, PNG, WEBP, or GIF photo.',
            'photo.max' => 'Choose a photo smaller than 2 MB.',
        ]);

        $file = $request->file('photo');
        $extension = strtolower((string) ($file->guessExtension() ?: 'jpg'));
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }
        if (! in_array($extension, ['jpg', 'png', 'webp', 'gif'], true)) {
            Records::fail('Use a JPG, PNG, WEBP, or GIF photo.');
        }

        $name = $user->id.'-'.bin2hex(random_bytes(8)).'.'.$extension;
        $bytes = file_get_contents($file->getRealPath());
        if ($bytes === false) {
            Records::fail('That photo could not be read.');
        }

        $this->forgetPhoto($user->avatar);
        foreach ($this->photoDirectories() as $directory) {
            if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
                Records::fail('The photo could not be saved.');
            }
            if (file_put_contents($directory.DIRECTORY_SEPARATOR.$name, $bytes) === false) {
                Records::fail('The photo could not be saved.');
            }
        }

        $user->avatar = '/avatars/uploads/'.$name;
        $user->save();

        return ['user' => Records::user($user->fresh())];
    }

    private function photoDirectories(): array
    {
        if (app()->runningUnitTests()) {
            return [storage_path('framework/testing/avatars')];
        }

        return [
            public_path('avatars/uploads'),
            dirname(base_path()).DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'avatars'.DIRECTORY_SEPARATOR.'uploads',
        ];
    }

    private function forgetPhoto(?string $url): void
    {
        if (! is_string($url) || ! str_starts_with($url, '/avatars/uploads/')) {
            return;
        }
        $name = basename($url);
        if (! preg_match('/^[A-Za-z0-9._-]+$/', $name)) {
            return;
        }
        foreach ($this->photoDirectories() as $directory) {
            $file = $directory.DIRECTORY_SEPARATOR.$name;
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
}
