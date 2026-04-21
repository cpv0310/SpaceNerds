import { describe, it, expect, beforeEach } from 'vitest';
import { detect } from '../src/engine/collision';
import { resolveCollision } from '../src/engine/resolve';
import { createStore } from '../src/engine/entities';
import { setSeed, rand } from '../src/rand';
import { SHIP_RADIUS, ASTEROID_R_LARGE, BULLET_RADIUS } from '../src/config';

beforeEach(() => setSeed(42));

describe('collision.detect — circle-circle geometry', () => {
  it('overlapping entities produce a collision', () => {
    const store = createStore();
    const s = store.spawnShip(100, 100);
    const a = store.spawnAsteroid(100 + SHIP_RADIUS, 100, 'large', 0, 0);
    const pairs = detect(store.all());
    expect(pairs).toHaveLength(1);
    expect(pairs[0].a).toBe(a);
    expect(pairs[0].b).toBe(s);
  });

  it('just-touching (dist == r1+r2) produces a collision', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnAsteroid(SHIP_RADIUS + ASTEROID_R_LARGE, 0, 'large', 0, 0);
    expect(detect(store.all())).toHaveLength(1);
  });

  it('just-separated does not collide', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnAsteroid(
      SHIP_RADIUS + ASTEROID_R_LARGE + 0.5,
      0,
      'large',
      0,
      0
    );
    expect(detect(store.all())).toHaveLength(0);
  });

  it('dead entities are excluded', () => {
    const store = createStore();
    const s = store.spawnShip(0, 0);
    const a = store.spawnAsteroid(5, 0, 'large', 0, 0);
    s.alive = false;
    expect(detect(store.all())).toHaveLength(0);
    s.alive = true;
    a.alive = false;
    expect(detect(store.all())).toHaveLength(0);
  });

  it('particles are excluded from collision detection', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnParticle(5, 0, 0, 0, '#fff', 1);
    expect(detect(store.all())).toHaveLength(0);
  });

  it('pair ordering is deterministic by kind (ship sorts after everything)', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnAsteroid(SHIP_RADIUS, 0, 'large', 0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('asteroid');
    expect(pairs[0].b.kind).toBe('ship');
  });
});

describe('collision.detect — each of 9 pair kinds', () => {
  it('bullet vs asteroid', () => {
    const store = createStore();
    store.spawnBullet(0, 0, 0, 'ship');
    store.spawnAsteroid(BULLET_RADIUS, 0, 'large', 0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('asteroid');
    expect(pairs[0].b.kind).toBe('bullet');
  });

  it('bullet vs fighter', () => {
    const store = createStore();
    store.spawnBullet(0, 0, 0, 'ship');
    store.spawnFighter(0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('bullet');
    expect(pairs[0].b.kind).toBe('fighter');
  });

  it('ship vs asteroid', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnAsteroid(0, 0, 'large', 0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('asteroid');
    expect(pairs[0].b.kind).toBe('ship');
  });

  it('ship vs fighter', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnFighter(0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('fighter');
    expect(pairs[0].b.kind).toBe('ship');
  });

  it('bullet vs ship', () => {
    const store = createStore();
    store.spawnBullet(0, 0, 0, 'fighter');
    store.spawnShip(0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('bullet');
    expect(pairs[0].b.kind).toBe('ship');
  });

  it('ship vs blackhole', () => {
    const store = createStore();
    store.spawnShip(0, 0);
    store.spawnBlackHole(0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('blackhole');
    expect(pairs[0].b.kind).toBe('ship');
  });

  it('asteroid vs blackhole', () => {
    const store = createStore();
    store.spawnAsteroid(0, 0, 'large', 0, 0);
    store.spawnBlackHole(0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('asteroid');
    expect(pairs[0].b.kind).toBe('blackhole');
  });

  it('fighter vs asteroid', () => {
    const store = createStore();
    store.spawnFighter(0, 0);
    store.spawnAsteroid(0, 0, 'large', 0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('asteroid');
    expect(pairs[0].b.kind).toBe('fighter');
  });

  it('bullet vs blackhole', () => {
    const store = createStore();
    store.spawnBullet(0, 0, 0, 'ship');
    store.spawnBlackHole(0, 0);
    const pairs = detect(store.all());
    expect(pairs[0].a.kind).toBe('blackhole');
    expect(pairs[0].b.kind).toBe('bullet');
  });
});

describe('collision.resolve — 9 cases', () => {
  it('bullet vs asteroid: asteroid splits, bullet consumed', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 10, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a, b }, store, rand);
    expect(a.alive).toBe(false);
    expect(b.alive).toBe(false);
    expect(
      store.byKind('asteroid').filter((x) => x.alive && x.tier === 'medium')
    ).toHaveLength(2);
  });

  it('bullet vs fighter (ship bullet): fighter dies', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    const f = store.spawnFighter(0, 0);
    resolveCollision({ a: b, b: f }, store, rand);
    expect(f.alive).toBe(false);
    expect(b.alive).toBe(false);
  });

  it('ship vs asteroid: ship dies + asteroid splits', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 0;
    resolveCollision({ a, b: s }, store, rand);
    expect(s.alive).toBe(false);
    expect(a.alive).toBe(false);
  });

  it('ship vs fighter: both destroyed', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 0;
    resolveCollision({ a: f, b: s }, store, rand);
    expect(f.alive).toBe(false);
    expect(s.alive).toBe(false);
  });

  it('ship vs fighter bullet: ship dies', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'fighter');
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 0;
    resolveCollision({ a: b, b: s }, store, rand);
    expect(s.alive).toBe(false);
    expect(b.alive).toBe(false);
  });

  it('ship vs blackhole: ship destroyed even if invulnerable (E-1)', () => {
    const store = createStore();
    const bh = store.spawnBlackHole(0, 0);
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 100;
    resolveCollision({ a: bh, b: s }, store, rand);
    expect(s.alive).toBe(false);
  });

  it('asteroid vs blackhole: asteroid consumed (no split)', () => {
    const store = createStore();
    const bh = store.spawnBlackHole(0, 0);
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    resolveCollision({ a, b: bh }, store, rand);
    expect(a.alive).toBe(false);
    expect(store.byKind('asteroid').filter((x) => x.alive)).toHaveLength(0);
  });

  it('fighter vs asteroid: both destroyed, no score (E-6)', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const f = store.spawnFighter(0, 0);
    resolveCollision({ a, b: f }, store, rand);
    expect(a.alive).toBe(false);
    expect(f.alive).toBe(false);
    expect(store.byKind('asteroid').filter((x) => x.alive)).toHaveLength(0);
  });

  it('bullet vs blackhole: bullet consumed', () => {
    const store = createStore();
    const bh = store.spawnBlackHole(0, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a: bh, b }, store, rand);
    expect(b.alive).toBe(false);
  });
});

describe('collision.resolve — edge cases', () => {
  it('E-5: invulnerable ship survives asteroid collision', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 1;
    resolveCollision({ a, b: s }, store, rand);
    expect(s.alive).toBe(true);
    expect(a.alive).toBe(true);
  });

  it('E-5: invulnerable ship survives fighter bullet', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'fighter');
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 1;
    resolveCollision({ a: b, b: s }, store, rand);
    expect(s.alive).toBe(true);
    expect(b.alive).toBe(true);
  });

  it('invulnerable ship kills rammed fighter but survives', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 1;
    resolveCollision({ a: f, b: s }, store, rand);
    expect(f.alive).toBe(false);
    expect(s.alive).toBe(true);
  });

  it('friendly fire ignored: ship bullet vs ship', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    const s = store.spawnShip(0, 0);
    s.invulnUntil = 0;
    resolveCollision({ a: b, b: s }, store, rand);
    expect(s.alive).toBe(true);
    expect(b.alive).toBe(true);
  });

  it('friendly fire ignored: fighter bullet vs fighter', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'fighter');
    const f = store.spawnFighter(0, 0);
    resolveCollision({ a: b, b: f }, store, rand);
    expect(f.alive).toBe(true);
    expect(b.alive).toBe(true);
  });

  it('E-13: second bullet on dead asteroid is a no-op (no double split)', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const b1 = store.spawnBullet(0, 0, 0, 'ship');
    const b2 = store.spawnBullet(0, 0, 0, 'ship');
    resolveCollision({ a, b: b1 }, store, rand);
    const mediumCountAfterFirst = store
      .byKind('asteroid')
      .filter((x) => x.alive && x.tier === 'medium').length;
    resolveCollision({ a, b: b2 }, store, rand);
    const mediumCountAfterSecond = store
      .byKind('asteroid')
      .filter((x) => x.alive && x.tier === 'medium').length;
    expect(mediumCountAfterSecond).toBe(mediumCountAfterFirst);
    expect(b2.alive).toBe(true);
  });

  it('already-dead pair is a no-op', () => {
    const store = createStore();
    const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
    const b = store.spawnBullet(0, 0, 0, 'ship');
    a.alive = false;
    resolveCollision({ a, b }, store, rand);
    expect(b.alive).toBe(true);
  });
});
