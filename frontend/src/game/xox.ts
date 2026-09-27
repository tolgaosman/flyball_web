import type { Board } from '@/lib/types';

/**
 * Football XOX in Game Master Mode: the players agree out loud whether an
 * answer is right; clicking a cell just claims it for whoever's turn it is.
 * Immutable — every move returns a new game (or the same one for a no-op).
 */

export type Mark = 'x' | 'o';

export interface XoxGame {
  board: Board;
  cells: (Mark | null)[];
  /** null once the game is over. X always starts. */
  current: Mark | null;
  winner: Mark | null;
  isDraw: boolean;
  names: Record<Mark, string>;
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export function createGame(board: Board, playerX: string, playerO: string): XoxGame {
  return { board, cells: Array(9).fill(null), current: 'x', winner: null, isDraw: false, names: { x: playerX, o: playerO } };
}

export const isOver = (game: XoxGame) => game.winner !== null || game.isDraw;
export const filledCount = (game: XoxGame) => game.cells.filter(Boolean).length;
export const other = (mark: Mark): Mark => (mark === 'x' ? 'o' : 'x');

export function claimCell(game: XoxGame, index: number): XoxGame {
  if (isOver(game) || game.cells[index] || !game.current) return game;

  const cells = game.cells.slice();
  cells[index] = game.current;
  const winner = findWinner(cells);
  const isDraw = !winner && cells.every(Boolean);

  return { ...game, cells, winner, isDraw, current: winner || isDraw ? null : other(game.current) };
}

export function passTurn(game: XoxGame): XoxGame {
  if (isOver(game) || !game.current) return game;
  return { ...game, current: other(game.current) };
}

function findWinner(cells: (Mark | null)[]): Mark | null {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
  }
  return null;
}
