import { respawnShip, type Ship } from './entities/ship';

export type GameState =
  | 'TITLE'
  | 'PLAY'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'INITIALS_ENTRY';

const LEGAL: Readonly<Record<GameState, readonly GameState[]>> = {
  TITLE: ['PLAY'],
  PLAY: ['PAUSED', 'GAME_OVER'],
  PAUSED: ['PLAY'],
  GAME_OVER: ['TITLE', 'INITIALS_ENTRY'],
  INITIALS_ENTRY: ['TITLE'],
};

export interface Game {
  state(): GameState;
  transition(to: GameState): void;
  canTransition(to: GameState): boolean;
}

export function createGame(): Game {
  let current: GameState = 'TITLE';

  const canTransition = (to: GameState): boolean =>
    LEGAL[current].includes(to);

  return {
    state: () => current,
    canTransition,
    transition(to) {
      if (!canTransition(to)) {
        throw new Error(`illegal transition: ${current} → ${to}`);
      }
      current = to;
    },
  };
}

export function processShipDeath(ship: Ship, game: Game): void {
  if (ship.alive) return;
  ship.lives -= 1;
  if (ship.lives > 0) {
    respawnShip(ship);
  } else if (game.state() === 'PLAY') {
    game.transition('GAME_OVER');
  }
}
