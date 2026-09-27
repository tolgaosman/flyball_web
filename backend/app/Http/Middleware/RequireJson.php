<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CSRF guard for the cookie-authenticated auth routes: a cross-site HTML form
 * cannot send application/json, and a cross-site fetch that does needs a CORS
 * preflight this API never grants.
 */
class RequireJson
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isJson()) {
            return json_error('unsupported_media_type', 415);
        }

        return $next($request);
    }
}
