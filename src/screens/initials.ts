import type { Input } from '../engine/input';
import type { Renderer } from '../render/canvas';
import { PALETTE } from '../config';

export interface InitialsState {
  cursor: number;
  letters: string[];
}

export type InitialsEvent = 'submit' | null;

export function createInitialsState(): InitialsState {
  return { cursor: 0, letters: ['A', 'A', 'A'] };
}

export function resetInitialsState(state: InitialsState): void {
  state.cursor = 0;
  state.letters = ['A', 'A', 'A'];
}

function cycle(letter: string, dir: 1 | -1): string {
  let code = letter.charCodeAt(0) + dir;
  if (code < 65) code = 90;
  else if (code > 90) code = 65;
  return String.fromCharCode(code);
}

export function tickInitialsInput(
  state: InitialsState,
  input: Input
): InitialsEvent {
  if (input.justPressed('Escape')) {
    state.letters = ['A', 'A', 'A'];
    return 'submit';
  }
  if (input.justPressed('Space')) {
    if (state.cursor < 2) {
      state.cursor += 1;
    } else {
      return 'submit';
    }
  }
  if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
    state.letters[state.cursor] = cycle(state.letters[state.cursor], -1);
  }
  if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
    state.letters[state.cursor] = cycle(state.letters[state.cursor], 1);
  }
  return null;
}

export function drawInitialsEntry(
  r: Renderer,
  state: InitialsState,
  finalScore: number
): void {
  const cx = r.width() / 2;
  const h = r.height();
  r.text('NEW HIGH SCORE', cx, h * 0.26, PALETTE.ship, 44);
  r.text(`SCORE  ${finalScore}`, cx, h * 0.38, PALETTE.hud, 22);
  r.text('ENTER INITIALS', cx, h * 0.48, PALETTE.asteroid, 22);

  const spacing = 72;
  const total = spacing * 2;
  const startX = cx - total / 2;
  const letterY = h * 0.62;
  for (let i = 0; i < 3; i++) {
    const x = startX + i * spacing;
    const color = i === state.cursor ? PALETTE.ship : PALETTE.hud;
    r.text(state.letters[i], x, letterY, color, 56);
    if (i === state.cursor) {
      r.strokePath(
        [
          { x: x - 20, y: letterY + 12 },
          { x: x + 20, y: letterY + 12 },
        ],
        PALETTE.ship
      );
    }
  }
  r.text(
    'LEFT / RIGHT  CYCLE   SPACE  CONFIRM   ESC  CANCEL',
    cx,
    h * 0.82,
    PALETTE.ring,
    14
  );
}
