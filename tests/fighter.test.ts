import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/engine/entities';
import {
  controlFighter,
  fighterAccel,
  tryFighterFire,
  spawnFighterAtEdge,
} from '../src/entities/fighter';
import { createShip } from '../src/entities/ship';
import { setSeed, rand } from '../src/rand';
import {
  FIGHTER_APPROACH_DIST,
  FIGHTER_RETREAT_DIST,
  FIGHTER_THRUST_ACCEL,
  FIGHTER_BULLET_SPEED,
  FIGHTER_FIRE_COOLDOWN,
  PLAYFIELD_W,
  PLAYFIELD_H,
} from '../src/config';

beforeEach(() => setSeed(42));

describe('fighter — AI state', () => {
  it('approaches when > APPROACH_DIST from player', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const ship = createShip(FIGHTER_APPROACH_DIST + 50, 0);
    controlFighter(f, ship, 0.016);
    expect(f.aiState).toBe('approach');
  });

  it('strafes between RETREAT_DIST and APPROACH_DIST', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const midDist = (FIGHTER_APPROACH_DIST + FIGHTER_RETREAT_DIST) / 2;
    const ship = createShip(midDist, 0);
    controlFighter(f, ship, 0.016);
    expect(f.aiState).toBe('strafe');
  });

  it('retreats when < RETREAT_DIST from player', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const ship = createShip(FIGHTER_RETREAT_DIST - 10, 0);
    controlFighter(f, ship, 0.016);
    expect(f.aiState).toBe('retreat');
  });
});

describe('fighter — rotation per state', () => {
  it('approach: faces player (+x direction when player east)', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const ship = createShip(500, 0);
    controlFighter(f, ship, 0.016);
    expect(Math.cos(f.rot)).toBeCloseTo(1, 5);
  });

  it('strafe: perpendicular to ship direction', () => {
    const store = createStore();
    const mid = (FIGHTER_APPROACH_DIST + FIGHTER_RETREAT_DIST) / 2;
    const f = store.spawnFighter(0, 0);
    const ship = createShip(mid, 0);
    controlFighter(f, ship, 0.016);
    expect(Math.abs(Math.cos(f.rot))).toBeLessThan(1e-4);
  });

  it('retreat: away from player', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const ship = createShip(FIGHTER_RETREAT_DIST - 10, 0);
    controlFighter(f, ship, 0.016);
    expect(Math.cos(f.rot)).toBeCloseTo(-1, 5);
  });
});

describe('fighter — accel', () => {
  it('fighterAccel magnitude = FIGHTER_THRUST_ACCEL', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    f.alive = true;
    f.rot = 0;
    const [ax, ay] = fighterAccel(f);
    expect(Math.sqrt(ax * ax + ay * ay)).toBeCloseTo(FIGHTER_THRUST_ACCEL, 4);
  });

  it('dead fighter has zero accel', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    f.alive = false;
    expect(fighterAccel(f)).toEqual([0, 0]);
  });
});

describe('fighter — firing', () => {
  it('fires a fighter-source bullet toward the ship while strafing', () => {
    const store = createStore();
    const mid = (FIGHTER_APPROACH_DIST + FIGHTER_RETREAT_DIST) / 2;
    const f = store.spawnFighter(0, 0);
    const ship = createShip(mid, 0);
    controlFighter(f, ship, 0.016);
    const bullet = tryFighterFire(f, ship, store);
    expect(bullet).not.toBeNull();
    expect(bullet!.source).toBe('fighter');
    expect(bullet!.vx).toBeCloseTo(FIGHTER_BULLET_SPEED, 3);
  });

  it('does not fire while approaching (out of range)', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const ship = createShip(FIGHTER_APPROACH_DIST + 100, 0);
    controlFighter(f, ship, 0.016);
    expect(tryFighterFire(f, ship, store)).toBeNull();
  });

  it('respects fire cooldown', () => {
    const store = createStore();
    const mid = (FIGHTER_APPROACH_DIST + FIGHTER_RETREAT_DIST) / 2;
    const f = store.spawnFighter(0, 0);
    const ship = createShip(mid, 0);
    controlFighter(f, ship, 0.016);
    tryFighterFire(f, ship, store);
    expect(f.fireCooldown).toBeCloseTo(FIGHTER_FIRE_COOLDOWN, 4);
    const second = tryFighterFire(f, ship, store);
    expect(second).toBeNull();
  });

  it('does not fire if dead', () => {
    const store = createStore();
    const mid = (FIGHTER_APPROACH_DIST + FIGHTER_RETREAT_DIST) / 2;
    const f = store.spawnFighter(0, 0);
    f.alive = false;
    const ship = createShip(mid, 0);
    expect(tryFighterFire(f, ship, store)).toBeNull();
  });
});

describe('fighter — spawnFighterAtEdge', () => {
  it('spawns inside the playfield', () => {
    const store = createStore();
    const f = spawnFighterAtEdge(store, rand);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.x).toBeLessThanOrEqual(PLAYFIELD_W);
    expect(f.y).toBeGreaterThanOrEqual(0);
    expect(f.y).toBeLessThanOrEqual(PLAYFIELD_H);
  });

  it('spawns at an edge (x or y near boundary)', () => {
    const store = createStore();
    const f = spawnFighterAtEdge(store, rand);
    const nearEdge =
      f.x < 20 || f.x > PLAYFIELD_W - 20 || f.y < 20 || f.y > PLAYFIELD_H - 20;
    expect(nearEdge).toBe(true);
  });
});

describe('fighter — cooldown ticks', () => {
  it('decrements fireCooldown each tick', () => {
    const store = createStore();
    const f = store.spawnFighter(0, 0);
    const ship = createShip(9999, 0);
    f.fireCooldown = 1.0;
    controlFighter(f, ship, 0.1);
    expect(f.fireCooldown).toBeCloseTo(0.9, 5);
  });
});
