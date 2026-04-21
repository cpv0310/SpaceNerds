import type { EntityStore } from './engine/entities';
import type { RunState } from './game';
import { spawnFighterAtEdge } from './entities/fighter';
import { spawnAsteroidAtEdge } from './entities/asteroid';
import { rand as defaultRand } from './rand';
import {
  ASTEROID_MAX,
  ASTEROID_SPAWN_INTERVAL,
  FIGHTER_MAX,
  FIGHTER_SPAWN_INTERVAL,
} from './config';

export interface SpawnTimers {
  fighter: number;
  asteroid: number;
}

export function createSpawnTimers(): SpawnTimers {
  return {
    fighter: FIGHTER_SPAWN_INTERVAL,
    asteroid: ASTEROID_SPAWN_INTERVAL,
  };
}

function countAlive<T extends { alive: boolean }>(arr: readonly T[]): number {
  let n = 0;
  for (const e of arr) if (e.alive) n++;
  return n;
}

export function updateRunPhase(run: RunState): void {
  if (run.phase === 'onboarding' && run.elapsed >= run.phaseSwitchAt) {
    run.phase = 'active';
  }
}

export function tickSpawners(
  store: EntityStore,
  run: RunState,
  timers: SpawnTimers,
  dt: number,
  randFn: () => number = defaultRand
): void {
  timers.fighter -= dt;
  timers.asteroid -= dt;

  if (run.phase !== 'active') {
    if (timers.fighter < 0) timers.fighter = FIGHTER_SPAWN_INTERVAL;
    if (timers.asteroid < 0) timers.asteroid = ASTEROID_SPAWN_INTERVAL;
    return;
  }

  if (timers.fighter <= 0) {
    if (countAlive(store.byKind('fighter')) < FIGHTER_MAX) {
      spawnFighterAtEdge(store, randFn);
    }
    timers.fighter = FIGHTER_SPAWN_INTERVAL;
  }
  if (timers.asteroid <= 0) {
    if (countAlive(store.byKind('asteroid')) < ASTEROID_MAX) {
      spawnAsteroidAtEdge(store, randFn);
    }
    timers.asteroid = ASTEROID_SPAWN_INTERVAL;
  }
}
