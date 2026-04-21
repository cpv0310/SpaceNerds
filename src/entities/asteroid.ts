import { type CoreEntity, type Point, initCore } from './core';
import type { Renderer } from '../render/canvas';
import type { EntityStore } from '../engine/entities';
import { rand as defaultRand } from '../rand';
import {
  ASTEROID_R_LARGE,
  ASTEROID_R_MEDIUM,
  ASTEROID_R_SMALL,
  ASTEROID_HULL_JITTER,
  ASTEROID_SPLIT_SPEED_BOOST,
  ASTEROID_INIT_SPEED_MIN,
  ASTEROID_INIT_SPEED_MAX,
  ASTEROID_INITIAL_COUNT,
  ASTEROID_MIN_SHIP_DIST,
  PLAYFIELD_W,
  PLAYFIELD_H,
  PALETTE,
} from '../config';

export type AsteroidTier = 'large' | 'medium' | 'small';

export interface Asteroid extends CoreEntity {
  kind: 'asteroid';
  tier: AsteroidTier;
  hull: Point[];
  rotVel: number;
}

export const ASTEROID_RADIUS: Record<AsteroidTier, number> = {
  large: ASTEROID_R_LARGE,
  medium: ASTEROID_R_MEDIUM,
  small: ASTEROID_R_SMALL,
};

const NEXT_TIER: Record<AsteroidTier, AsteroidTier | null> = {
  large: 'medium',
  medium: 'small',
  small: null,
};

function generateHull(radius: number, randFn: () => number): Point[] {
  const count = 8 + Math.floor(randFn() * 5);
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const jitter = 1 + (randFn() * 2 - 1) * ASTEROID_HULL_JITTER;
    const r = radius * jitter;
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return pts;
}

export function createAsteroid(
  x: number,
  y: number,
  tier: AsteroidTier,
  vx: number,
  vy: number,
  randFn: () => number = defaultRand
): Asteroid {
  const radius = ASTEROID_RADIUS[tier];
  return {
    ...initCore(x, y, radius),
    vx,
    vy,
    kind: 'asteroid',
    tier,
    hull: generateHull(radius, randFn),
    rotVel: (randFn() - 0.5) * 2,
  };
}

export function updateAsteroid(a: Asteroid, dt: number): void {
  if (!a.alive) return;
  a.rot += a.rotVel * dt;
}

export function splitAsteroid(
  store: EntityStore,
  parent: Asteroid,
  randFn: () => number = defaultRand
): Asteroid[] {
  parent.alive = false;
  const nextTier = NEXT_TIER[parent.tier];
  if (!nextTier) return [];
  const parentSpeed = Math.sqrt(parent.vx * parent.vx + parent.vy * parent.vy);
  const childSpeed = parentSpeed + ASTEROID_SPLIT_SPEED_BOOST;
  const base = Math.atan2(parent.vy, parent.vx);
  const spread = Math.PI / 2 + (randFn() - 0.5) * (Math.PI / 4);
  const children: Asteroid[] = [];
  for (const sign of [1, -1]) {
    const angle = base + sign * spread;
    const jitterX = (randFn() - 0.5) * 6;
    const jitterY = (randFn() - 0.5) * 6;
    const child = store.spawnAsteroid(
      parent.x + jitterX,
      parent.y + jitterY,
      nextTier,
      Math.cos(angle) * childSpeed,
      Math.sin(angle) * childSpeed
    );
    children.push(child);
  }
  return children;
}

export function spawnInitialAsteroids(
  store: EntityStore,
  shipX: number,
  shipY: number,
  count: number = ASTEROID_INITIAL_COUNT,
  randFn: () => number = defaultRand
): Asteroid[] {
  const result: Asteroid[] = [];
  let attempts = 0;
  const maxAttempts = count * 50;
  const minDist2 = ASTEROID_MIN_SHIP_DIST * ASTEROID_MIN_SHIP_DIST;
  while (result.length < count && attempts < maxAttempts) {
    attempts++;
    const x = randFn() * PLAYFIELD_W;
    const y = randFn() * PLAYFIELD_H;
    const dx = x - shipX;
    const dy = y - shipY;
    if (dx * dx + dy * dy < minDist2) continue;
    const angle = randFn() * Math.PI * 2;
    const speed =
      ASTEROID_INIT_SPEED_MIN +
      randFn() * (ASTEROID_INIT_SPEED_MAX - ASTEROID_INIT_SPEED_MIN);
    const a = store.spawnAsteroid(
      x,
      y,
      'large',
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    result.push(a);
  }
  return result;
}

export function drawAsteroid(r: Renderer, a: Asteroid): void {
  if (!a.alive) return;
  const cos = Math.cos(a.rot);
  const sin = Math.sin(a.rot);
  const pts = a.hull.map((p) => ({
    x: a.x + p.x * cos - p.y * sin,
    y: a.y + p.x * sin + p.y * cos,
  }));
  r.strokePath(pts, PALETTE.asteroid, { closed: true });
}
