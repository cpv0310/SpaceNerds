import { describe, it, expect } from 'vitest';
import {
  createShip,
  controlShip,
  shipAccel,
  type Ship,
} from '../src/entities/ship';
import { integrate, clampMaxSpeed, wrapPlayfield } from '../src/engine/physics';
import type { Input } from '../src/engine/input';
import {
  SHIP_ROTATION_SPEED,
  SHIP_THRUST_ACCEL,
  SHIP_MAX_SPEED,
  PLAYFIELD_W,
  PLAYFIELD_H,
} from '../src/config';

function fakeInput(...held: string[]): Input {
  const set = new Set(held);
  return {
    isDown: (code) => set.has(code),
    justPressed: () => false,
    captureFrame: () => {},
    clear: () => set.clear(),
    dispose: () => {},
  };
}

function stepTicks(ship: Ship, input: Input, dt: number, ticks: number): void {
  for (let i = 0; i < ticks; i++) {
    controlShip(ship, input, dt);
    integrate([ship], dt, (e) => shipAccel(e as Ship));
    clampMaxSpeed(ship, SHIP_MAX_SPEED);
    wrapPlayfield(ship);
  }
}

describe('ship controller', () => {
  describe('rotation', () => {
    it('ArrowRight rotates clockwise at SHIP_ROTATION_SPEED', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('ArrowRight');
      stepTicks(ship, input, 1 / 60, 60);
      expect(ship.rot).toBeCloseTo(SHIP_ROTATION_SPEED * 1, 6);
    });

    it('ArrowLeft rotates counter-clockwise', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('ArrowLeft');
      stepTicks(ship, input, 1 / 60, 60);
      expect(ship.rot).toBeCloseTo(-SHIP_ROTATION_SPEED, 6);
    });

    it('KeyD rotates clockwise (WASD alt)', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('KeyD');
      controlShip(ship, input, 1 / 60);
      expect(ship.rot).toBeGreaterThan(0);
    });

    it('KeyA rotates counter-clockwise (WASD alt)', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('KeyA');
      controlShip(ship, input, 1 / 60);
      expect(ship.rot).toBeLessThan(0);
    });

    it('opposing keys cancel (D8)', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('ArrowLeft', 'ArrowRight');
      controlShip(ship, input, 1 / 60);
      expect(ship.rot).toBe(0);
    });
  });

  describe('thrust', () => {
    it('thrusting latch set while ArrowUp held', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('ArrowUp');
      controlShip(ship, input, 1 / 60);
      expect(ship.thrusting).toBe(true);
    });

    it('KeyW also sets thrust', () => {
      const ship = createShip(100, 100);
      const input = fakeInput('KeyW');
      controlShip(ship, input, 1 / 60);
      expect(ship.thrusting).toBe(true);
    });

    it('no thrust → no velocity change, no acceleration', () => {
      const ship = createShip(100, 100);
      const input = fakeInput();
      stepTicks(ship, input, 1 / 60, 60);
      expect(ship.vx).toBe(0);
      expect(ship.vy).toBe(0);
    });

    it('thrust at rot=0 accelerates +x', () => {
      const ship = createShip(100, 100);
      ship.rot = 0;
      const input = fakeInput('ArrowUp');
      stepTicks(ship, input, 1 / 60, 30);
      expect(ship.vx).toBeGreaterThan(0);
      expect(Math.abs(ship.vy)).toBeLessThan(1e-9);
    });

    it('thrust at rot=PI/2 accelerates +y', () => {
      const ship = createShip(100, 100);
      ship.rot = Math.PI / 2;
      const input = fakeInput('ArrowUp');
      stepTicks(ship, input, 1 / 60, 30);
      expect(ship.vy).toBeGreaterThan(0);
      expect(Math.abs(ship.vx)).toBeLessThan(1e-6);
    });

    it('shipAccel returns thrust magnitude along rot when thrusting', () => {
      const ship = createShip(0, 0);
      ship.rot = 0;
      ship.thrusting = true;
      const [ax, ay] = shipAccel(ship);
      expect(ax).toBeCloseTo(SHIP_THRUST_ACCEL, 6);
      expect(ay).toBeCloseTo(0, 6);
    });

    it('shipAccel returns zero when not thrusting', () => {
      const ship = createShip(0, 0);
      ship.thrusting = false;
      expect(shipAccel(ship)).toEqual([0, 0]);
    });

    it('has momentum after thrust ends', () => {
      const ship = createShip(100, 100);
      ship.rot = 0;
      stepTicks(ship, fakeInput('ArrowUp'), 1 / 60, 30);
      const vxBefore = ship.vx;
      stepTicks(ship, fakeInput(), 1 / 60, 30);
      expect(ship.vx).toBeCloseTo(vxBefore, 2);
    });
  });

  describe('max speed', () => {
    it('never exceeds SHIP_MAX_SPEED under sustained thrust', () => {
      const ship = createShip(100, 100);
      ship.rot = 0;
      stepTicks(ship, fakeInput('ArrowUp'), 1 / 60, 600);
      const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      expect(speed).toBeLessThanOrEqual(SHIP_MAX_SPEED + 1e-6);
    });

    it('approaches SHIP_MAX_SPEED asymptotically', () => {
      const ship = createShip(100, 100);
      ship.rot = 0;
      stepTicks(ship, fakeInput('ArrowUp'), 1 / 60, 600);
      const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      expect(speed).toBeGreaterThan(SHIP_MAX_SPEED - 1);
    });
  });

  describe('wrap', () => {
    it('wraps past right edge', () => {
      const ship = createShip(PLAYFIELD_W - 5, 100);
      ship.vx = 300;
      stepTicks(ship, fakeInput(), 1 / 60, 5);
      expect(ship.x).toBeLessThan(PLAYFIELD_W);
    });

    it('wraps past left edge', () => {
      const ship = createShip(5, 100);
      ship.vx = -300;
      stepTicks(ship, fakeInput(), 1 / 60, 5);
      expect(ship.x).toBeGreaterThan(PLAYFIELD_W / 2);
    });

    it('wraps past bottom edge', () => {
      const ship = createShip(100, PLAYFIELD_H - 5);
      ship.vy = 300;
      stepTicks(ship, fakeInput(), 1 / 60, 5);
      expect(ship.y).toBeLessThan(PLAYFIELD_H);
    });
  });

  describe('lifecycle', () => {
    it('dead ship ignores input', () => {
      const ship = createShip(100, 100);
      ship.alive = false;
      controlShip(ship, fakeInput('ArrowRight', 'ArrowUp'), 1);
      expect(ship.rot).toBe(0);
      expect(ship.thrusting).toBe(false);
    });
  });
});
