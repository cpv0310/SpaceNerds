import { type CoreEntity, type Point, initCore } from './core';
import type { Renderer } from '../render/canvas';
import type { EntityStore } from '../engine/entities';
import type { Ship } from './ship';
import type { Bullet } from './bullet';
import {
  FIGHTER_RADIUS,
  FIGHTER_THRUST_ACCEL,
  FIGHTER_FIRE_COOLDOWN,
  FIGHTER_BULLET_SPEED,
  FIGHTER_APPROACH_DIST,
  FIGHTER_RETREAT_DIST,
  PLAYFIELD_W,
  PLAYFIELD_H,
  PALETTE,
} from '../config';

export type FighterAiState = 'approach' | 'strafe' | 'retreat';

export interface Fighter extends CoreEntity {
  kind: 'fighter';
  aiState: FighterAiState;
  aiTimer: number;
  fireCooldown: number;
}

export function createFighter(x: number, y: number): Fighter {
  return {
    ...initCore(x, y, FIGHTER_RADIUS),
    kind: 'fighter',
    aiState: 'approach',
    aiTimer: 0,
    fireCooldown: 0,
  };
}

const APPROACH_DIST_SQ = FIGHTER_APPROACH_DIST * FIGHTER_APPROACH_DIST;
const RETREAT_DIST_SQ = FIGHTER_RETREAT_DIST * FIGHTER_RETREAT_DIST;

export function controlFighter(f: Fighter, ship: Ship, dt: number): void {
  if (f.fireCooldown > 0) f.fireCooldown = Math.max(0, f.fireCooldown - dt);
  f.aiTimer += dt;
  if (!f.alive) return;

  const dx = ship.x - f.x;
  const dy = ship.y - f.y;
  const d2 = dx * dx + dy * dy;
  if (d2 > APPROACH_DIST_SQ) f.aiState = 'approach';
  else if (d2 < RETREAT_DIST_SQ) f.aiState = 'retreat';
  else f.aiState = 'strafe';

  const angleToShip = Math.atan2(dy, dx);
  if (f.aiState === 'approach') f.rot = angleToShip;
  else if (f.aiState === 'retreat') f.rot = angleToShip + Math.PI;
  else f.rot = angleToShip + Math.PI / 2;
}

export function fighterAccel(f: Fighter): [number, number] {
  if (!f.alive) return [0, 0];
  return [
    Math.cos(f.rot) * FIGHTER_THRUST_ACCEL,
    Math.sin(f.rot) * FIGHTER_THRUST_ACCEL,
  ];
}

export function tryFighterFire(
  f: Fighter,
  ship: Ship,
  store: EntityStore
): Bullet | null {
  if (!f.alive || f.fireCooldown > 0) return null;
  if (f.aiState !== 'strafe') return null;
  const angle = Math.atan2(ship.y - f.y, ship.x - f.x);
  const nx = f.x + Math.cos(angle) * f.radius * 1.4;
  const ny = f.y + Math.sin(angle) * f.radius * 1.4;
  const bullet = store.spawnBullet(nx, ny, angle, 'fighter');
  bullet.vx = Math.cos(angle) * FIGHTER_BULLET_SPEED;
  bullet.vy = Math.sin(angle) * FIGHTER_BULLET_SPEED;
  f.fireCooldown = FIGHTER_FIRE_COOLDOWN;
  return bullet;
}

export function spawnFighterAtEdge(
  store: EntityStore,
  randFn: () => number
): Fighter {
  const edge = Math.floor(randFn() * 4);
  let x: number;
  let y: number;
  if (edge === 0) {
    x = randFn() * PLAYFIELD_W;
    y = 10;
  } else if (edge === 1) {
    x = PLAYFIELD_W - 10;
    y = randFn() * PLAYFIELD_H;
  } else if (edge === 2) {
    x = randFn() * PLAYFIELD_W;
    y = PLAYFIELD_H - 10;
  } else {
    x = 10;
    y = randFn() * PLAYFIELD_H;
  }
  return store.spawnFighter(x, y);
}

const FIGHTER_HULL_LOCAL: readonly Point[] = [
  { x: 12, y: 0 },
  { x: 0, y: 9 },
  { x: -8, y: 5 },
  { x: -4, y: 0 },
  { x: -8, y: -5 },
  { x: 0, y: -9 },
];

export function drawFighter(r: Renderer, f: Fighter): void {
  if (!f.alive) return;
  const cos = Math.cos(f.rot);
  const sin = Math.sin(f.rot);
  const pts = FIGHTER_HULL_LOCAL.map((p) => ({
    x: f.x + p.x * cos - p.y * sin,
    y: f.y + p.x * sin + p.y * cos,
  }));
  r.strokePath(pts, PALETTE.fighter, { closed: true });
}
