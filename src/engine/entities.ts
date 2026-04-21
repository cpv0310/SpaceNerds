import { type Ship, createShip } from '../entities/ship';
import {
  type Asteroid,
  type AsteroidTier,
  createAsteroid,
} from '../entities/asteroid';
import {
  type Bullet,
  type BulletSource,
  createBullet,
} from '../entities/bullet';
import { type Fighter, createFighter } from '../entities/fighter';
import { type BlackHole, createBlackHole } from '../entities/blackhole';
import { type Particle, createParticle } from '../entities/particle';

export type Entity = Ship | Asteroid | Bullet | Fighter | BlackHole | Particle;
export type EntityKind = Entity['kind'];

type KindToEntity = {
  ship: Ship;
  asteroid: Asteroid;
  bullet: Bullet;
  fighter: Fighter;
  blackhole: BlackHole;
  particle: Particle;
};

export interface EntityStore {
  spawnShip(x: number, y: number): Ship;
  spawnAsteroid(
    x: number,
    y: number,
    tier: AsteroidTier,
    vx: number,
    vy: number
  ): Asteroid;
  spawnBullet(x: number, y: number, rot: number, source: BulletSource): Bullet;
  spawnFighter(x: number, y: number): Fighter;
  spawnBlackHole(x: number, y: number): BlackHole;
  spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    life: number
  ): Particle;
  all(): Entity[];
  byKind<K extends EntityKind>(kind: K): KindToEntity[K][];
  despawn(e: Entity): void;
  compact(): void;
  clear(): void;
}

export function createStore(): EntityStore {
  const pools: {
    ship: Ship[];
    asteroid: Asteroid[];
    bullet: Bullet[];
    fighter: Fighter[];
    blackhole: BlackHole[];
    particle: Particle[];
  } = {
    ship: [],
    asteroid: [],
    bullet: [],
    fighter: [],
    blackhole: [],
    particle: [],
  };

  return {
    spawnShip(x, y) {
      const s = createShip(x, y);
      pools.ship.push(s);
      return s;
    },
    spawnAsteroid(x, y, tier, vx, vy) {
      const a = createAsteroid(x, y, tier, vx, vy);
      pools.asteroid.push(a);
      return a;
    },
    spawnBullet(x, y, rot, source) {
      const b = createBullet(x, y, rot, source);
      pools.bullet.push(b);
      return b;
    },
    spawnFighter(x, y) {
      const f = createFighter(x, y);
      pools.fighter.push(f);
      return f;
    },
    spawnBlackHole(x, y) {
      const bh = createBlackHole(x, y);
      pools.blackhole.push(bh);
      return bh;
    },
    spawnParticle(x, y, vx, vy, color, life) {
      const p = createParticle(x, y, vx, vy, color, life);
      pools.particle.push(p);
      return p;
    },
    all() {
      return [
        ...pools.ship,
        ...pools.asteroid,
        ...pools.bullet,
        ...pools.fighter,
        ...pools.blackhole,
        ...pools.particle,
      ];
    },
    byKind<K extends EntityKind>(kind: K): KindToEntity[K][] {
      return pools[kind] as unknown as KindToEntity[K][];
    },
    despawn(e) {
      e.alive = false;
    },
    compact() {
      for (const k of Object.keys(pools) as EntityKind[]) {
        const arr = pools[k] as Entity[];
        let write = 0;
        for (let read = 0; read < arr.length; read++) {
          if (arr[read].alive) {
            if (write !== read) arr[write] = arr[read];
            write++;
          }
        }
        arr.length = write;
      }
    },
    clear() {
      pools.ship.length = 0;
      pools.asteroid.length = 0;
      pools.bullet.length = 0;
      pools.fighter.length = 0;
      pools.blackhole.length = 0;
      pools.particle.length = 0;
    },
  };
}
