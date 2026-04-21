import { type CoreEntity, initCore } from './core';
import { SHIP_RADIUS, SHIP_STARTING_LIVES, RESPAWN_INVULN } from '../config';

export interface Ship extends CoreEntity {
  kind: 'ship';
  lives: number;
  invulnUntil: number;
  thrusting: boolean;
  fireCooldown: number;
  hyperspaceCooldown: number;
}

export function createShip(x: number, y: number): Ship {
  return {
    ...initCore(x, y, SHIP_RADIUS),
    kind: 'ship',
    lives: SHIP_STARTING_LIVES,
    invulnUntil: RESPAWN_INVULN,
    thrusting: false,
    fireCooldown: 0,
    hyperspaceCooldown: 0,
  };
}
