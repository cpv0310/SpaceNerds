import { describe, it, expect } from 'vitest';
import { createStore } from '../src/engine/entities';

describe('entity store', () => {
  it('is empty after construction', () => {
    const store = createStore();
    expect(store.all()).toHaveLength(0);
  });

  describe('spawn', () => {
    it('spawnShip returns a Ship with core fields initialized', () => {
      const store = createStore();
      const ship = store.spawnShip(100, 200);
      expect(ship.kind).toBe('ship');
      expect(ship.x).toBe(100);
      expect(ship.y).toBe(200);
      expect(ship.vx).toBe(0);
      expect(ship.vy).toBe(0);
      expect(ship.ax).toBe(0);
      expect(ship.ay).toBe(0);
      expect(ship.ax_prev).toBe(0);
      expect(ship.ay_prev).toBe(0);
      expect(ship.alive).toBe(true);
      expect(ship.age).toBe(0);
      expect(ship.radius).toBeGreaterThan(0);
      expect(ship.lives).toBe(3);
    });

    it('spawnAsteroid applies tier-specific radius', () => {
      const store = createStore();
      const large = store.spawnAsteroid(0, 0, 'large', 10, 0);
      const medium = store.spawnAsteroid(0, 0, 'medium', 10, 0);
      const small = store.spawnAsteroid(0, 0, 'small', 10, 0);
      expect(large.radius).toBeGreaterThan(medium.radius);
      expect(medium.radius).toBeGreaterThan(small.radius);
      expect(large.tier).toBe('large');
      expect(large.vx).toBe(10);
    });

    it('spawnBullet records source and initializes life', () => {
      const store = createStore();
      const b = store.spawnBullet(10, 10, 0, 'ship');
      expect(b.kind).toBe('bullet');
      expect(b.source).toBe('ship');
      expect(b.lifeRemaining).toBeGreaterThan(0);
    });

    it('spawnFighter starts in approach state', () => {
      const store = createStore();
      const f = store.spawnFighter(10, 10);
      expect(f.kind).toBe('fighter');
      expect(f.aiState).toBe('approach');
    });

    it('spawnBlackHole carries the gravity constants', () => {
      const store = createStore();
      const bh = store.spawnBlackHole(500, 400);
      expect(bh.kind).toBe('blackhole');
      expect(bh.eventHorizonR).toBeGreaterThan(0);
      expect(bh.influenceR).toBeGreaterThan(bh.eventHorizonR);
      expect(bh.G).toBeGreaterThan(0);
    });

    it('spawnParticle carries color and life', () => {
      const store = createStore();
      const p = store.spawnParticle(0, 0, 10, 0, '#fff', 0.5);
      expect(p.kind).toBe('particle');
      expect(p.color).toBe('#fff');
      expect(p.lifeRemaining).toBe(0.5);
    });
  });

  describe('queries', () => {
    it('all() returns every live entity across kinds', () => {
      const store = createStore();
      store.spawnShip(0, 0);
      store.spawnAsteroid(0, 0, 'large', 0, 0);
      store.spawnAsteroid(0, 0, 'medium', 0, 0);
      store.spawnBullet(0, 0, 0, 'ship');
      expect(store.all()).toHaveLength(4);
    });

    it('byKind returns only that kind', () => {
      const store = createStore();
      store.spawnShip(0, 0);
      store.spawnAsteroid(0, 0, 'large', 0, 0);
      store.spawnAsteroid(0, 0, 'small', 0, 0);
      store.spawnBullet(0, 0, 0, 'ship');
      const asteroids = store.byKind('asteroid');
      expect(asteroids).toHaveLength(2);
      expect(asteroids.every((a) => a.kind === 'asteroid')).toBe(true);
    });
  });

  describe('despawn + compact', () => {
    it('despawn marks alive=false but keeps entity until compact', () => {
      const store = createStore();
      const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
      store.despawn(a);
      expect(a.alive).toBe(false);
      expect(store.all()).toHaveLength(1);
    });

    it('compact removes dead entities', () => {
      const store = createStore();
      store.spawnShip(0, 0);
      const a = store.spawnAsteroid(0, 0, 'large', 0, 0);
      const b = store.spawnAsteroid(0, 0, 'medium', 0, 0);
      store.despawn(a);
      store.despawn(b);
      store.compact();
      expect(store.all()).toHaveLength(1);
      expect(store.byKind('asteroid')).toHaveLength(0);
    });

    it('compact preserves live entities in original order', () => {
      const store = createStore();
      const a1 = store.spawnAsteroid(1, 0, 'large', 0, 0);
      const a2 = store.spawnAsteroid(2, 0, 'large', 0, 0);
      const a3 = store.spawnAsteroid(3, 0, 'large', 0, 0);
      store.despawn(a2);
      store.compact();
      const asts = store.byKind('asteroid');
      expect(asts).toHaveLength(2);
      expect(asts[0]).toBe(a1);
      expect(asts[1]).toBe(a3);
    });
  });

  describe('clear', () => {
    it('clear removes all entities', () => {
      const store = createStore();
      store.spawnShip(0, 0);
      store.spawnAsteroid(0, 0, 'large', 0, 0);
      store.spawnBlackHole(0, 0);
      store.clear();
      expect(store.all()).toHaveLength(0);
      expect(store.byKind('ship')).toHaveLength(0);
    });

    it('round-trip: spawn, clear, spawn again works', () => {
      const store = createStore();
      store.spawnShip(0, 0);
      store.clear();
      const ship = store.spawnShip(100, 100);
      expect(store.all()).toHaveLength(1);
      expect(ship.x).toBe(100);
    });
  });
});
