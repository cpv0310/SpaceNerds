import { describe, it, expect } from 'vitest';
import {
  integrate,
  wrapPlayfield,
  clampMaxSpeed,
  postStep,
  type AccelFn,
} from '../src/engine/physics';
import { type CoreEntity, initCore } from '../src/entities/core';

function makeEntity(overrides: Partial<CoreEntity> = {}): CoreEntity {
  return { ...initCore(0, 0, 0), ...overrides };
}

const ZERO: AccelFn = () => [0, 0];

describe('physics — integrate', () => {
  it('zero-force drop: position = initial + v·t exactly over 10s', () => {
    const e = makeEntity({ x: 0, y: 0, vx: 50, vy: 20 });
    const dt = 1 / 60;
    for (let i = 0; i < 600; i++) integrate([e], dt, ZERO);
    expect(e.x).toBeCloseTo(50 * 10, 9);
    expect(e.y).toBeCloseTo(20 * 10, 9);
    expect(e.vx).toBeCloseTo(50, 9);
    expect(e.vy).toBeCloseTo(20, 9);
  });

  it('constant-force: x(t) = 0.5·a·t² within 1e-3 over 5s', () => {
    const accel: AccelFn = () => [0, 100];
    const e = makeEntity();
    const dt = 1 / 60;
    for (let i = 0; i < 300; i++) integrate([e], dt, accel);
    const t = 5;
    const expected = 0.5 * 100 * t * t;
    expect(e.y).toBeCloseTo(expected, 3);
  });

  it('constant-force at different dt still exact', () => {
    const accel: AccelFn = () => [50, 0];
    const e = makeEntity();
    const dt = 1 / 30;
    for (let i = 0; i < 30; i++) integrate([e], dt, accel);
    const t = 1;
    expect(e.x).toBeCloseTo(0.5 * 50 * t * t, 3);
  });

  it('circular orbit: radius drift < 5% over 10s', () => {
    const GM = 1000;
    const r0 = 100;
    const v0 = Math.sqrt(GM / r0);
    const accel: AccelFn = (e) => {
      const r2 = e.x * e.x + e.y * e.y;
      const r = Math.sqrt(r2);
      const mag = GM / r2;
      return [-(e.x / r) * mag, -(e.y / r) * mag];
    };
    const e = makeEntity({ x: r0, y: 0, vx: 0, vy: v0 });
    const dt = 1 / 60;
    let minR = r0;
    let maxR = r0;
    for (let i = 0; i < 600; i++) {
      integrate([e], dt, accel);
      const r = Math.sqrt(e.x * e.x + e.y * e.y);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
    }
    const drift = (maxR - minR) / r0;
    expect(drift).toBeLessThan(0.05);
  });

  it('skips dead entities', () => {
    const e = makeEntity({ x: 0, vx: 100, alive: false });
    const dt = 1 / 60;
    integrate([e], dt, () => [0, 0]);
    expect(e.x).toBe(0);
  });
});

describe('physics — clampMaxSpeed', () => {
  it('leaves velocity unchanged when below cap', () => {
    const e = makeEntity({ vx: 100, vy: 0 });
    clampMaxSpeed(e, 400);
    expect(e.vx).toBe(100);
    expect(e.vy).toBe(0);
  });

  it('clamps magnitude (not axis-aligned) when above cap', () => {
    const e = makeEntity({ vx: 300, vy: 400 });
    clampMaxSpeed(e, 100);
    const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
    expect(speed).toBeCloseTo(100, 6);
    expect(e.vx / e.vy).toBeCloseTo(300 / 400, 6);
  });

  it('preserves direction after clamp', () => {
    const e = makeEntity({ vx: -500, vy: 500 });
    clampMaxSpeed(e, 50);
    expect(e.vx).toBeCloseTo(-Math.sqrt(2) * 25, 4);
    expect(e.vy).toBeCloseTo(Math.sqrt(2) * 25, 4);
  });

  it('no-op at exactly the cap', () => {
    const e = makeEntity({ vx: 100, vy: 0 });
    clampMaxSpeed(e, 100);
    expect(e.vx).toBe(100);
  });
});

describe('physics — wrapPlayfield', () => {
  it('wraps x past right edge', () => {
    const e = makeEntity({ x: 1280, y: 300 });
    wrapPlayfield(e);
    expect(e.x).toBeLessThan(1280);
    expect(e.x).toBeGreaterThanOrEqual(0);
  });

  it('wraps x past left edge', () => {
    const e = makeEntity({ x: -1, y: 300 });
    wrapPlayfield(e);
    expect(e.x).toBeGreaterThan(0);
  });

  it('wraps y past bottom edge', () => {
    const e = makeEntity({ x: 300, y: 720 });
    wrapPlayfield(e);
    expect(e.y).toBeLessThan(720);
  });

  it('leaves inside-playfield position alone', () => {
    const e = makeEntity({ x: 500, y: 500 });
    wrapPlayfield(e);
    expect(e.x).toBe(500);
    expect(e.y).toBe(500);
  });
});

describe('physics — postStep', () => {
  it('advances age by dt for live entities', () => {
    const e = makeEntity();
    postStep([e], 1 / 60);
    expect(e.age).toBeCloseTo(1 / 60, 9);
  });

  it('wraps playfield in one call', () => {
    const e = makeEntity({ x: 1300, y: 300 });
    postStep([e], 0.01);
    expect(e.x).toBeLessThan(1280);
  });

  it('skips dead entities', () => {
    const e = makeEntity({ alive: false });
    postStep([e], 1);
    expect(e.age).toBe(0);
  });
});
