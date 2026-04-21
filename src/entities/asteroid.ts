import { type CoreEntity, type Point, initCore } from './core';
import {
  ASTEROID_R_LARGE,
  ASTEROID_R_MEDIUM,
  ASTEROID_R_SMALL,
} from '../config';

export type AsteroidTier = 'large' | 'medium' | 'small';

export interface Asteroid extends CoreEntity {
  kind: 'asteroid';
  tier: AsteroidTier;
  hull: Point[];
  rotVel: number;
}

export const ASTEROID_RADIUS: Record<AsteroidTier, number> = {
  large: ASTEROID_R_LARGE,
  medium: ASTEROID_R_MEDIUM,
  small: ASTEROID_R_SMALL,
};

export function createAsteroid(
  x: number,
  y: number,
  tier: AsteroidTier,
  vx: number,
  vy: number
): Asteroid {
  const radius = ASTEROID_RADIUS[tier];
  return {
    ...initCore(x, y, radius),
    vx,
    vy,
    kind: 'asteroid',
    tier,
    hull: [],
    rotVel: 0,
  };
}
