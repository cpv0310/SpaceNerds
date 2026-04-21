import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialsState,
  resetInitialsState,
  tickInitialsInput,
  drawInitialsEntry,
  type InitialsState,
} from '../src/screens/initials';
import { drawTitleScreen } from '../src/screens/title';
import { drawGameOverOverlay } from '../src/screens/gameover';
import { createRenderer, type Renderer } from '../src/render/canvas';
import { createMockCanvas, type MockCanvas } from './test-harness';
import type { Input } from '../src/engine/input';
import type { Saved } from '../src/persist';

function fakeInput(...pressed: string[]): Input {
  const set = new Set(pressed);
  return {
    isDown: () => false,
    justPressed: (code) => set.has(code),
    captureFrame: () => {},
    clear: () => {},
    dispose: () => {},
  };
}

function setup(): { mc: MockCanvas; r: Renderer } {
  const mc = createMockCanvas();
  const r = createRenderer({
    canvas: mc.canvas,
    getDevicePixelRatio: () => 1,
    getViewport: () => ({ width: 1280, height: 720 }),
  });
  mc.mock.reset();
  return { mc, r };
}

describe('initials — state', () => {
  let state: InitialsState;
  beforeEach(() => {
    state = createInitialsState();
  });

  it('starts with AAA and cursor at 0', () => {
    expect(state.letters).toEqual(['A', 'A', 'A']);
    expect(state.cursor).toBe(0);
  });

  it('ArrowRight cycles letter forward A→B', () => {
    tickInitialsInput(state, fakeInput('ArrowRight'));
    expect(state.letters[0]).toBe('B');
  });

  it('ArrowLeft cycles backward A→Z', () => {
    tickInitialsInput(state, fakeInput('ArrowLeft'));
    expect(state.letters[0]).toBe('Z');
  });

  it('cycles forward Z→A', () => {
    state.letters[0] = 'Z';
    tickInitialsInput(state, fakeInput('ArrowRight'));
    expect(state.letters[0]).toBe('A');
  });

  it('SPACE advances cursor 0 → 1', () => {
    tickInitialsInput(state, fakeInput('Space'));
    expect(state.cursor).toBe(1);
  });

  it('SPACE at cursor=2 emits submit', () => {
    state.cursor = 2;
    const ev = tickInitialsInput(state, fakeInput('Space'));
    expect(ev).toBe('submit');
  });

  it('ESC commits AAA and emits submit (D12)', () => {
    state.letters = ['X', 'Y', 'Z'];
    state.cursor = 1;
    const ev = tickInitialsInput(state, fakeInput('Escape'));
    expect(ev).toBe('submit');
    expect(state.letters).toEqual(['A', 'A', 'A']);
  });

  it('cycling only affects the current cursor position', () => {
    state.cursor = 1;
    tickInitialsInput(state, fakeInput('ArrowRight'));
    expect(state.letters).toEqual(['A', 'B', 'A']);
  });

  it('resetInitialsState restores defaults', () => {
    state.letters = ['X', 'Y', 'Z'];
    state.cursor = 2;
    resetInitialsState(state);
    expect(state.letters).toEqual(['A', 'A', 'A']);
    expect(state.cursor).toBe(0);
  });

  it('KeyA / KeyD aliases cycle like arrows', () => {
    tickInitialsInput(state, fakeInput('KeyD'));
    expect(state.letters[0]).toBe('B');
    tickInitialsInput(state, fakeInput('KeyA'));
    expect(state.letters[0]).toBe('A');
  });
});

describe('initials — render', () => {
  it('renders NEW HIGH SCORE + SCORE + 3 letters', () => {
    const { mc, r } = setup();
    const state = createInitialsState();
    drawInitialsEntry(r, state, 9999);
    const texts = mc.mock.methodCalls('fillText').map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('NEW HIGH SCORE'))).toBe(true);
    expect(texts.some((t) => t.includes('9999'))).toBe(true);
    expect(texts.filter((t) => t === 'A')).toHaveLength(3);
  });
});

describe('title — render', () => {
  it('shows "---" when no scores', () => {
    const { mc, r } = setup();
    const saved: Saved = { version: 1, highScores: [], runCount: 0, muted: false };
    drawTitleScreen(r, saved, false);
    const texts = mc.mock.methodCalls('fillText').map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('---'))).toBe(true);
  });

  it('renders top 5 high scores', () => {
    const { mc, r } = setup();
    const saved: Saved = {
      version: 1,
      runCount: 0,
      muted: false,
      highScores: Array.from({ length: 7 }, (_, i) => ({
        initials: 'ABC',
        score: (7 - i) * 100,
        dateISO: '',
      })),
    };
    drawTitleScreen(r, saved, false);
    const texts = mc.mock.methodCalls('fillText').map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('700'))).toBe(true);
    expect(texts.some((t) => t.includes('300'))).toBe(true);
    expect(texts.some((t) => t.includes('200'))).toBe(false);
  });

  it('shows [MUTED] badge when muted', () => {
    const { mc, r } = setup();
    const saved: Saved = { version: 1, highScores: [], runCount: 0, muted: true };
    drawTitleScreen(r, saved, true);
    const texts = mc.mock.methodCalls('fillText').map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('MUTED'))).toBe(true);
  });
});

describe('gameover — render', () => {
  it('shows final score + play-again prompt when no new high score', () => {
    const { mc, r } = setup();
    drawGameOverOverlay(r, 500, false);
    const texts = mc.mock.methodCalls('fillText').map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('500'))).toBe(true);
    expect(texts.some((t) => t.includes('PLAY AGAIN'))).toBe(true);
    expect(texts.some((t) => t.includes('NEW HIGH SCORE'))).toBe(false);
  });

  it('shows NEW HIGH SCORE + initials prompt when high score', () => {
    const { mc, r } = setup();
    drawGameOverOverlay(r, 9999, true);
    const texts = mc.mock.methodCalls('fillText').map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('NEW HIGH SCORE'))).toBe(true);
    expect(texts.some((t) => t.includes('INITIALS'))).toBe(true);
  });
});
