import { run } from './engine/loop';
import { createInput } from './engine/input';
import { createStore } from './engine/entities';
import { integrate, clampMaxSpeed, postStep } from './engine/physics';
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
import { rand } from './rand';
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

function startRun(): void {
  store.clear();
  const ship = store.spawnShip(PLAYFIELD_W / 2, PLAYFIELD_H / 2);
  spawnInitialAsteroids(store, ship.x, ship.y);
}

function accelFor(e: CoreEntity): [number, number] {
  const kind = (e as { kind?: string }).kind;
  if (kind === 'ship') return shipAccel(e as Ship);
  return [0, 0];
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
  postStep(store.all(), dt);
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
