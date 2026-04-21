import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/engine/entities';
import { createRunState } from '../src/game';
import {
  createSpawnTimers,
  updateRunPhase,
  tickSpawners,
} from '../src/spawners';
import { setSeed, rand } from '../src/rand';
import {
  ONBOARDING_GRACE_SEC,
  ASTEROID_SPAWN_INTERVAL,
  FIGHTER_SPAWN_INTERVAL,
} from '../src/config';

beforeEach(() => setSeed(42));

describe('onboarding — phase lifecycle', () => {
  it('starts as onboarding', () => {
    const run = createRunState();
    expect(run.phase).toBe('onboarding');
    expect(run.phaseSwitchAt).toBe(ONBOARDING_GRACE_SEC);
  });

  it('stays onboarding while elapsed < threshold', () => {
    const run = createRunState();
    run.elapsed = ONBOARDING_GRACE_SEC - 0.1;
    updateRunPhase(run);
    expect(run.phase).toBe('onboarding');
  });

  it('switches to active when elapsed >= threshold', () => {
    const run = createRunState();
    run.elapsed = ONBOARDING_GRACE_SEC;
    updateRunPhase(run);
    expect(run.phase).toBe('active');
  });

  it('stays active once switched', () => {
    const run = createRunState();
    run.elapsed = ONBOARDING_GRACE_SEC;
    updateRunPhase(run);
    run.elapsed = ONBOARDING_GRACE_SEC - 100;
    updateRunPhase(run);
    expect(run.phase).toBe('active');
  });
});

describe('onboarding — spawner gating', () => {
  it('no fighters spawn during onboarding, even past spawn interval', () => {
    const store = createStore();
    const run = createRunState();
    const timers = createSpawnTimers();
    const total = FIGHTER_SPAWN_INTERVAL * 3 + 1;
    let t = 0;
    const dt = 1 / 60;
    while (t < total) {
      tickSpawners(store, run, timers, dt, rand);
      t += dt;
    }
    expect(store.byKind('fighter')).toHaveLength(0);
  });

  it('no new asteroids spawn during onboarding', () => {
    const store = createStore();
    const run = createRunState();
    const timers = createSpawnTimers();
    const total = ASTEROID_SPAWN_INTERVAL * 3 + 1;
    let t = 0;
    const dt = 1 / 60;
    while (t < total) {
      tickSpawners(store, run, timers, dt, rand);
      t += dt;
    }
    expect(store.byKind('asteroid')).toHaveLength(0);
  });

  it('fighters begin spawning once phase transitions to active', () => {
    const store = createStore();
    const run = createRunState();
    const timers = createSpawnTimers();
    run.phase = 'active';
    const dt = 1 / 60;
    let t = 0;
    while (t < FIGHTER_SPAWN_INTERVAL * 1.5) {
      tickSpawners(store, run, timers, dt, rand);
      t += dt;
    }
    expect(store.byKind('fighter').length).toBeGreaterThan(0);
  });

  it('asteroids begin spawning once phase transitions to active', () => {
    const store = createStore();
    const run = createRunState();
    const timers = createSpawnTimers();
    run.phase = 'active';
    const dt = 1 / 60;
    let t = 0;
    while (t < ASTEROID_SPAWN_INTERVAL * 1.5) {
      tickSpawners(store, run, timers, dt, rand);
      t += dt;
    }
    expect(store.byKind('asteroid').length).toBeGreaterThan(0);
  });

  it('integration: first spawn occurs shortly AFTER grace window ends', () => {
    const store = createStore();
    const run = createRunState();
    const timers = createSpawnTimers();
    const dt = 1 / 60;
    const firstSpawnTimes: number[] = [];
    let elapsedReal = 0;
    const limit = ONBOARDING_GRACE_SEC + FIGHTER_SPAWN_INTERVAL + 5;
    while (elapsedReal < limit && firstSpawnTimes.length === 0) {
      run.elapsed = elapsedReal;
      updateRunPhase(run);
      tickSpawners(store, run, timers, dt, rand);
      if (store.byKind('fighter').length > 0) firstSpawnTimes.push(elapsedReal);
      elapsedReal += dt;
    }
    expect(firstSpawnTimes[0]).toBeGreaterThanOrEqual(ONBOARDING_GRACE_SEC);
  });
});
