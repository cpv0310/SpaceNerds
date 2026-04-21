import { run } from './engine/loop';
import { createGame, type GameState } from './game';
import { PALETTE, PLAYFIELD_W, PLAYFIELD_H } from './config';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('missing #game canvas');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('no 2d context');

const game = createGame();

let viewW = PLAYFIELD_W;
let viewH = PLAYFIELD_H;

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const aspect = PLAYFIELD_W / PLAYFIELD_H;
  let cssW: number;
  let cssH: number;
  if (window.innerWidth / window.innerHeight > aspect) {
    cssH = window.innerHeight;
    cssW = cssH * aspect;
  } else {
    cssW = window.innerWidth;
    cssH = cssW / aspect;
  }
  canvas!.style.width = `${cssW}px`;
  canvas!.style.height = `${cssH}px`;
  canvas!.width = Math.round(cssW * dpr);
  canvas!.height = Math.round(cssH * dpr);
  const scale = canvas!.width / PLAYFIELD_W;
  ctx!.setTransform(scale, 0, 0, scale, 0, 0);
  ctx!.lineCap = 'round';
  ctx!.lineJoin = 'round';
  viewW = PLAYFIELD_W;
  viewH = PLAYFIELD_H;
}
resize();
window.addEventListener('resize', resize);

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Escape' || e.key.startsWith('Arrow')) {
    e.preventDefault();
  }
  handleKey(e.key);
});

function handleKey(key: string): void {
  const s = game.state();
  if (key === ' ' && s === 'TITLE') {
    game.transition('PLAY');
    return;
  }
  if (key === 'Escape') {
    if (s === 'PLAY') game.transition('PAUSED');
    else if (s === 'PAUSED') game.transition('PLAY');
  }
}

run(
  (_dt) => {
    // no entities yet; Task 5+ hooks into this tick
  },
  (_alpha) => {
    render();
  }
);

function render(): void {
  ctx!.fillStyle = PALETTE.bg;
  ctx!.fillRect(0, 0, viewW, viewH);
  const s = game.state();
  switch (s) {
    case 'TITLE':
      renderTitle();
      break;
    case 'PLAY':
      renderPlay();
      break;
    case 'PAUSED':
      renderPlay();
      renderPausedOverlay();
      break;
    case 'GAME_OVER':
      renderGameOver();
      break;
    case 'INITIALS_ENTRY':
      renderInitialsEntry();
      break;
  }
  renderDebugBadge(s);
}

function renderTitle(): void {
  const cx = viewW / 2;
  drawText('SPACENERDS', cx, viewH * 0.38, 72, PALETTE.ship, 'center');
  drawText(
    'DEFEND THE GAMMA SECTOR',
    cx,
    viewH * 0.5,
    20,
    PALETTE.asteroid,
    'center'
  );
  drawText('PRESS SPACE TO PLAY', cx, viewH * 0.66, 28, PALETTE.hud, 'center');
}

function renderPlay(): void {
  drawText(
    'PLAY (entities land in Task 5+)',
    viewW / 2,
    viewH / 2,
    18,
    PALETTE.hud,
    'center'
  );
}

function renderPausedOverlay(): void {
  ctx!.fillStyle = 'rgba(0,0,0,0.6)';
  ctx!.fillRect(0, 0, viewW, viewH);
  drawText('PAUSED', viewW / 2, viewH / 2, 56, PALETTE.hud, 'center');
  drawText(
    'ESC TO RESUME',
    viewW / 2,
    viewH / 2 + 50,
    18,
    PALETTE.hud,
    'center'
  );
}

function renderGameOver(): void {
  drawText('GAME OVER', viewW / 2, viewH / 2, 56, PALETTE.fighter, 'center');
}

function renderInitialsEntry(): void {
  drawText(
    'ENTER INITIALS',
    viewW / 2,
    viewH / 2,
    40,
    PALETTE.hud,
    'center'
  );
}

function renderDebugBadge(s: GameState): void {
  drawText(`state: ${s}`, 12, 24, 14, PALETTE.hud, 'left');
}

function drawText(
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign
): void {
  ctx!.fillStyle = color;
  ctx!.font = `${size}px monospace`;
  ctx!.textAlign = align;
  ctx!.textBaseline = 'alphabetic';
  ctx!.fillText(str, x, y);
}
