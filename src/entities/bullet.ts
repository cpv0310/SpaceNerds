import { type CoreEntity, initCore } from './core';
import type { Renderer } from '../render/canvas';
import { BULLET_RADIUS, BULLET_LIFE, PALETTE } from '../config';

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

export function updateBullet(b: Bullet, dt: number): void {
  if (!b.alive) return;
  b.lifeRemaining -= dt;
  if (b.lifeRemaining <= 0) b.alive = false;
}

export function drawBullet(r: Renderer, b: Bullet): void {
  if (!b.alive) return;
  r.strokeCircle(b.x, b.y, b.radius, PALETTE.bullet);
}
