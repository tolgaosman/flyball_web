<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // COLLATE NOCASE: "Osman" and "osman" are the same account, and login
        // matches regardless of casing while keeping the registered casing.
        DB::statement('CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )');

        Schema::create('auth_sessions', function (Blueprint $table) {
            $table->string('token_hash', 64)->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('created_at');
            $table->unsignedBigInteger('expires_at');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_sessions');
        Schema::dropIfExists('users');
    }
};
