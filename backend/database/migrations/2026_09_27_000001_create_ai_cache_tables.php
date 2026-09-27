<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'ai_cache';

    public function up(): void
    {
        Schema::connection($this->connection)->create('answer_cache', function (Blueprint $table) {
            $table->string('cache_key')->primary();
            $table->string('cond_a');
            $table->string('cond_b');
            $table->text('players_json');
            $table->boolean('verified');
            $table->unsignedBigInteger('created_at');
        });

        Schema::connection($this->connection)->create('boards', function (Blueprint $table) {
            $table->id();
            $table->text('board_json');
            $table->unsignedBigInteger('created_at');
        });

        Schema::connection($this->connection)->create('rounds', function (Blueprint $table) {
            $table->id();
            $table->string('kind')->index();
            $table->text('round_json');
            $table->unsignedBigInteger('created_at');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('rounds');
        Schema::connection($this->connection)->dropIfExists('boards');
        Schema::connection($this->connection)->dropIfExists('answer_cache');
    }
};
