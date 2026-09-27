<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Middleware\RequireJson;
use App\Http\Middleware\ResolveSessionUser;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:ai')->group(function () {
    Route::post('/answers', [AiController::class, 'answers']);
    Route::get('/rounds/two-team', [AiController::class, 'twoTeamRound']);
    Route::get('/rounds/team-country', [AiController::class, 'teamCountryRound']);
    Route::get('/xox/board', [AiController::class, 'xoxBoard']);
});

Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware(RequireJson::class);
    Route::post('/login', [AuthController::class, 'login'])->middleware(RequireJson::class);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware(RequireJson::class);
    Route::get('/me', [AuthController::class, 'me'])->middleware(ResolveSessionUser::class);
});
