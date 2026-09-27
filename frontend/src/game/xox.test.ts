import { describe, expect, it } from 'vitest';
import type { Board } from '@/lib/types';
import { claimCell, createGame, filledCount, isOver, passTurn } from './xox';

const board: Board = {
  rows: [],
  columns: [],
  cellExamples: Array.from({ length: 9 }, (_, i) => (i === 4 ? ['Cesc Fabregas'] : [])),
};
const newGame = () => createGame(board, 'Alice', 'Bob');
const at = (r: number, c: number) => r * 3 + c;

describe('XoxGame', () => {
  it('starts with X on an empty board', () => {
    const game = newGame();
    expect(game.current).toBe('x');
    expect(game.winner).toBeNull();
    expect(game.isDraw).toBe(false);
    expect(filledCount(game)).toBe(0);
  });

  it('alternates turns as cells are claimed', () => {
    let game = claimCell(newGame(), at(0, 0));
    expect(game.cells[0]).toBe('x');
    expect(game.current).toBe('o');
    game = claimCell(game, at(0, 1));
    expect(game.cells[1]).toBe('o');
    expect(game.current).toBe('x');
  });

  it('claiming a filled cell is a no-op', () => {
    const game = claimCell(newGame(), at(1, 1));
    expect(claimCell(game, at(1, 1))).toBe(game);
  });

  it('detects a row win and ends the game', () => {
    let game = newGame();
    for (const i of [at(0, 0), at(1, 0), at(0, 1), at(1, 1), at(0, 2)]) game = claimCell(game, i);
    expect(game.winner).toBe('x');
    expect(game.current).toBeNull();
    expect(isOver(game)).toBe(true);
    expect(claimCell(game, at(2, 2))).toBe(game);
  });

  it('detects a draw with no winner', () => {
    let game = newGame();
    for (const i of [at(0, 0), at(0, 1), at(0, 2), at(1, 1), at(1, 0), at(1, 2), at(2, 1), at(2, 0), at(2, 2)]) {
      game = claimCell(game, i);
    }
    expect(game.winner).toBeNull();
    expect(game.isDraw).toBe(true);
    expect(filledCount(game)).toBe(9);
  });

  it('passTurn hands over the turn without filling a cell, but not after the game ends', () => {
    const game = passTurn(newGame());
    expect(game.current).toBe('o');
    expect(filledCount(game)).toBe(0);
  });

  it('keeps names and board previews', () => {
    const game = newGame();
    expect(game.names).toEqual({ x: 'Alice', o: 'Bob' });
    expect(game.board.cellExamples[at(1, 1)]).toEqual(['Cesc Fabregas']);
  });
});
