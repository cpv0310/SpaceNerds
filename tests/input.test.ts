import { describe, it, expect, beforeEach } from 'vitest';
import { createInput, type Input } from '../src/engine/input';

interface FakeKeyEvent extends Event {
  code: string;
  key: string;
}

function makeKeyEvent(type: 'keydown' | 'keyup', code: string, key = code): FakeKeyEvent {
  const ev = new Event(type, { cancelable: true }) as FakeKeyEvent;
  Object.defineProperty(ev, 'code', { value: code });
  Object.defineProperty(ev, 'key', { value: key });
  return ev;
}

function kd(code: string, key = code): FakeKeyEvent {
  return makeKeyEvent('keydown', code, key);
}
function ku(code: string, key = code): FakeKeyEvent {
  return makeKeyEvent('keyup', code, key);
}

describe('input', () => {
  let target: EventTarget;
  let input: Input;

  beforeEach(() => {
    target = new EventTarget();
    input = createInput(target);
  });

  it('isDown is false before any keydown', () => {
    expect(input.isDown('ArrowLeft')).toBe(false);
  });

  it('isDown is true while key is held', () => {
    target.dispatchEvent(kd('ArrowLeft'));
    expect(input.isDown('ArrowLeft')).toBe(true);
  });

  it('isDown is false after keyup', () => {
    target.dispatchEvent(kd('ArrowLeft'));
    target.dispatchEvent(ku('ArrowLeft'));
    expect(input.isDown('ArrowLeft')).toBe(false);
  });

  it('justPressed is false before captureFrame', () => {
    target.dispatchEvent(kd('Space'));
    expect(input.justPressed('Space')).toBe(false);
  });

  it('justPressed is true on the tick after keydown', () => {
    target.dispatchEvent(kd('Space'));
    input.captureFrame();
    expect(input.justPressed('Space')).toBe(true);
  });

  it('justPressed clears after a second captureFrame with no new press', () => {
    target.dispatchEvent(kd('Space'));
    input.captureFrame();
    input.captureFrame();
    expect(input.justPressed('Space')).toBe(false);
  });

  it('OS autorepeat keydown events do not re-trigger justPressed', () => {
    target.dispatchEvent(kd('Space'));
    input.captureFrame();
    expect(input.justPressed('Space')).toBe(true);
    target.dispatchEvent(kd('Space'));
    target.dispatchEvent(kd('Space'));
    input.captureFrame();
    expect(input.justPressed('Space')).toBe(false);
  });

  it('justPressed fires again after keyup + keydown', () => {
    target.dispatchEvent(kd('Space'));
    input.captureFrame();
    target.dispatchEvent(ku('Space'));
    input.captureFrame();
    target.dispatchEvent(kd('Space'));
    input.captureFrame();
    expect(input.justPressed('Space')).toBe(true);
  });

  it('blur clears all held keys', () => {
    target.dispatchEvent(kd('ArrowLeft'));
    target.dispatchEvent(kd('ArrowRight'));
    target.dispatchEvent(new Event('blur'));
    expect(input.isDown('ArrowLeft')).toBe(false);
    expect(input.isDown('ArrowRight')).toBe(false);
  });

  it('blur clears pending justPressed', () => {
    target.dispatchEvent(kd('Space'));
    target.dispatchEvent(new Event('blur'));
    input.captureFrame();
    expect(input.justPressed('Space')).toBe(false);
  });

  it('calls preventDefault on scroll-hijacking keys', () => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'ShiftLeft', 'Escape'];
    for (const code of keys) {
      const ev = kd(code);
      target.dispatchEvent(ev);
      expect(ev.defaultPrevented, `${code} should be prevented`).toBe(true);
    }
  });

  it('does not preventDefault on arbitrary keys', () => {
    const ev = kd('KeyQ');
    target.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('dispose removes listeners', () => {
    input.dispose();
    target.dispatchEvent(kd('ArrowLeft'));
    expect(input.isDown('ArrowLeft')).toBe(false);
  });
});
