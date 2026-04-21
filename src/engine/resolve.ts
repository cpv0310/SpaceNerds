import type { Collision } from './collision';
import type { EntityStore, Entity } from './entities';
import { splitAsteroid, type Asteroid } from '../entities/asteroid';
import type { Ship } from '../entities/ship';
import type { Bullet } from '../entities/bullet';
import { rand as defaultRand } from '../rand';

function isShipInvuln(s: Ship): boolean {
  return s.invulnUntil > 0;
}

function pairKey(a: Entity, b: Entity): string {
  return `${a.kind}:${b.kind}`;
}

export function resolveCollision(
  c: Collision,
  store: EntityStore,
  randFn: () => number = defaultRand
): void {
  const { a, b } = c;
  if (!a.alive || !b.alive) return;

  switch (pairKey(a, b)) {
    case 'asteroid:bullet': {
      splitAsteroid(store, a as Asteroid, randFn);
      b.alive = false;
      return;
    }
    case 'asteroid:fighter': {
      a.alive = false;
      b.alive = false;
      return;
    }
    case 'asteroid:ship': {
      if (isShipInvuln(b as Ship)) return;
      b.alive = false;
      splitAsteroid(store, a as Asteroid, randFn);
      return;
    }
    case 'asteroid:blackhole': {
      a.alive = false;
      return;
    }
    case 'blackhole:bullet':
    case 'blackhole:fighter': {
      b.alive = false;
      return;
    }
    case 'blackhole:ship': {
      b.alive = false;
      return;
    }
    case 'bullet:fighter': {
      if ((a as Bullet).source === 'ship') {
        a.alive = false;
        b.alive = false;
      }
      return;
    }
    case 'bullet:ship': {
      if ((a as Bullet).source !== 'fighter') return;
      if (isShipInvuln(b as Ship)) return;
      a.alive = false;
      b.alive = false;
      return;
    }
    case 'fighter:ship': {
      if (isShipInvuln(b as Ship)) {
        a.alive = false;
      } else {
        a.alive = false;
        b.alive = false;
      }
      return;
    }
  }
}
