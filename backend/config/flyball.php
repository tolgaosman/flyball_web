<?php

return [

    'gemini' => [
        'key' => env('GEMINI_API_KEY', ''),
        'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
        'timeout' => (int) env('GEMINI_TIMEOUT', 60),
    ],

    // Ready-made party rounds (per kind) and XOX boards kept in the cache so
    // the common case is instant. 0 disables background building.
    'buffer_target' => (int) env('FLYBALL_BUFFER_TARGET', 3),

    'session' => [
        'cookie' => 'flyball_session',
        'ttl_days' => 90,
    ],

    'login_throttle' => [
        'max_failures' => 5,
        'window_seconds' => 15 * 60,
    ],

];
