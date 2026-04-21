import { describe, it, expect, beforeEach } from 'vitest';
import { createRenderer, type Renderer } from '../src/render/canvas';
import { PALETTE } from '../src/config';
import { createMockCanvas, type MockCanvas } from './test-harness';

describe('render/canvas', () => {
  let mc: MockCanvas;
  let r: Renderer;

  beforeEach(() => {
    mc = createMockCanvas();
    r = createRenderer({
      canvas: mc.canvas,
      getDevicePixelRatio: () => 1,
      getViewport: () => ({ width: 1280, height: 720 }),
    });
    mc.mock.reset();
  });

  describe('beginFrame', () => {
    it('fills the playfield with bg color', () => {
      r.beginFrame();
      const fills = mc.mock.methodCalls('fillRect');
      expect(fills).toHaveLength(1);
      const setFillStyle = mc.mock.calls.find(
        (c) => c.method === 'set:fillStyle'
      );
      expect(setFillStyle?.args[0]).toBe(PALETTE.bg);
    });
  });

  describe('strokePath', () => {
    it('sets strokeStyle then draws the path', () => {
      r.strokePath(
        [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
        PALETTE.ship
      );
      const setStroke = mc.mock.calls.find(
        (c) => c.method === 'set:strokeStyle'
      );
      expect(setStroke?.args[0]).toBe(PALETTE.ship);
      expect(mc.mock.methodCalls('beginPath')).toHaveLength(1);
      expect(mc.mock.methodCalls('moveTo')).toHaveLength(1);
      expect(mc.mock.methodCalls('lineTo')).toHaveLength(1);
      expect(mc.mock.methodCalls('stroke')).toHaveLength(1);
    });

    it('moveTo uses first vertex, lineTo uses subsequent', () => {
      r.strokePath(
        [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
          { x: 50, y: 60 },
        ],
        PALETTE.asteroid
      );
      const mt = mc.mock.methodCalls('moveTo');
      const lt = mc.mock.methodCalls('lineTo');
      expect(mt[0].args).toEqual([10, 20]);
      expect(lt).toHaveLength(2);
      expect(lt[0].args).toEqual([30, 40]);
      expect(lt[1].args).toEqual([50, 60]);
    });

    it('is a no-op for empty / single-point paths', () => {
      r.strokePath([], PALETTE.ship);
      r.strokePath([{ x: 10, y: 10 }], PALETTE.ship);
      expect(mc.mock.methodCalls('stroke')).toHaveLength(0);
    });

    it('closePath option produces a closePath call', () => {
      r.strokePath(
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
        PALETTE.ship,
        { closed: true }
      );
      expect(mc.mock.methodCalls('closePath')).toHaveLength(1);
    });
  });

  describe('strokeCircle', () => {
    it('arcs a full circle and strokes', () => {
      r.strokeCircle(50, 60, 20, PALETTE.asteroid);
      const arcs = mc.mock.methodCalls('arc');
      expect(arcs).toHaveLength(1);
      expect(arcs[0].args[0]).toBe(50);
      expect(arcs[0].args[1]).toBe(60);
      expect(arcs[0].args[2]).toBe(20);
      expect(mc.mock.methodCalls('stroke')).toHaveLength(1);
    });
  });

  describe('strokeDashedCircle', () => {
    it('sets lineDash before stroke and clears it after', () => {
      r.strokeDashedCircle(100, 100, 50, PALETTE.ring, [8, 6]);
      const dashCalls = mc.mock.methodCalls('setLineDash');
      expect(dashCalls).toHaveLength(2);
      expect(dashCalls[0].args[0]).toEqual([8, 6]);
      expect(dashCalls[1].args[0]).toEqual([]);
      expect(mc.mock.methodCalls('stroke')).toHaveLength(1);
    });
  });

  describe('text', () => {
    it('sets fillStyle and font, then fillText', () => {
      r.text('HELLO', 100, 200, PALETTE.hud, 24);
      const fs = mc.mock.calls.find((c) => c.method === 'set:fillStyle');
      const font = mc.mock.calls.find((c) => c.method === 'set:font');
      expect(fs?.args[0]).toBe(PALETTE.hud);
      expect(font?.args[0]).toContain('24');
      const ft = mc.mock.methodCalls('fillText');
      expect(ft).toHaveLength(1);
      expect(ft[0].args[0]).toBe('HELLO');
      expect(ft[0].args[1]).toBe(100);
      expect(ft[0].args[2]).toBe(200);
    });

    it('honors align parameter', () => {
      r.text('L', 0, 0, PALETTE.hud, 10, 'left');
      const align = mc.mock.calls.find((c) => c.method === 'set:textAlign');
      expect(align?.args[0]).toBe('left');
    });
  });

  describe('resize', () => {
    it('preserves 16:9 aspect in landscape viewport', () => {
      const wide = createMockCanvas();
      const rr = createRenderer({
        canvas: wide.canvas,
        getDevicePixelRatio: () => 1,
        getViewport: () => ({ width: 2000, height: 1000 }),
      });
      rr.resize();
      const cssW = Number.parseFloat(wide.canvas.style.width);
      const cssH = Number.parseFloat(wide.canvas.style.height);
      expect(cssW / cssH).toBeCloseTo(16 / 9, 3);
      expect(cssH).toBeCloseTo(1000, 3);
    });

    it('applies devicePixelRatio to backing store', () => {
      const mc2 = createMockCanvas();
      const rr = createRenderer({
        canvas: mc2.canvas,
        getDevicePixelRatio: () => 2,
        getViewport: () => ({ width: 1280, height: 720 }),
      });
      rr.resize();
      expect(mc2.canvas.width).toBe(1280 * 2);
      expect(mc2.canvas.height).toBe(720 * 2);
    });

    it('sets line width 1.5 and round caps/joins on resize', () => {
      r.resize();
      const lw = mc.mock.calls.find((c) => c.method === 'set:lineWidth');
      const cap = mc.mock.calls.find((c) => c.method === 'set:lineCap');
      const join = mc.mock.calls.find((c) => c.method === 'set:lineJoin');
      expect(lw?.args[0]).toBe(1.5);
      expect(cap?.args[0]).toBe('round');
      expect(join?.args[0]).toBe('round');
    });
  });
});
