<?php

namespace App\Flyball\Catalog;

final class CountryCatalog
{
    /** @return list<array{name: string, iso2: string, nameTr: string}> */
    public static function all(): array
    {
        return SharedData::load('countries')['countries'];
    }

    /** @return list<string> */
    public static function names(): array
    {
        return array_column(self::all(), 'name');
    }

    public static function byName(string $name): ?array
    {
        foreach (self::all() as $country) {
            if ($country['name'] === $name) {
                return $country;
            }
        }

        return null;
    }

    public static function flagUrl(string $name, int $width = 160): ?string
    {
        $iso = self::byName($name)['iso2'] ?? null;

        return $iso === null ? null : "https://flagcdn.com/w{$width}/{$iso}.png";
    }
}
