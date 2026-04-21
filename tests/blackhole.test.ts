import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/engine/entities';
import {
  gravityAccel,
  updateBlackHole,
  createBlackHole,
} from '../src/entities/blackhole';
import { resolveCollision } from '../src/engine/resolve';
import { setSeed, rand } from '../src/rand';
import { BH_G, BH_R_MIN, BH_R_MAX_INFLUENCE } from '../src/config';

beforeEach(() => setSeed(42));

describe('blackhole — gravityAccel', () => {
  it('returns [0,0] beyond influence radius', () => {
    const bh = createBlackHole(500, 500);
    const [ax, ay] = gravityAccel(500 + BH_R_MAX_INFLUENCE + 1, 500, bh);
    expect(ax).toBe(0);
    expect(ay).toBe(0);
  });

  it('returns non-zero acceleration inside influence radius', () => {
    const bh = createBlackHole(500, 500);
    const [ax, ay] = gravityAccel(500 + 200, 500, bh);
    expect(ax).toBeLessThan(0);
    expect(ay).toBeCloseTo(0, 6);
  });

  it('acceleration points toward black hole center', () => {
    const bh = createBlackHole(500, 500);
    const [ax, ay] = gravityAccel(600, 600, bh);
    expect(ax).toBeLessThan(0);
    expect(ay).toBeLessThan(0);
  });

  it('is capped at r_min to avoid infinity near center', () => {
    const bh = createBlackHole(0, 0);
    const [ax, ay] = gravityAccel(1, 0, bh);
    const mag = Math.sqrt(ax * ax + ay * ay);
    const cap = BH_G / (BH_R_MIN * BH_R_MIN);
    expect(mag).toBeLessThanOrEqual(cap + 1e-6);
  });

  it('returns [0,0] at exact center (no div-by-zero)', () => {
    const bh = createBlackHole(500, 500);
    const [ax, ay] = gravityAccel(500, 500, bh);
    expect(Number.isFinite(ax)).toBe(true);
    expect(Number.isFinite(ay)).toBe(true);
    expect(ax).toBe(0);
    expect(ay).toBe(0);
  });

  it('magnitude follows inverse-square between r_min and r_max', () => {
    const bh = createBlackHole(0, 0);
    const r1 = 100;
    const r2 = 200;
    const [ax1] = gravityAccel(r1, 0, bh);
    const [ax2] = gravityAccel(r2, 0, bh);
    const ratio = Math.abs(ax2) / Math.abs(ax1);
    expect(ratio).toBeCloseTo((r1 * r1) / (r2 * r2), 3);
  });
});

describe('blackhole — event-horizon collisions', () => {
  it('ship crossing event horizon is destroyed (via resolve)', () => {
    const store = createStore();
    const bh = store.spawnBlackHole(500, 500);
    const s = store.spawnShip(500, 500);
    s.invulnUntil = 0;
    resolveCollision({ a: bh, b: s }, store, rand);
    expect(s.alive).toBe(false);
  });

  it('asteroid crossing event horizon is consumed (no split)', () => {
    const store = createStore();
    const bh = store.spawnBlackHole(500, 500);
    const a = store.spawnAsteroid(500, 500, 'large', 0, 0);
    resolveCollision({ a, b: bh }, store, rand);
    expect(a.alive).toBe(false);
    expect(store.byKind('asteroid').filter((x) => x.alive)).toHaveLength(0);
  });

  it('hyperspace invuln does NOT protect from event horizon (E-1)', () => {
    const store = createStore();
    const bh = store.spawnBlackHole(500, 500);
    const s = store.spawnShip(500, 500);
    s.invulnUntil = 10;
    resolveCollision({ a: bh, b: s }, store, rand);
    expect(s.alive).toBe(false);
  });
});

describe('blackhole — updateBlackHole', () => {
  it('advances ringPhase', () => {
    const bh = createBlackHole(0, 0);
    const before = bh.ringPhase;
    updateBlackHole(bh, 1);
    expect(bh.ringPhase).not.toBe(before);
  });

  it('ringPhase stays in [0, 2π)', () => {
    const bh = createBlackHole(0, 0);
    for (let i = 0; i < 1000; i++) updateBlackHole(bh, 1);
    expect(bh.ringPhase).toBeGreaterThanOrEqual(0);
    expect(bh.ringPhase).toBeLessThan(Math.PI * 2);
  });
});
