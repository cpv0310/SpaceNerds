import { type CoreEntity, type Point, initCore } from './core';
import type { Renderer } from '../render/canvas';
import type { Input } from '../engine/input';
import {
  SHIP_RADIUS,
  SHIP_STARTING_LIVES,
  RESPAWN_INVULN,
  SHIP_ROTATION_SPEED,
  SHIP_THRUST_ACCEL,
  PALETTE,
} from '../config';

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

export function controlShip(ship: Ship, input: Input, dt: number): void {
  if (!ship.alive) {
    ship.thrusting = false;
    return;
  }
  const right = input.isDown('ArrowRight') || input.isDown('KeyD') ? 1 : 0;
  const left = input.isDown('ArrowLeft') || input.isDown('KeyA') ? 1 : 0;
  ship.rot += (right - left) * SHIP_ROTATION_SPEED * dt;
  ship.thrusting = input.isDown('ArrowUp') || input.isDown('KeyW');
}

export function shipAccel(ship: Ship): [number, number] {
  if (!ship.alive || !ship.thrusting) return [0, 0];
  return [
    Math.cos(ship.rot) * SHIP_THRUST_ACCEL,
    Math.sin(ship.rot) * SHIP_THRUST_ACCEL,
  ];
}

const SHIP_HULL_LOCAL: readonly Point[] = [
  { x: 14, y: 0 },
  { x: -10, y: 8 },
  { x: -6, y: 0 },
  { x: -10, y: -8 },
];

const FLAME_LOCAL: readonly Point[] = [
  { x: -10, y: 3 },
  { x: -16, y: 0 },
  { x: -10, y: -3 },
];

function rotateAndTranslate(
  pts: readonly Point[],
  cx: number,
  cy: number,
  rot: number
): Point[] {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return pts.map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
}

export function drawShip(r: Renderer, ship: Ship): void {
  if (!ship.alive) return;
  const hull = rotateAndTranslate(SHIP_HULL_LOCAL, ship.x, ship.y, ship.rot);
  r.strokePath(hull, PALETTE.ship, { closed: true });
  if (ship.thrusting) {
    const flame = rotateAndTranslate(FLAME_LOCAL, ship.x, ship.y, ship.rot);
    r.strokePath(flame, PALETTE.particle);
  }
}
