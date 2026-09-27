<?php

namespace App\Flyball\Model;

/** Backed by the camelCase names the JSON contract uses (Dart's enum .name). */
enum FactorType: string
{
    case PlayedLeague = 'playedLeague';
    case WonLeague = 'wonLeague';
    case WonInternational = 'wonInternational';
    case Team = 'team';
    case Nationality = 'nationality';
}
