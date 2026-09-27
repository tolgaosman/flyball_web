<?php

use Illuminate\Http\JsonResponse;

/** JSON with raw UTF-8 (the "—" in error messages stays readable). */
function json_ok(mixed $data, int $status = 200): JsonResponse
{
    return response()->json($data, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/** The API's single error shape: {"error": "<code or message>"}. */
function json_error(string $error, int $status = 400): JsonResponse
{
    return json_ok(['error' => $error], $status);
}
