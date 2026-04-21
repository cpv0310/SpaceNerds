import { type CoreEntity, initCore } from './core';
import { BULLET_RADIUS, BULLET_LIFE } from '../config';

export type BulletSource = 'ship' | 'fighter';

export interface Bullet extends CoreEntity {
  kind: 'bullet';
  source: BulletSource;
  lifeRemaining: number;
}

export function createBullet(
  x: number,
  y: number,
  rot: number,
  source: BulletSource
): Bullet {
  return {
    ...initCore(x, y, BULLET_RADIUS),
    rot,
    kind: 'bullet',
    source,
    lifeRemaining: BULLET_LIFE,
  };
}
