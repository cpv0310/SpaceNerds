import { type CoreEntity, initCore } from './core';
import { FIGHTER_RADIUS } from '../config';

export type FighterAiState = 'approach' | 'strafe' | 'retreat';

export interface Fighter extends CoreEntity {
  kind: 'fighter';
  aiState: FighterAiState;
  aiTimer: number;
  fireCooldown: number;
}

export function createFighter(x: number, y: number): Fighter {
  return {
    ...initCore(x, y, FIGHTER_RADIUS),
    kind: 'fighter',
    aiState: 'approach',
    aiTimer: 0,
    fireCooldown: 0,
  };
}
