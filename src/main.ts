import { run } from './engine/loop';
import { createInput } from './engine/input';
import { createGame, type GameState } from './game';
import { createRenderer, type Renderer } from './render/canvas';
import { PALETTE } from './config';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('missing #game canvas');

const renderer = createRenderer({ canvas });
window.addEventListener('resize', () => renderer.resize());

const game = createGame();
const input = createInput(window);

function handleStateInputs(): void {
  const s = game.state();
  if (input.justPressed('Space') && s === 'TITLE') {
    game.transition('PLAY');
    return;
  }
  if (input.justPressed('Escape')) {
    if (s === 'PLAY') game.transition('PAUSED');
    else if (s === 'PAUSED') game.transition('PLAY');
  }
}

run(
  (_dt) => {
    input.captureFrame();
    handleStateInputs();
  },
  (_alpha) => {
    render();
  }
);

function render(): void {
  renderer.beginFrame();
  const s = game.state();
  switch (s) {
    case 'TITLE':
      renderTitle(renderer);
      break;
    case 'PLAY':
      renderPlay(renderer);
      break;
    case 'PAUSED':
      renderPlay(renderer);
      renderPausedOverlay(renderer);
      break;
    case 'GAME_OVER':
      renderGameOver(renderer);
      break;
    case 'INITIALS_ENTRY':
      renderInitialsEntry(renderer);
      break;
  }
  renderDebugBadge(renderer, s);
}

function renderTitle(r: Renderer): void {
  const cx = r.width() / 2;
  const h = r.height();
  r.text('SPACENERDS', cx, h * 0.38, PALETTE.ship, 72);
  r.text('DEFEND THE GAMMA SECTOR', cx, h * 0.5, PALETTE.asteroid, 20);
  r.text('PRESS SPACE TO PLAY', cx, h * 0.66, PALETTE.hud, 28);
}

function renderPlay(r: Renderer): void {
  r.text(
    'PLAY (entities land in Task 5+)',
    r.width() / 2,
    r.height() / 2,
    PALETTE.hud,
    18
  );
}

function renderPausedOverlay(r: Renderer): void {
  r.text('PAUSED', r.width() / 2, r.height() / 2, PALETTE.hud, 56);
  r.text(
    'ESC TO RESUME',
    r.width() / 2,
    r.height() / 2 + 50,
    PALETTE.hud,
    18
  );
}

function renderGameOver(r: Renderer): void {
  r.text('GAME OVER', r.width() / 2, r.height() / 2, PALETTE.fighter, 56);
}

function renderInitialsEntry(r: Renderer): void {
  r.text('ENTER INITIALS', r.width() / 2, r.height() / 2, PALETTE.hud, 40);
}

function renderDebugBadge(r: Renderer, s: GameState): void {
  r.text(`state: ${s}`, 12, 24, PALETTE.hud, 14, 'left');
}
