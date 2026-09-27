<?php

namespace App\Services;

use App\Flyball\Catalog\SharedData;

/**
 * Sign-up rules from resources/shared/account_rules.json — the same file the
 * Next.js form validates against, so the two can never disagree.
 * Lengths count UTF-16 code units, matching JavaScript's String.length.
 */
final class AccountRules
{
    public static function error(string $name): string
    {
        return SharedData::load('account_rules')['errors'][$name];
    }

    public static function validateUsername(string $username): ?string
    {
        $rule = SharedData::load('account_rules')['username'];
        $length = self::length($username);
        $pattern = '/'.substr($rule['pattern'], 0, -1).'\z/';

        return $length < $rule['minLength'] || $length > $rule['maxLength'] || ! preg_match($pattern, $username)
            ? self::error('invalidUsername')
            : null;
    }

    public static function validatePassword(string $password): ?string
    {
        $rule = SharedData::load('account_rules')['password'];
        $length = self::length($password);

        return $length < $rule['minLength'] || $length > $rule['maxLength'] ? self::error('weakPassword') : null;
    }

    /** $displayName must already be trimmed. */
    public static function validateDisplayName(string $displayName): ?string
    {
        $max = SharedData::load('account_rules')['displayName']['maxLength'];

        return $displayName === '' || self::length($displayName) > $max ? self::error('invalidDisplayName') : null;
    }

    public static function trim(string $value): string
    {
        return preg_replace('/^\s+|\s+$/u', '', $value) ?? trim($value);
    }

    private static function length(string $value): int
    {
        return intdiv(strlen(mb_convert_encoding($value, 'UTF-16LE', 'UTF-8')), 2);
    }
}
