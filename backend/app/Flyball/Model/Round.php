<?php

namespace App\Flyball\Model;

use JsonSerializable;

/**
 * A ready-to-play party round. [conditionA] is always a club; [conditionB] is
 * the second club (twoTeam) or the nationality (teamCountry).
 */
final readonly class Round implements JsonSerializable
{
    public function __construct(
        public RoundKind $kind,
        public string $conditionA,
        public string $conditionB,
        public AnswerResult $answers,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'kind' => $this->kind->value,
            'conditionA' => $this->conditionA,
            'conditionB' => $this->conditionB,
            'answers' => $this->answers->jsonSerialize(),
        ];
    }

    public static function fromArray(array $json): self
    {
        return new self(
            RoundKind::from($json['kind']),
            (string) $json['conditionA'],
            (string) $json['conditionB'],
            AnswerResult::fromArray($json['answers']),
        );
    }
}
