import { describe, it, expect, beforeEach } from 'vitest';
import { createShip, tryHyperspace } from '../src/entities/ship';
import { setSeed, rand } from '../src/rand';
import {
  HYPERSPACE_COOLDOWN,
  HYPERSPACE_DEATH_RISK,
  HYPERSPACE_INVULN,
  PLAYFIELD_W,
  PLAYFIELD_H,
} from '../src/config';

describe('hyperspace', () => {
  beforeEach(() => setSeed(42));

  it('teleports to within playfield bounds', () => {
    const ship = createShip(100, 100);
    tryHyperspace(ship, rand);
    expect(ship.x).toBeGreaterThanOrEqual(0);
    expect(ship.x).toBeLessThan(PLAYFIELD_W);
    expect(ship.y).toBeGreaterThanOrEqual(0);
    expect(ship.y).toBeLessThan(PLAYFIELD_H);
  });

  it('zeroes velocity', () => {
    const ship = createShip(100, 100);
    ship.vx = 300;
    ship.vy = -200;
    tryHyperspace(ship, rand);
    expect(ship.vx).toBe(0);
    expect(ship.vy).toBe(0);
  });

  it('sets invulnerability window', () => {
    const ship = createShip(100, 100);
    ship.invulnUntil = 0;
    tryHyperspace(ship, rand);
    expect(ship.invulnUntil).toBeGreaterThanOrEqual(HYPERSPACE_INVULN);
  });

  it('sets hyperspace cooldown', () => {
    const ship = createShip(100, 100);
    tryHyperspace(ship, rand);
    expect(ship.hyperspaceCooldown).toBeCloseTo(HYPERSPACE_COOLDOWN, 6);
  });

  it('is a no-op while on cooldown', () => {
    const ship = createShip(100, 100);
    tryHyperspace(ship, rand);
    const xAfterFirst = ship.x;
    const yAfterFirst = ship.y;
    tryHyperspace(ship, rand);
    expect(ship.x).toBe(xAfterFirst);
    expect(ship.y).toBe(yAfterFirst);
  });

  it('is a no-op on a dead ship', () => {
    const ship = createShip(100, 100);
    ship.alive = false;
    const xBefore = ship.x;
    tryHyperspace(ship, rand);
    expect(ship.x).toBe(xBefore);
  });

  it('death rate ≈ 10% over 10,000 seeded samples (within ±2%)', () => {
    setSeed(42);
    const N = 10_000;
    let deaths = 0;
    for (let i = 0; i < N; i++) {
      const ship = createShip(100, 100);
      tryHyperspace(ship, rand);
      if (!ship.alive) deaths++;
    }
    const rate = deaths / N;
    expect(Math.abs(rate - HYPERSPACE_DEATH_RISK)).toBeLessThan(0.02);
  });
});
