<?php

namespace App\Flyball\Catalog;

/**
 * Loads the JSON contract in resources/shared — the single source of truth
 * the Next.js frontend also syncs from.
 */
final class SharedData
{
    /** @var array<string, array> */
    private static array $loaded = [];

    public static function load(string $name): array
    {
        return self::$loaded[$name] ??= json_decode(
            file_get_contents(resource_path("shared/{$name}.json")),
            true,
            flags: JSON_THROW_ON_ERROR,
        );
    }
}
