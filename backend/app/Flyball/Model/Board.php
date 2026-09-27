<?php

namespace App\Flyball\Model;

use InvalidArgumentException;
use JsonSerializable;

/**
 * An XOX board: 3 row + 3 column factors and, per cell (index row*3+col),
 * 1–3 example players used as the instant long-press preview.
 */
final readonly class Board implements JsonSerializable
{
    /**
     * @param  list<Factor>  $rows
     * @param  list<Factor>  $columns
     * @param  list<list<string>>  $cellExamples
     */
    public function __construct(
        public array $rows,
        public array $columns,
        public array $cellExamples,
    ) {}

    /** @return list<string> */
    public function examplesAt(int $row, int $col): array
    {
        return $this->cellExamples[$row * 3 + $col];
    }

    public function jsonSerialize(): array
    {
        return [
            'rows' => array_map(fn (Factor $f) => $f->jsonSerialize(), $this->rows),
            'columns' => array_map(fn (Factor $f) => $f->jsonSerialize(), $this->columns),
            'cellExamples' => $this->cellExamples,
        ];
    }

    public static function fromArray(array $json): self
    {
        $rows = array_map(Factor::fromArray(...), $json['rows']);
        $columns = array_map(Factor::fromArray(...), $json['columns']);
        if (count($rows) !== 3 || count($columns) !== 3) {
            throw new InvalidArgumentException(sprintf(
                'Board must have exactly 3 rows and 3 columns, got %dx%d', count($rows), count($columns),
            ));
        }
        $raw = $json['cellExamples'] ?? null;
        $cells = [];
        for ($i = 0; $i < 9; $i++) {
            $cells[] = isset($raw[$i]) ? array_map('strval', $raw[$i]) : [];
        }

        return new self($rows, $columns, $cells);
    }
}
