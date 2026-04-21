import type { Renderer } from './canvas';
import type { RunState } from '../game';
import { PALETTE, PLAYFIELD_W } from '../config';

const LIFE_ICON_POINTS: readonly { x: number; y: number }[] = [
  { x: 7, y: 0 },
  { x: -5, y: 4 },
  { x: -3, y: 0 },
  { x: -5, y: -4 },
];

export function drawHud(
  r: Renderer,
  runState: RunState,
  livesRemaining: number
): void {
  r.text(
    `SCORE ${runState.score}`,
    20,
    38,
    PALETTE.hud,
    22,
    'left'
  );

  const rightEdge = PLAYFIELD_W - 20;
  const iconSpacing = 22;
  const iconY = 30;
  for (let i = 0; i < 3; i++) {
    const active = i < livesRemaining;
    const cx = rightEdge - i * iconSpacing;
    drawLifeIcon(r, cx, iconY, active ? PALETTE.ship : PALETTE.ring);
  }
}

function drawLifeIcon(
  r: Renderer,
  cx: number,
  cy: number,
  color: string
): void {
  const pts = LIFE_ICON_POINTS.map((p) => ({
    x: cx - p.x,
    y: cy + p.y,
  }));
  r.strokePath(pts, color, { closed: true });
}
