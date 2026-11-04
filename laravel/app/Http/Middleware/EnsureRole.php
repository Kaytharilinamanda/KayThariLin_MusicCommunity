<?php

namespace App\Http\Middleware;

use App\Support\Records;
use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();
        if (! $user) {
            Records::fail('Sign in again.', 401);
        }
        if (! in_array($user->role, $roles, true)) {
            Records::fail('You do not have access to that.', 403);
        }

        return $next($request);
    }
}
