<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsLibrarian
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::user()?->isLibrarian()) {
            return redirect()->route('login');
        }
        return $next($request);
    }
}
