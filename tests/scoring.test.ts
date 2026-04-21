import { describe, it, expect } from 'vitest';
import { createStore } from '../src/engine/entities';
import { resolveCollision } from '../src/engine/resolve';
import { createRunState } from '../src/game';
import { rand, setSeed } from '../src/rand';
import {
  SCORE_ASTEROID_LARGE,
  SCORE_ASTEROID_MEDIUM,
  SCORE_ASTEROID_SMALL,
  SCORE_FIGHTER,
} from '../src/config';

describe('scoring — asteroid tiers', () => {
  it('large asteroid kill awards SCORE_ASTEROID_LARGE', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a, b }, store, rand, run);
    expect(run.score).toBe(SCORE_ASTEROID_LARGE);
    expect(run.asteroidsBroken).toBe(1);
  });

  it('medium asteroid kill awards SCORE_ASTEROID_MEDIUM', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const a = store.spawnAsteroid(0, 0, 'medium', 0, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a, b }, store, rand, run);
    expect(run.score).toBe(SCORE_ASTEROID_MEDIUM);
  });

  it('small asteroid kill awards SCORE_ASTEROID_SMALL', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const a = store.spawnAsteroid(0, 0, 'small', 0, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a, b }, store, rand, run);
    expect(run.score).toBe(SCORE_ASTEROID_SMALL);
  });
});

describe('scoring — fighter', () => {
  it('ship bullet kill awards SCORE_FIGHTER', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    const f = store.spawnFighter(0, 0);
    resolveCollision({ a: b, b: f }, store, rand, run);
    expect(run.score).toBe(SCORE_FIGHTER);
    expect(run.enemyKills).toBe(1);
  });
});

describe('scoring — no double-award (E-13)', () => {
  it('second bullet on dead asteroid awards nothing', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const b1 = store.spawnBullet(0, 0, 0, 'ship');
    const b2 = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a, b: b1 }, store, rand, run);
    expect(run.score).toBe(SCORE_ASTEROID_LARGE);
    resolveCollision({ a, b: b2 }, store, rand, run);
    expect(run.score).toBe(SCORE_ASTEROID_LARGE);
  });
});

describe('scoring — no-score cases', () => {
  it('fighter killing asteroid awards no points (E-6)', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const f = store.spawnFighter(0, 0);
    resolveCollision({ a, b: f }, store, rand, run);
    expect(run.score).toBe(0);
  });

  it('fighter bullet killing ship awards no points', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 0;
    const b = store.spawnBullet(0, 0, 0, 'fighter');
    resolveCollision({ a: b, b: s }, store, rand, run);
    expect(run.score).toBe(0);
  });

  it('black hole consumption awards no points', () => {
    setSeed(42);
    const store = createStore();
    const run = createRunState();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const bh = store.spawnBlackHole(0, 0);
    resolveCollision({ a, b: bh }, store, rand, run);
    expect(run.score).toBe(0);
  });
});

describe('scoring — runState is optional', () => {
  it('resolve without runState does not throw', () => {
    setSeed(42);
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    expect(() => resolveCollision({ a, b }, store, rand)).not.toThrow();
  });
});
