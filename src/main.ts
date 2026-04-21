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
import {
  controlFighter,
  fighterAccel,
  tryFighterFire,
  drawFighter,
  type Fighter,
} from './entities/fighter';
import { rand, randRange } from './rand';
import {
  createGame,
  createRunState,
  processShipDeath,
  type GameState,
  type RunState,
} from './game';
import {
  createSpawnTimers,
  updateRunPhase,
  tickSpawners,
  type SpawnTimers,
} from './spawners';
import { createRenderer, type Renderer } from './render/canvas';
import { drawHud } from './render/hud';
import { createSfx } from './audio/sfx';
import { createPersist, isHighScore, type Saved } from './persist';
import { drawTitleScreen } from './screens/title';
import { drawGameOverOverlay } from './screens/gameover';
import {
  createInitialsState,
  resetInitialsState,
  tickInitialsInput,
  drawInitialsEntry,
} from './screens/initials';
import {
  PALETTE,
  PLAYFIELD_W,
  PLAYFIELD_H,
  SHIP_MAX_SPEED,
  FIGHTER_MAX_SPEED,
} from './config';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('missing #game canvas');

const renderer = createRenderer({ canvas });
window.addEventListener('resize', () => renderer.resize());

const game = createGame();
const input = createInput(window);
const store = createStore();
const sfx = createSfx();
const persist = createPersist();
let saved: Saved = persist.load();
sfx.setMuted(saved.muted);
let runState: RunState = createRunState();
let spawnTimers: SpawnTimers = createSpawnTimers();
let thrustingLastTick = false;
const initialsState = createInitialsState();

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
  runState = createRunState();
  spawnTimers = createSpawnTimers();
  const ship = store.spawnShip(PLAYFIELD_W / 2, PLAYFIELD_H / 2);
  placeBlackHole(ship.x, ship.y);
  spawnInitialAsteroids(store, ship.x, ship.y);
  thrustingLastTick = false;
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
  } else if (kind === 'fighter') {
    const [fx, fy] = fighterAccel(e as Fighter);
    ax += fx;
    ay += fy;
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
  if (input.justPressed('KeyM')) {
    const next = !sfx.isMuted();
    sfx.setMuted(next);
    saved = persist.setMuted(saved, next);
    persist.save(saved);
  }

  if (s === 'INITIALS_ENTRY') {
    const ev = tickInitialsInput(initialsState, input);
    if (ev === 'submit') {
      const initials = initialsState.letters.join('');
      saved = persist.addHighScore(saved, initials, runState.score);
      persist.save(saved);
      resetInitialsState(initialsState);
      game.transition('TITLE');
    }
    return;
  }

  if (input.justPressed('Space')) {
    if (s === 'TITLE') {
      if (!sfx.isInitialized()) {
        void sfx.init().then(() => sfx.setMuted(saved.muted));
      }
      saved = persist.incrementRunCount(saved);
      persist.save(saved);
      startRun();
      game.transition('PLAY');
      return;
    }
    if (s === 'GAME_OVER') {
      sfx.stopThrust();
      if (isHighScore(saved, runState.score)) {
        resetInitialsState(initialsState);
        game.transition('INITIALS_ENTRY');
      } else {
        game.transition('TITLE');
      }
      return;
    }
  }
  if (input.justPressed('Escape')) {
    if (s === 'PLAY') {
      sfx.stopThrust();
      game.transition('PAUSED');
    } else if (s === 'PAUSED') game.transition('PLAY');
  }
}

function simulate(dt: number): void {
  const ship = store.byKind('ship')[0];
  for (const s of store.byKind('ship')) {
    controlShip(s, input, dt);
    if (input.justPressed('Space')) {
      if (tryFireBullet(s, store)) sfx.play('shoot');
    }
    if (input.justPressed('ShiftLeft') || input.justPressed('ShiftRight')) {
      if (s.hyperspaceCooldown === 0) {
        sfx.play('hyperspace_in');
        const died = tryHyperspace(s, rand);
        if (!died) sfx.play('hyperspace_out');
      }
    }
  }
  const isThrusting = ship ? ship.alive && ship.thrusting : false;
  if (isThrusting && !thrustingLastTick) sfx.startThrust();
  else if (!isThrusting && thrustingLastTick) sfx.stopThrust();
  thrustingLastTick = isThrusting;

  if (ship) {
    for (const f of store.byKind('fighter')) {
      controlFighter(f as Fighter, ship, dt);
      if (tryFighterFire(f as Fighter, ship, store)) sfx.play('fighter_shot');
    }
  }
  integrate(store.all(), dt, accelFor);
  for (const s of store.byKind('ship')) clampMaxSpeed(s, SHIP_MAX_SPEED);
  for (const f of store.byKind('fighter')) clampMaxSpeed(f, FIGHTER_MAX_SPEED);
  for (const b of store.byKind('bullet')) updateBullet(b, dt);
  for (const a of store.byKind('asteroid')) updateAsteroid(a, dt);
  for (const bh of store.byKind('blackhole')) updateBlackHole(bh as BlackHole, dt);
  postStep(store.all(), dt);
  const sfxSink = { play: (name: string) => sfx.play(name as Parameters<typeof sfx.play>[0]) };
  for (const pair of detect(store.all())) resolveCollision(pair, store, rand, runState, sfxSink);
  for (const s of store.byKind('ship')) processShipDeath(s, game);
  runState.elapsed += dt;
  updateRunPhase(runState);
  tickSpawners(store, runState, spawnTimers, dt, rand);
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
  drawTitleScreen(r, saved, sfx.isMuted());
}

function renderScene(r: Renderer): void {
  for (const bh of store.byKind('blackhole')) drawBlackHole(r, bh as BlackHole);
  for (const a of store.byKind('asteroid')) drawAsteroid(r, a as Asteroid);
  for (const f of store.byKind('fighter')) drawFighter(r, f as Fighter);
  for (const b of store.byKind('bullet')) drawBullet(r, b as Bullet);
  for (const s of store.byKind('ship')) drawShip(r, s as Ship);
  const ship = store.byKind('ship')[0];
  drawHud(r, runState, ship ? ship.lives : 0);
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
  renderScene(r);
  drawGameOverOverlay(r, runState.score, isHighScore(saved, runState.score));
}

function renderInitialsEntry(r: Renderer): void {
  drawInitialsEntry(r, initialsState, runState.score);
}

function renderDebugBadge(r: Renderer, s: GameState): void {
  r.text(`state: ${s}`, 12, 24, PALETTE.hud, 14, 'left');
}
