<?php

namespace App\Flyball\Model;

use JsonSerializable;

/**
 * One XOX axis constraint. [label] is both the header text and the condition
 * sent to Gemini; equality is by (type, value) only.
 */
final readonly class Factor implements JsonSerializable
{
    public function __construct(
        public FactorType $type,
        public string $label,
        public string $value,
    ) {}

    public function isNationality(): bool
    {
        return $this->type === FactorType::Nationality;
    }

    public function isInternational(): bool
    {
        return $this->type === FactorType::WonInternational;
    }

    public function equals(Factor $other): bool
    {
        return $this->type === $other->type && $this->value === $other->value;
    }

    public function jsonSerialize(): array
    {
        return ['type' => $this->type->value, 'label' => $this->label, 'value' => $this->value];
    }

    public static function fromArray(array $json): self
    {
        return new self(FactorType::from($json['type']), (string) $json['label'], (string) $json['value']);
    }
}
