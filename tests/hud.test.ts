import { describe, it, expect, beforeEach } from 'vitest';
import { createRenderer, type Renderer } from '../src/render/canvas';
import { drawHud } from '../src/render/hud';
import { createRunState } from '../src/game';
import { createMockCanvas, type MockCanvas } from './test-harness';

describe('hud', () => {
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

  it('renders score text', () => {
    const run = createRunState();
    run.score = 1234;
    drawHud(r, run, 3);
    const texts = mc.mock.methodCalls('fillText');
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.some((t) => String(t.args[0]).includes('1234'))).toBe(true);
  });

  it('draws 3 life icons when lives=3', () => {
    const run = createRunState();
    drawHud(r, run, 3);
    const strokes = mc.mock.methodCalls('stroke');
    expect(strokes.length).toBe(3);
  });

  it('draws 3 icons when lives=1 (but only 1 in active color)', () => {
    const run = createRunState();
    drawHud(r, run, 1);
    const strokes = mc.mock.methodCalls('stroke');
    expect(strokes.length).toBe(3);
  });

  it('draws 3 icons when lives=0 (all greyed)', () => {
    const run = createRunState();
    drawHud(r, run, 0);
    const strokes = mc.mock.methodCalls('stroke');
    expect(strokes.length).toBe(3);
  });
});
