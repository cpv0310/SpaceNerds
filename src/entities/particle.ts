import { type CoreEntity, initCore } from './core';

export interface Particle extends CoreEntity {
  kind: 'particle';
  lifeRemaining: number;
  color: string;
  length: number;
}

export function createParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string,
  life: number,
  length = 0
): Particle {
  return {
    ...initCore(x, y, 0),
    vx,
    vy,
    kind: 'particle',
    lifeRemaining: life,
    color,
    length,
  };
}
