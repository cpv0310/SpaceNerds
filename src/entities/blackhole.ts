import { type CoreEntity, initCore } from './core';
import { BH_R_MIN, BH_R_MAX_INFLUENCE, BH_G } from '../config';

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
