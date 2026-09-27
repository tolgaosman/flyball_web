<?php

namespace App\Flyball\Ai;

/**
 * The exact prompts sent to Gemini — tuned text, keep it verbatim.
 * Dates come from the app clock (config app.timezone) so "recent" never goes stale.
 */
final class Prompts
{
    private const CLUB_ALIAS_RULE = '- Treat club name variants as the SAME club: "Leipzig" = "RB Leipzig", '
        .'"Man United"/"Man Utd" = "Manchester United", "Inter" = "Internazionale", '
        .'"PSG" = "Paris Saint-Germain", "Basaksehir" = "Istanbul Basaksehir", '
        ."etc. Search under every common form of the name.\n";

    private const SOURCE_PREFERENCE_RULE = '- PREFER Wikipedia and Transfermarkt (transfermarkt.com) among your web '
        .'search results for player profiles, clubs, nationalities, transfer '
        .'history and trophies — they are the most reliable and up to date for '
        .'this. Use other sources too when useful, but resolve conflicts in '
        ."favor of what Transfermarkt or Wikipedia say.\n";

    public static function todayIso(): string
    {
        return now()->format('Y-m-d');
    }

    public static function currentWindowLabel(): string
    {
        $now = now();

        return $now->month <= 5
            ? "January {$now->year} transfer window"
            : "summer {$now->year} transfer window";
    }

    /** PHASE 1 — wide recall; told to over-include and never self-censor. */
    public static function recall(string $condition1, string $condition2): string
    {
        return 'Act as an expert football researcher building a CANDIDATE list. '
            .'Your ONLY job right now is RECALL, not verification. List every '
            ."real-life footballer (senior men's or women's professional) who "
            ."MIGHT satisfy BOTH of these conditions:\n"
            ."1. \"{$condition1}\"\n"
            ."2. \"{$condition2}\"\n\n"
            ."RULES:\n"
            .'- USE WEB SEARCH and think broadly. Include well-known players, '
            .'lesser-known ones, retired ones, loanees, and anyone you are even '
            ."reasonably unsure about. OVER-INCLUDE on purpose.\n"
            .'- Do NOT filter, drop, or self-censor names at this stage. A separate '
            .'verification step will remove the wrong ones later, so it is far better '
            ."to list a borderline name than to omit a correct one.\n"
            ."- INCLUDE the most recent season's transfers, brand-new signings and "
            .'loan moves — today is '.self::todayIso().', so treat any transfer completed '
            .'on or before that date, including the '.self::currentWindowLabel().', as '
            .'valid and current. Recent arrivals are a common source of missed '
            ."answers, so make a point of covering them.\n"
            .self::CLUB_ALIAS_RULE
            .self::SOURCE_PREFERENCE_RULE
            .'- Only requirement: each name must be a real footballer who plausibly '
            ."has some connection to BOTH conditions. Do not invent people.\n"
            .'- A condition naming a tournament (e.g. "Champions League", "World '
            ."Cup\") refers to a player who WON it.\n"
            .'- Respond with ONLY raw JSON, no markdown fences and no commentary, in '
            .'exactly this shape: {"players": ["Full Name", "Full Name"]}.';
    }

    /**
     * PHASE 2 — coverage-first verification of the recall candidates.
     *
     * @param  list<string>  $candidates
     */
    public static function verify(array $candidates, string $condition1, string $condition2): string
    {
        $list = json_encode($candidates, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return 'Act as a football fact-checker whose PRIORITY IS COVERAGE. Below is a '
            .'CANDIDATE list of footballers. For EACH name, use WEB SEARCH to assess '
            ."whether that player plausibly satisfies BOTH conditions:\n"
            ."1. \"{$condition1}\"\n"
            ."2. \"{$condition2}\"\n\n"
            ."CANDIDATES: {$list}\n\n"
            ."RULES:\n"
            .'- KEEP a name if sources show a REASONABLE, LIKELY link to BOTH '
            .'conditions — an actual spell, an announced/completed transfer, or a '
            ."loan. You do NOT need ironclad proof; a credible connection is enough.\n"
            .'- DROP a name ONLY when you can POSITIVELY rule it out — it is clearly a '
            .'different player with a similar name, a transfer that never happened, or '
            .'someone with no real connection to one of the conditions. When genuinely '
            ."unsure, KEEP it.\n"
            .self::CLUB_ALIAS_RULE
            .self::SOURCE_PREFERENCE_RULE
            ."- Count the MOST RECENT season's transfers, new signings and loans as "
            .'valid — today is '.self::todayIso().', so a move completed on or before that '
            .'date, including the '.self::currentWindowLabel().', is current. Do not drop a '
            ."player just because the move is recent.\n"
            ."- Do NOT add any new names that are not in the candidate list.\n"
            .'- A condition naming a tournament (e.g. "Champions League", "World '
            ."Cup\") means the player WON it.\n"
            .'- Respond with ONLY raw JSON, no markdown fences and no commentary, in '
            .'exactly this shape: {"players": ["Full Name", "Full Name"]}.';
    }

    /**
     * All 9 XOX cells in one call, row-major (row0×col0, row0×col1, …).
     *
     * @param  list<string>  $rowLabels
     * @param  list<string>  $colLabels
     */
    public static function boardCells(array $rowLabels, array $colLabels): string
    {
        $lines = [];
        foreach ($rowLabels as $r) {
            foreach ($colLabels as $c) {
                $lines[] = (count($lines) + 1).". \"{$r}\" AND \"{$c}\"";
            }
        }
        $numbered = implode("\n", $lines);

        return 'Act as an expert football researcher. Below are 9 pairs of '
            .'conditions (a trivia-grid cell). For EACH pair, use WEB SEARCH and '
            .'find 1 to 3 REAL footballers who satisfy BOTH conditions in that pair. '
            .'If you cannot find any real player for a pair, return an empty list '
            ."for it — do NOT invent one.\n\n"
            ."{$numbered}\n\n"
            ."RULES:\n"
            .self::CLUB_ALIAS_RULE
            .self::SOURCE_PREFERENCE_RULE
            .'- A condition naming a tournament (e.g. "Won World Cup") means the '
            ."player WON it. A condition naming just a country is a nationality.\n"
            .'- Today is '.self::todayIso().'; count transfers up to and including the '
            .self::currentWindowLabel()." as current.\n"
            .'- Respond with ONLY raw JSON, no markdown fences and no commentary, in '
            .'exactly this shape, with exactly 9 entries in the SAME order as above: '
            .'{"cells": [{"players": ["Full Name"]}, {"players": []}, ...]}.';
    }
}
