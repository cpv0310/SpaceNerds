import type { Renderer } from '../render/canvas';
import type { Saved } from '../persist';
import { PALETTE } from '../config';

export function drawTitleScreen(
  r: Renderer,
  saved: Saved,
  muted: boolean
): void {
  const cx = r.width() / 2;
  const h = r.height();
  r.text('SPACENERDS', cx, h * 0.22, PALETTE.ship, 72);
  r.text('DEFEND THE GAMMA SECTOR', cx, h * 0.32, PALETTE.asteroid, 18);

  r.text('HIGH SCORES', cx, h * 0.42, PALETTE.hud, 18);
  const top = saved.highScores.slice(0, 5);
  if (top.length === 0) {
    r.text('---', cx, h * 0.5, PALETTE.ring, 18);
  } else {
    for (let i = 0; i < top.length; i++) {
      const e = top[i];
      const y = h * (0.5 + i * 0.05);
      r.text(
        `${String(i + 1).padStart(2, ' ')}  ${e.initials}  ${String(e.score).padStart(6, ' ')}`,
        cx,
        y,
        i === 0 ? PALETTE.ship : PALETTE.hud,
        18
      );
    }
  }
  r.text('PRESS SPACE TO PLAY', cx, h * 0.84, PALETTE.hud, 26);
  r.text(
    'ARROWS ROTATE  UP THRUSTS  SPACE FIRES  SHIFT HYPERSPACE  M MUTE',
    cx,
    h * 0.92,
    PALETTE.ring,
    12
  );
  if (muted) r.text('[ MUTED ]', cx, h * 0.96, PALETTE.fighter, 12);
}
