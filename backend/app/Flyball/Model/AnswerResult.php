<?php

namespace App\Flyball\Model;

use JsonSerializable;

/**
 * Players found by a live AI search. [verified] is false only when the verify
 * call failed and the unchecked recall list was returned instead — the UI
 * shows an "unverified" warning for that case.
 */
final readonly class AnswerResult implements JsonSerializable
{
    /** @param list<string> $players */
    public function __construct(
        public array $players,
        public bool $verified,
    ) {}

    public function jsonSerialize(): array
    {
        return ['players' => $this->players, 'verified' => $this->verified];
    }

    public static function fromArray(array $json): self
    {
        return new self(
            array_map('strval', $json['players']),
            (bool) ($json['verified'] ?? true),
        );
    }
}
