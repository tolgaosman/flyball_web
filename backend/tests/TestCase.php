<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Both in-memory SQLite connections (accounts + AI cache) survive across requests in a test. */
    protected array $connectionsToTransact = [null, 'ai_cache'];
}
