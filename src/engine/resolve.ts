import type { Collision } from './collision';
import type { EntityStore, Entity } from './entities';
import { splitAsteroid, type Asteroid, type AsteroidTier } from '../entities/asteroid';
import type { Ship } from '../entities/ship';
import type { Bullet } from '../entities/bullet';
import type { RunState } from '../game';
import { rand as defaultRand } from '../rand';
import {
  SCORE_ASTEROID_LARGE,
  SCORE_ASTEROID_MEDIUM,
  SCORE_ASTEROID_SMALL,
  SCORE_FIGHTER,
} from '../config';

const ASTEROID_SCORE: Record<AsteroidTier, number> = {
  large: SCORE_ASTEROID_LARGE,
  medium: SCORE_ASTEROID_MEDIUM,
  small: SCORE_ASTEROID_SMALL,
};

function isShipInvuln(s: Ship): boolean {
  return s.invulnUntil > 0;
}

function pairKey(a: Entity, b: Entity): string {
  return `${a.kind}:${b.kind}`;
}

export interface SfxSink {
  play(name: string): void;
}

const BANG_FOR_TIER: Record<AsteroidTier, string> = {
  large: 'bang_large',
  medium: 'bang_medium',
  small: 'bang_small',
};

export function resolveCollision(
  c: Collision,
  store: EntityStore,
  randFn: () => number = defaultRand,
  runState?: RunState,
  sfx?: SfxSink
): void {
  const { a, b } = c;
  if (!a.alive || !b.alive) return;

  switch (pairKey(a, b)) {
    case 'asteroid:bullet': {
      const ast = a as Asteroid;
      if ((b as Bullet).source === 'ship' && runState) {
        runState.score += ASTEROID_SCORE[ast.tier];
        runState.asteroidsBroken += 1;
      }
      splitAsteroid(store, ast, randFn);
      b.alive = false;
      sfx?.play(BANG_FOR_TIER[ast.tier]);
      return;
    }
    case 'asteroid:fighter': {
      const ast = a as Asteroid;
      a.alive = false;
      b.alive = false;
      sfx?.play(BANG_FOR_TIER[ast.tier]);
      sfx?.play('fighter_bang');
      return;
    }
    case 'asteroid:ship': {
      if (isShipInvuln(b as Ship)) return;
      b.alive = false;
      splitAsteroid(store, a as Asteroid, randFn);
      sfx?.play('ship_bang');
      return;
    }
    case 'asteroid:blackhole': {
      a.alive = false;
      sfx?.play(BANG_FOR_TIER[(a as Asteroid).tier]);
      return;
    }
    case 'blackhole:bullet':
    case 'blackhole:fighter': {
      b.alive = false;
      if (b.kind === 'fighter') sfx?.play('fighter_bang');
      return;
    }
    case 'blackhole:ship': {
      b.alive = false;
      sfx?.play('ship_bang');
      return;
    }
    case 'bullet:fighter': {
      if ((a as Bullet).source === 'ship') {
        if (runState) {
          runState.score += SCORE_FIGHTER;
          runState.enemyKills += 1;
        }
        a.alive = false;
        b.alive = false;
        sfx?.play('fighter_bang');
      }
      return;
    }
    case 'bullet:ship': {
      if ((a as Bullet).source !== 'fighter') return;
      if (isShipInvuln(b as Ship)) return;
      a.alive = false;
      b.alive = false;
      sfx?.play('ship_bang');
      return;
    }
    case 'fighter:ship': {
      if (isShipInvuln(b as Ship)) {
        a.alive = false;
        sfx?.play('fighter_bang');
      } else {
        a.alive = false;
        b.alive = false;
        sfx?.play('ship_bang');
      }
      return;
    }
  }
}
