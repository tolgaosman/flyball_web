/** Mirrors the Laravel JSON contract (backend/docs/api.md). */

export type FactorType = 'playedLeague' | 'wonLeague' | 'wonInternational' | 'team' | 'nationality';

export interface Factor {
  type: FactorType;
  /** Header text AND the condition sent to the AI, e.g. "Played in Premier League". */
  label: string;
  /** Catalogue value: league, tournament, club or country name. */
  value: string;
}

export interface AnswerResult {
  players: string[];
  /** false = the verify pass failed; these are unchecked recall candidates. */
  verified: boolean;
}

export type RoundKind = 'twoTeam' | 'teamCountry';

export interface Round {
  kind: RoundKind;
  /** Always a club. */
  conditionA: string;
  /** Second club (twoTeam) or nationality (teamCountry). */
  conditionB: string;
  answers: AnswerResult;
}

export interface Board {
  rows: Factor[];
  columns: Factor[];
  /** Index row * 3 + col — the instant long-press preview. */
  cellExamples: string[][];
}

export interface AccountUser {
  id: number;
  username: string;
  displayName: string;
  /** Epoch milliseconds (UTC). */
  createdAt: number;
}

export type AnswerKind = 'two_team' | 'team_country' | 'xox';
