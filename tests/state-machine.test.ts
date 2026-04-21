import { describe, it, expect } from 'vitest';
import { createGame, type GameState } from '../src/game';

describe('state machine', () => {
  it('starts in TITLE', () => {
    const g = createGame();
    expect(g.state()).toBe('TITLE');
  });

  describe('legal transitions', () => {
    const cases: Array<[GameState, GameState]> = [
      ['TITLE', 'PLAY'],
      ['PLAY', 'PAUSED'],
      ['PAUSED', 'PLAY'],
      ['PLAY', 'GAME_OVER'],
      ['GAME_OVER', 'TITLE'],
      ['GAME_OVER', 'INITIALS_ENTRY'],
      ['INITIALS_ENTRY', 'TITLE'],
    ];

    for (const [from, to] of cases) {
      it(`${from} → ${to}`, () => {
        const g = createGame();
        driveTo(g, from);
        g.transition(to);
        expect(g.state()).toBe(to);
      });
    }
  });

  describe('illegal transitions (rejected)', () => {
    const cases: Array<[GameState, GameState]> = [
      ['TITLE', 'PAUSED'],
      ['TITLE', 'GAME_OVER'],
      ['TITLE', 'INITIALS_ENTRY'],
      ['PAUSED', 'GAME_OVER'],
      ['PAUSED', 'TITLE'],
      ['GAME_OVER', 'PLAY'],
      ['INITIALS_ENTRY', 'PLAY'],
    ];

    for (const [from, to] of cases) {
      it(`rejects ${from} → ${to}`, () => {
        const g = createGame();
        driveTo(g, from);
        expect(() => g.transition(to)).toThrow();
        expect(g.state()).toBe(from);
      });
    }
  });
});

function driveTo(g: ReturnType<typeof createGame>, target: GameState): void {
  const paths: Record<GameState, GameState[]> = {
    TITLE: [],
    PLAY: ['PLAY'],
    PAUSED: ['PLAY', 'PAUSED'],
    GAME_OVER: ['PLAY', 'GAME_OVER'],
    INITIALS_ENTRY: ['PLAY', 'GAME_OVER', 'INITIALS_ENTRY'],
  };
  for (const step of paths[target]) g.transition(step);
}
