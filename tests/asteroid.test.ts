import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/engine/entities';
import {
  splitAsteroid,
  spawnInitialAsteroids,
  updateAsteroid,
  ASTEROID_RADIUS,
} from '../src/entities/asteroid';
import { setSeed, rand } from '../src/rand';
import {
  ASTEROID_INITIAL_COUNT,
  ASTEROID_MIN_SHIP_DIST,
  ASTEROID_HULL_JITTER,
} from '../src/config';

describe('asteroid — hull generation', () => {
  beforeEach(() => setSeed(42));

  it('has 8-12 vertices', () => {
    const store = createStore();
    for (let i = 0; i < 10; i++) {
      const a = store.spawnAsteroid(100, 100, 'large', 0, 0);
      expect(a.hull.length).toBeGreaterThanOrEqual(8);
      expect(a.hull.length).toBeLessThanOrEqual(12);
    }
  });

  it('vertices within ±jitter tolerance of nominal radius', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const radius = ASTEROID_RADIUS.large;
    for (const p of a.hull) {
      const r = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(r).toBeGreaterThanOrEqual(radius * (1 - ASTEROID_HULL_JITTER) - 1e-9);
      expect(r).toBeLessThanOrEqual(radius * (1 + ASTEROID_HULL_JITTER) + 1e-9);
    }
  });

  it('hull is fixed at spawn (same reference used repeatedly)', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const first = a.hull;
    const second = a.hull;
    expect(second).toBe(first);
  });
});

describe('asteroid — updateAsteroid', () => {
  it('increments rotation by rotVel * dt', () => {
    setSeed(42);
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    a.rotVel = 1.0;
    a.rot = 0;
    updateAsteroid(a, 0.5);
    expect(a.rot).toBeCloseTo(0.5, 6);
  });

  it('does nothing on dead asteroid', () => {
    setSeed(42);
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    a.alive = false;
    a.rotVel = 1.0;
    a.rot = 0;
    updateAsteroid(a, 1);
    expect(a.rot).toBe(0);
  });
});

describe('asteroid — splitAsteroid', () => {
  beforeEach(() => setSeed(42));

  it('large → 2 medium, parent marked dead', () => {
    const store = createStore();
    const parent = store.spawnAsteroid(500, 400, 'large', 10, 0);
    const children = splitAsteroid(store, parent, rand);
    expect(children).toHaveLength(2);
    expect(children.every((c) => c.tier === 'medium')).toBe(true);
    expect(parent.alive).toBe(false);
  });

  it('medium → 2 small', () => {
    const store = createStore();
    const parent = store.spawnAsteroid(0, 0, 'medium', 0, 0);
    const children = splitAsteroid(store, parent, rand);
    expect(children).toHaveLength(2);
    expect(children.every((c) => c.tier === 'small')).toBe(true);
  });

  it('small → no children (vapor)', () => {
    const store = createStore();
    const parent = store.spawnAsteroid(0, 0, 'small', 0, 0);
    const children = splitAsteroid(store, parent, rand);
    expect(children).toHaveLength(0);
    expect(parent.alive).toBe(false);
  });

  it('children inherit parent position (within small jitter)', () => {
    const store = createStore();
    const parent = store.spawnAsteroid(500, 400, 'large', 0, 0);
    const children = splitAsteroid(store, parent, rand);
    for (const c of children) {
      expect(Math.abs(c.x - 500)).toBeLessThan(20);
      expect(Math.abs(c.y - 400)).toBeLessThan(20);
    }
  });

  it('children have outward (non-zero) velocity', () => {
    const store = createStore();
    const parent = store.spawnAsteroid(0, 0, 'large', 10, 0);
    const children = splitAsteroid(store, parent, rand);
    for (const c of children) {
      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      expect(speed).toBeGreaterThan(0);
    }
  });
});

describe('asteroid — spawnInitialAsteroids', () => {
  beforeEach(() => setSeed(42));

  it('spawns at least ASTEROID_INITIAL_COUNT large asteroids', () => {
    const store = createStore();
    const result = spawnInitialAsteroids(store, 640, 360, ASTEROID_INITIAL_COUNT, rand);
    expect(result.length).toBeGreaterThanOrEqual(ASTEROID_INITIAL_COUNT);
    expect(result.every((a) => a.tier === 'large')).toBe(true);
  });

  it('all asteroids ≥ ASTEROID_MIN_SHIP_DIST from ship', () => {
    const store = createStore();
    const result = spawnInitialAsteroids(store, 640, 360, 4, rand);
    for (const a of result) {
      const d = Math.sqrt((a.x - 640) ** 2 + (a.y - 360) ** 2);
      expect(d).toBeGreaterThanOrEqual(ASTEROID_MIN_SHIP_DIST);
    }
  });

  it('gives asteroids initial non-zero velocity', () => {
    const store = createStore();
    const result = spawnInitialAsteroids(store, 640, 360, 4, rand);
    for (const a of result) {
      const s = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      expect(s).toBeGreaterThan(0);
    }
  });
});
