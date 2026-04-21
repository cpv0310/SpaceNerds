import type { Renderer } from '../render/canvas';
import { PALETTE } from '../config';

export function drawGameOverOverlay(
  r: Renderer,
  finalScore: number,
  isNewHighScore: boolean
): void {
  const cx = r.width() / 2;
  const h = r.height();
  r.text('GAME OVER', cx, h / 2 - 60, PALETTE.fighter, 56);
  r.text(`FINAL SCORE  ${finalScore}`, cx, h / 2 - 10, PALETTE.hud, 26);
  if (isNewHighScore) {
    r.text('NEW HIGH SCORE', cx, h / 2 + 30, PALETTE.ship, 22);
    r.text('PRESS SPACE TO ENTER INITIALS', cx, h / 2 + 70, PALETTE.hud, 18);
  } else {
    r.text('PRESS SPACE TO PLAY AGAIN', cx, h / 2 + 40, PALETTE.hud, 20);
  }
}
