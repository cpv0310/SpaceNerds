const PREVENTED: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'ShiftLeft',
  'ShiftRight',
  'Escape',
]);

export interface Input {
  isDown(code: string): boolean;
  justPressed(code: string): boolean;
  captureFrame(): void;
  clear(): void;
  dispose(): void;
}

export function createInput(target: EventTarget = window): Input {
  const held = new Set<string>();
  const pending = new Set<string>();
  let framePressed = new Set<string>();

  const onDown = (e: Event): void => {
    const ev = e as KeyboardEvent;
    if (PREVENTED.has(ev.code)) ev.preventDefault();
    if (!held.has(ev.code)) pending.add(ev.code);
    held.add(ev.code);
  };

  const onUp = (e: Event): void => {
    const ev = e as KeyboardEvent;
    held.delete(ev.code);
  };

  const onBlur = (): void => {
    held.clear();
    pending.clear();
    framePressed = new Set();
  };

  target.addEventListener('keydown', onDown);
  target.addEventListener('keyup', onUp);
  target.addEventListener('blur', onBlur);

  return {
    isDown: (code) => held.has(code),
    justPressed: (code) => framePressed.has(code),
    captureFrame() {
      framePressed = new Set(pending);
      pending.clear();
    },
    clear() {
      held.clear();
      pending.clear();
      framePressed = new Set();
    },
    dispose() {
      target.removeEventListener('keydown', onDown);
      target.removeEventListener('keyup', onUp);
      target.removeEventListener('blur', onBlur);
      held.clear();
      pending.clear();
      framePressed = new Set();
    },
  };
}
