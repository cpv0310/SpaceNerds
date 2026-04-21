import { describe, it, expect } from 'vitest';
import { createShip, respawnShip } from '../src/entities/ship';
import { createGame, processShipDeath } from '../src/game';
import {
  SHIP_STARTING_LIVES,
  RESPAWN_INVULN,
  PLAYFIELD_W,
  PLAYFIELD_H,
} from '../src/config';

describe('lives — createShip', () => {
  it('starts with SHIP_STARTING_LIVES lives', () => {
    const ship = createShip(0, 0);
    expect(ship.lives).toBe(SHIP_STARTING_LIVES);
  });
});

describe('lives — respawnShip', () => {
  it('moves ship to playfield center', () => {
    const ship = createShip(100, 100);
    ship.vx = 300;
    ship.vy = 200;
    ship.alive = false;
    respawnShip(ship);
    expect(ship.x).toBe(PLAYFIELD_W / 2);
    expect(ship.y).toBe(PLAYFIELD_H / 2);
  });

  it('zeroes velocity and accel', () => {
    const ship = createShip(100, 100);
    ship.vx = 300;
    ship.vy = 200;
    ship.ax = 50;
    ship.ay = 50;
    respawnShip(ship);
    expect(ship.vx).toBe(0);
    expect(ship.vy).toBe(0);
    expect(ship.ax).toBe(0);
    expect(ship.ay).toBe(0);
  });

  it('re-enables life and sets invulnerability window', () => {
    const ship = createShip(0, 0);
    ship.alive = false;
    ship.invulnUntil = 0;
    respawnShip(ship);
    expect(ship.alive).toBe(true);
    expect(ship.invulnUntil).toBe(RESPAWN_INVULN);
  });

  it('clears cooldowns', () => {
    const ship = createShip(0, 0);
    ship.fireCooldown = 0.5;
    ship.hyperspaceCooldown = 2.0;
    ship.thrusting = true;
    respawnShip(ship);
    expect(ship.fireCooldown).toBe(0);
    expect(ship.hyperspaceCooldown).toBe(0);
    expect(ship.thrusting).toBe(false);
  });
});

describe('lives — processShipDeath', () => {
  function playingGame() {
    const g = createGame();
    g.transition('PLAY');
    return g;
  }

  it('no-op if ship still alive', () => {
    const game = playingGame();
    const ship = createShip(0, 0);
    processShipDeath(ship, game);
    expect(ship.lives).toBe(SHIP_STARTING_LIVES);
    expect(game.state()).toBe('PLAY');
  });

  it('decrements lives and respawns when lives remain', () => {
    const game = playingGame();
    const ship = createShip(100, 100);
    ship.alive = false;
    processShipDeath(ship, game);
    expect(ship.lives).toBe(SHIP_STARTING_LIVES - 1);
    expect(ship.alive).toBe(true);
    expect(ship.x).toBe(PLAYFIELD_W / 2);
    expect(game.state()).toBe('PLAY');
  });

  it('transitions to GAME_OVER on third death', () => {
    const game = playingGame();
    const ship = createShip(0, 0);

    ship.alive = false;
    processShipDeath(ship, game);
    expect(ship.lives).toBe(2);
    expect(game.state()).toBe('PLAY');

    ship.alive = false;
    processShipDeath(ship, game);
    expect(ship.lives).toBe(1);
    expect(game.state()).toBe('PLAY');

    ship.alive = false;
    processShipDeath(ship, game);
    expect(ship.lives).toBe(0);
    expect(game.state()).toBe('GAME_OVER');
  });

  it('dead ship in GAME_OVER stays dead', () => {
    const game = playingGame();
    const ship = createShip(0, 0);
    ship.lives = 1;
    ship.alive = false;
    processShipDeath(ship, game);
    expect(game.state()).toBe('GAME_OVER');
    expect(ship.alive).toBe(false);
  });
});
