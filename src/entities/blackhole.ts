import { type CoreEntity, initCore } from './core';
import type { Renderer } from '../render/canvas';
import { BH_R_MIN, BH_R_MAX_INFLUENCE, BH_G, PALETTE } from '../config';

export interface BlackHole extends CoreEntity {
  kind: 'blackhole';
  eventHorizonR: number;
  influenceR: number;
  G: number;
  ringPhase: number;
}

export function createBlackHole(x: number, y: number): BlackHole {
  return {
    ...initCore(x, y, BH_R_MIN),
    kind: 'blackhole',
    eventHorizonR: BH_R_MIN,
    influenceR: BH_R_MAX_INFLUENCE,
    G: BH_G,
    ringPhase: 0,
  };
}

export function gravityAccel(
  ex: number,
  ey: number,
  bh: BlackHole
): [number, number] {
  const dx = bh.x - ex;
  const dy = bh.y - ey;
  const r2 = dx * dx + dy * dy;
  const rMax2 = bh.influenceR * bh.influenceR;
  if (r2 > rMax2) return [0, 0];
  if (r2 < 1e-12) return [0, 0];
  const r = Math.sqrt(r2);
  const rMin2 = bh.eventHorizonR * bh.eventHorizonR;
  const rEff2 = Math.max(r2, rMin2);
  const mag = bh.G / rEff2;
  return [(dx / r) * mag, (dy / r) * mag];
}

export function updateBlackHole(bh: BlackHole, dt: number): void {
  bh.ringPhase = (bh.ringPhase + dt * 0.5) % (Math.PI * 2);
  if (bh.ringPhase < 0) bh.ringPhase += Math.PI * 2;
}

const SPOKE_COUNT = 8;

export function drawBlackHole(r: Renderer, bh: BlackHole): void {
  if (!bh.alive) return;
  r.strokeCircle(bh.x, bh.y, bh.eventHorizonR + 4, PALETTE.blackhole);
  const innerR = bh.eventHorizonR + 4;
  const outerR = bh.eventHorizonR + 14;
  for (let i = 0; i < SPOKE_COUNT; i++) {
    const a = bh.ringPhase + (i / SPOKE_COUNT) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    r.strokePath(
      [
        { x: bh.x + cos * innerR, y: bh.y + sin * innerR },
        { x: bh.x + cos * outerR, y: bh.y + sin * outerR },
      ],
      PALETTE.blackhole
    );
  }
  r.strokeDashedCircle(bh.x, bh.y, bh.influenceR, PALETTE.ring, [10, 8]);
}
