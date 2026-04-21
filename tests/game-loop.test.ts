import { describe, it, expect } from 'vitest';
import { createStepper, TICK_HZ, TICK_MS } from '../src/engine/loop';

describe('fixed-timestep loop', () => {
  it('produces no ticks when no time has elapsed', () => {
    const stepper = createStepper(0);
    let ticks = 0;
    stepper.step(0, () => ticks++, () => {});
    expect(ticks).toBe(0);
  });

  it('produces exactly one tick per TICK_MS elapsed', () => {
    const stepper = createStepper(0);
    let ticks = 0;
    stepper.step(TICK_MS, () => ticks++, () => {});
    expect(ticks).toBe(1);
  });

  it('passes dt in seconds (1/TICK_HZ) to tick callback', () => {
    const stepper = createStepper(0);
    const dts: number[] = [];
    stepper.step(TICK_MS, (dt) => dts.push(dt), () => {});
    expect(dts).toHaveLength(1);
    expect(dts[0]).toBeCloseTo(1 / TICK_HZ, 10);
  });

  it('produces N ticks when N * TICK_MS elapses in one frame', () => {
    const stepper = createStepper(0);
    let ticks = 0;
    stepper.step(TICK_MS * 10, () => ticks++, () => {});
    expect(ticks).toBe(10);
  });

  it('clamps a single frame > 250ms to avoid tick storms (tab-blur resume)', () => {
    const stepper = createStepper(0);
    let ticks = 0;
    stepper.step(5000, () => ticks++, () => {});
    expect(ticks).toBeLessThanOrEqual(16);
    expect(ticks).toBeGreaterThanOrEqual(15);
  });

  it('renders once per step with alpha in [0,1)', () => {
    const stepper = createStepper(0);
    const alphas: number[] = [];
    stepper.step(TICK_MS * 0.5, () => {}, (a) => alphas.push(a));
    expect(alphas).toHaveLength(1);
    expect(alphas[0]).toBeGreaterThanOrEqual(0);
    expect(alphas[0]).toBeLessThan(1);
    expect(alphas[0]).toBeCloseTo(0.5, 5);
  });

  it('drift < 2% over 10 simulated seconds at ~60 Hz frame rate', () => {
    const stepper = createStepper(0);
    let ticks = 0;
    const frameDt = 1000 / 60;
    let now = 0;
    for (let i = 0; i < 600; i++) {
      now += frameDt;
      stepper.step(now, () => ticks++, () => {});
    }
    const expected = 600;
    const drift = Math.abs(ticks - expected) / expected;
    expect(drift).toBeLessThan(0.02);
  });

  it('drift < 2% across jittery frame intervals summing to 10s', () => {
    const stepper = createStepper(0);
    let ticks = 0;
    let now = 0;
    const end = 10_000;
    let i = 0;
    while (now < end) {
      const jitter = 10 + ((i * 7919) % 14);
      now = Math.min(now + jitter, end);
      stepper.step(now, () => ticks++, () => {});
      i++;
    }
    const expected = 600;
    const drift = Math.abs(ticks - expected) / expected;
    expect(drift).toBeLessThan(0.02);
  });

  it('TICK_HZ is 60 per ADR-007', () => {
    expect(TICK_HZ).toBe(60);
    expect(TICK_MS).toBeCloseTo(1000 / 60, 10);
  });
});
