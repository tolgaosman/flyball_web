<?php

namespace App\Flyball\Ai;

use App\Flyball\Model\Board;
use App\Flyball\Model\Factor;
use App\Flyball\Model\FactorPool;
use Random\Randomizer;

/**
 * Draws axis-valid factors, then ONE Gemini call fills all 9 cells with
 * example players. Empty cells trigger a bounded retry that swaps the axis
 * factor responsible for the most empty cells.
 */
final class BoardBuilder
{
    private const MAX_ATTEMPTS = 3;

    public function __construct(private readonly GeminiTransport $transport) {}

    /** @throws GeminiQuotaExceededException */
    public function buildBoard(?Randomizer $rng = null): ?Board
    {
        $rng ??= new Randomizer;
        ['rows' => $rows, 'columns' => $columns] = FactorPool::pickAxisValidSix($rng);

        // Cells and the axes they were fetched for travel together, so a failed
        // retry after a swap never pairs new headers with stale examples.
        $lastGood = null;

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $cells = $this->fetchCells($rows, $columns);
            if ($cells === null) {
                if ($attempt === 0) {
                    return null;
                }
                break;
            }
            $lastGood = [$rows, $columns, $cells];

            $empty = array_keys(array_filter($cells, fn (array $c) => $c === []));
            if ($empty === []) {
                return new Board($rows, $columns, $cells);
            }
            if ($attempt === self::MAX_ATTEMPTS - 1) {
                break;
            }

            $emptyRows = [0, 0, 0];
            $emptyCols = [0, 0, 0];
            foreach ($empty as $i) {
                $emptyRows[intdiv($i, 3)]++;
                $emptyCols[$i % 3]++;
            }
            $worstRow = self::argMax($emptyRows);
            $worstCol = self::argMax($emptyCols);
            $replaceRow = $emptyRows[$worstRow] >= $emptyCols[$worstCol];

            $replacement = self::findReplacement($rng, $rows, $columns, $replaceRow ? $worstRow : null, $replaceRow ? null : $worstCol);
            if ($replacement === null) {
                break;
            }
            if ($replaceRow) {
                $rows[$worstRow] = $replacement;
            } else {
                $columns[$worstCol] = $replacement;
            }
        }

        [$rows, $columns, $cells] = $lastGood;

        return new Board($rows, $columns, $cells);
    }

    /**
     * @param  list<Factor>  $rows
     * @param  list<Factor>  $columns
     * @return list<list<string>>|null
     */
    private function fetchCells(array $rows, array $columns): ?array
    {
        $prompt = Prompts::boardCells(
            array_map(fn (Factor $f) => $f->label, $rows),
            array_map(fn (Factor $f) => $f->label, $columns),
        );
        $body = $this->transport->generateContent($prompt, 1024, 4096);

        return $body === null ? null : GeminiParser::parseCells($body, 9);
    }

    /** @param list<int> $values first index holding the maximum */
    private static function argMax(array $values): int
    {
        $best = 0;
        foreach ($values as $i => $v) {
            if ($v > $values[$best]) {
                $best = $i;
            }
        }

        return $best;
    }

    /**
     * @param  list<Factor>  $rows
     * @param  list<Factor>  $columns
     */
    private static function findReplacement(Randomizer $rng, array $rows, array $columns, ?int $rowIndex, ?int $colIndex): ?Factor
    {
        $current = [...$rows, ...$columns];
        foreach ($rng->shuffleArray(FactorPool::allFactors()) as $candidate) {
            foreach ($current as $existing) {
                if ($existing->equals($candidate)) {
                    continue 2;
                }
            }
            $newRows = $rows;
            $newColumns = $columns;
            if ($rowIndex !== null) {
                $newRows[$rowIndex] = $candidate;
            } else {
                $newColumns[$colIndex] = $candidate;
            }
            if (FactorPool::axesAreValid($newRows, $newColumns)) {
                return $candidate;
            }
        }

        return null;
    }
}
