import { describe, it, expect } from 'vitest';
import { createStore } from '../src/engine/entities';
import { createShip, tryFireBullet } from '../src/entities/ship';
import { updateBullet } from '../src/entities/bullet';
import { BULLET_SPEED, BULLET_LIFE, SHIP_FIRE_COOLDOWN } from '../src/config';

describe('bullet — tryFireBullet', () => {
  it('spawns a bullet at ship nose with world-frame velocity', () => {
    const store = createStore();
    const ship = createShip(500, 400);
    ship.rot = 0;
    const bullet = tryFireBullet(ship, store);
    expect(bullet).not.toBeNull();
    expect(bullet!.x).toBeGreaterThan(500);
    expect(bullet!.y).toBeCloseTo(400, 6);
    expect(Math.sqrt(bullet!.vx ** 2 + bullet!.vy ** 2)).toBeCloseTo(
      BULLET_SPEED,
      6
    );
  });

  it('velocity direction matches ship rotation', () => {
    const store = createStore();
    const ship = createShip(0, 0);
    ship.rot = Math.PI / 2;
    const b = tryFireBullet(ship, store)!;
    expect(b.vx).toBeCloseTo(0, 4);
    expect(b.vy).toBeCloseTo(BULLET_SPEED, 4);
  });

  it('velocity is world-frame (ignores ship velocity)', () => {
    const store = createStore();
    const ship = createShip(0, 0);
    ship.rot = 0;
    ship.vx = 200;
    ship.vy = 50;
    const b = tryFireBullet(ship, store)!;
    expect(b.vx).toBeCloseTo(BULLET_SPEED, 4);
    expect(b.vy).toBeCloseTo(0, 4);
  });

  it('sets source to ship', () => {
    const store = createStore();
    const ship = createShip(0, 0);
    const b = tryFireBullet(ship, store)!;
    expect(b.source).toBe('ship');
  });

  it('sets fire cooldown', () => {
    const store = createStore();
    const ship = createShip(0, 0);
    tryFireBullet(ship, store);
    expect(ship.fireCooldown).toBeCloseTo(SHIP_FIRE_COOLDOWN, 6);
  });

  it('returns null while on cooldown', () => {
    const store = createStore();
    const ship = createShip(0, 0);
    tryFireBullet(ship, store);
    const second = tryFireBullet(ship, store);
    expect(second).toBeNull();
    expect(store.byKind('bullet')).toHaveLength(1);
  });

  it('returns null if ship is dead', () => {
    const store = createStore();
    const ship = createShip(0, 0);
    ship.alive = false;
    const b = tryFireBullet(ship, store);
    expect(b).toBeNull();
    expect(store.byKind('bullet')).toHaveLength(0);
  });
});

describe('bullet — updateBullet', () => {
  it('decrements lifeRemaining by dt', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    const start = b.lifeRemaining;
    updateBullet(b, 0.1);
    expect(b.lifeRemaining).toBeCloseTo(start - 0.1, 6);
  });

  it('starts with BULLET_LIFE seconds of life', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    expect(b.lifeRemaining).toBeCloseTo(BULLET_LIFE, 6);
  });

  it('despawns when lifeRemaining reaches 0', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    updateBullet(b, BULLET_LIFE + 0.01);
    expect(b.alive).toBe(false);
  });

  it('stays alive while lifeRemaining > 0', () => {
    const store = createStore();
    const b = store.spawnBullet(0, 0, 0, 'ship');
    updateBullet(b, BULLET_LIFE / 2);
    expect(b.alive).toBe(true);
  });
});
