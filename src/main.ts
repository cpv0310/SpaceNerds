import { run } from './engine/loop';
import { createInput } from './engine/input';
import { createStore } from './engine/entities';
import { integrate, clampMaxSpeed, postStep } from './engine/physics';
import { detect } from './engine/collision';
import { resolveCollision } from './engine/resolve';
import type { CoreEntity } from './entities/core';
import {
  controlShip,
  shipAccel,
  drawShip,
  tryFireBullet,
  tryHyperspace,
  type Ship,
} from './entities/ship';
import {
  updateBullet,
  drawBullet,
  type Bullet,
} from './entities/bullet';
import {
  spawnInitialAsteroids,
  updateAsteroid,
  drawAsteroid,
  type Asteroid,
} from './entities/asteroid';
import {
  gravityAccel,
  updateBlackHole,
  drawBlackHole,
  type BlackHole,
} from './entities/blackhole';
import { rand, randRange } from './rand';
import { createGame, type GameState } from './game';
import { createRenderer, type Renderer } from './render/canvas';
import { PALETTE, PLAYFIELD_W, PLAYFIELD_H, SHIP_MAX_SPEED } from './config';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('missing #game canvas');

const renderer = createRenderer({ canvas });
window.addEventListener('resize', () => renderer.resize());

const game = createGame();
const input = createInput(window);
const store = createStore();

const BLACK_HOLE_MIN_SHIP_DIST = 250;

function placeBlackHole(shipX: number, shipY: number): void {
  const minDist2 = BLACK_HOLE_MIN_SHIP_DIST * BLACK_HOLE_MIN_SHIP_DIST;
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = randRange(120, PLAYFIELD_W - 120);
    const y = randRange(120, PLAYFIELD_H - 120);
    const dx = x - shipX;
    const dy = y - shipY;
    if (dx * dx + dy * dy >= minDist2) {
      store.spawnBlackHole(x, y);
      return;
    }
  }
  store.spawnBlackHole(PLAYFIELD_W * 0.75, PLAYFIELD_H * 0.3);
}

function startRun(): void {
  store.clear();
  const ship = store.spawnShip(PLAYFIELD_W / 2, PLAYFIELD_H / 2);
  placeBlackHole(ship.x, ship.y);
  spawnInitialAsteroids(store, ship.x, ship.y);
}

function accelFor(e: CoreEntity): [number, number] {
  const kind = (e as { kind?: string }).kind;
  if (kind === 'particle') return [0, 0];
  let ax = 0;
  let ay = 0;
  if (kind === 'ship') {
    const [sx, sy] = shipAccel(e as Ship);
    ax += sx;
    ay += sy;
  }
  for (const bh of store.byKind('blackhole')) {
    const [gx, gy] = gravityAccel(e.x, e.y, bh as BlackHole);
    ax += gx;
    ay += gy;
  }
  return [ax, ay];
}

function handleStateInputs(): void {
  const s = game.state();
  if (input.justPressed('Space') && s === 'TITLE') {
    startRun();
    game.transition('PLAY');
    return;
  }
  if (input.justPressed('Escape')) {
    if (s === 'PLAY') game.transition('PAUSED');
    else if (s === 'PAUSED') game.transition('PLAY');
  }
}

function simulate(dt: number): void {
  for (const ship of store.byKind('ship')) {
    controlShip(ship, input, dt);
    if (input.justPressed('Space')) tryFireBullet(ship, store);
    if (input.justPressed('ShiftLeft') || input.justPressed('ShiftRight')) {
      tryHyperspace(ship, rand);
    }
  }
  integrate(store.all(), dt, accelFor);
  for (const s of store.byKind('ship')) clampMaxSpeed(s, SHIP_MAX_SPEED);
  for (const b of store.byKind('bullet')) updateBullet(b, dt);
  for (const a of store.byKind('asteroid')) updateAsteroid(a, dt);
  for (const bh of store.byKind('blackhole')) updateBlackHole(bh as BlackHole, dt);
  postStep(store.all(), dt);
  for (const pair of detect(store.all())) resolveCollision(pair, store, rand);
  store.compact();
}

run(
  (dt) => {
    input.captureFrame();
    handleStateInputs();
    if (game.state() === 'PLAY') simulate(dt);
  },
  (_alpha) => render()
);

function render(): void {
  renderer.beginFrame();
  const s = game.state();
  switch (s) {
    case 'TITLE':
      renderTitle(renderer);
      break;
    case 'PLAY':
    case 'PAUSED':
      renderScene(renderer);
      if (s === 'PAUSED') renderPausedOverlay(renderer);
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

function renderScene(r: Renderer): void {
  for (const bh of store.byKind('blackhole')) drawBlackHole(r, bh as BlackHole);
  for (const a of store.byKind('asteroid')) drawAsteroid(r, a as Asteroid);
  for (const b of store.byKind('bullet')) drawBullet(r, b as Bullet);
  for (const s of store.byKind('ship')) drawShip(r, s as Ship);
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
