<?php

namespace App\Jobs;

use App\Services\FlyballService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Background refill of one ready-made buffer ("twoTeam", "teamCountry" or
 * "boards"). Unique per buffer, so a burst of requests never starts parallel
 * refills of the same buffer.
 */
class TopUpBuffer implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public const BOARDS = 'boards';

    public int $tries = 1;

    public int $timeout = 900;

    public int $uniqueFor = 900;

    public function __construct(public readonly string $buffer) {}

    public function uniqueId(): string
    {
        return $this->buffer;
    }

    public function handle(FlyballService $service): void
    {
        $service->topUp($this->buffer);
    }
}
