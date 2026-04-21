import { type CoreEntity, type Point, initCore } from './core';
import type { Renderer } from '../render/canvas';
import type { Input } from '../engine/input';
import type { EntityStore } from '../engine/entities';
import type { Bullet } from './bullet';
import {
  SHIP_RADIUS,
  SHIP_STARTING_LIVES,
  RESPAWN_INVULN,
  SHIP_ROTATION_SPEED,
  SHIP_THRUST_ACCEL,
  SHIP_FIRE_COOLDOWN,
  BULLET_SPEED,
  HYPERSPACE_COOLDOWN,
  HYPERSPACE_DEATH_RISK,
  HYPERSPACE_INVULN,
  PLAYFIELD_W,
  PLAYFIELD_H,
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

export function respawnShip(ship: Ship): void {
  ship.x = PLAYFIELD_W / 2;
  ship.y = PLAYFIELD_H / 2;
  ship.vx = 0;
  ship.vy = 0;
  ship.ax = 0;
  ship.ay = 0;
  ship.ax_prev = 0;
  ship.ay_prev = 0;
  ship.rot = 0;
  ship.alive = true;
  ship.thrusting = false;
  ship.fireCooldown = 0;
  ship.hyperspaceCooldown = 0;
  ship.invulnUntil = RESPAWN_INVULN;
}

export function controlShip(ship: Ship, input: Input, dt: number): void {
  if (ship.fireCooldown > 0) ship.fireCooldown = Math.max(0, ship.fireCooldown - dt);
  if (ship.hyperspaceCooldown > 0) ship.hyperspaceCooldown = Math.max(0, ship.hyperspaceCooldown - dt);
  if (ship.invulnUntil > 0) ship.invulnUntil = Math.max(0, ship.invulnUntil - dt);
  if (!ship.alive) {
    ship.thrusting = false;
    return;
  }
  const right = input.isDown('ArrowRight') || input.isDown('KeyD') ? 1 : 0;
  const left = input.isDown('ArrowLeft') || input.isDown('KeyA') ? 1 : 0;
  ship.rot += (right - left) * SHIP_ROTATION_SPEED * dt;
  ship.thrusting = input.isDown('ArrowUp') || input.isDown('KeyW');
}

export function tryFireBullet(ship: Ship, store: EntityStore): Bullet | null {
  if (!ship.alive || ship.fireCooldown > 0) return null;
  const noseX = ship.x + Math.cos(ship.rot) * ship.radius * 1.4;
  const noseY = ship.y + Math.sin(ship.rot) * ship.radius * 1.4;
  const bullet = store.spawnBullet(noseX, noseY, ship.rot, 'ship');
  bullet.vx = Math.cos(ship.rot) * BULLET_SPEED;
  bullet.vy = Math.sin(ship.rot) * BULLET_SPEED;
  ship.fireCooldown = SHIP_FIRE_COOLDOWN;
  return bullet;
}

export function tryHyperspace(ship: Ship, randFn: () => number): boolean {
  if (!ship.alive || ship.hyperspaceCooldown > 0) return false;
  ship.x = randFn() * PLAYFIELD_W;
  ship.y = randFn() * PLAYFIELD_H;
  ship.vx = 0;
  ship.vy = 0;
  ship.ax = 0;
  ship.ay = 0;
  ship.ax_prev = 0;
  ship.ay_prev = 0;
  ship.invulnUntil = Math.max(ship.invulnUntil, HYPERSPACE_INVULN);
  ship.hyperspaceCooldown = HYPERSPACE_COOLDOWN;
  if (randFn() < HYPERSPACE_DEATH_RISK) {
    ship.alive = false;
    return true;
  }
  return false;
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
