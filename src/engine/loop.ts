export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;
const CLAMP_MS = 250;

export type TickFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export interface Stepper {
  step(now: number, onTick: TickFn, onRender: RenderFn): void;
  reset(now: number): void;
}

export function createStepper(startT: number): Stepper {
  let lastT = startT;
  let acc = 0;

  return {
    step(now, onTick, onRender) {
      let dt = now - lastT;
      lastT = now;
      if (dt > CLAMP_MS) dt = CLAMP_MS;
      if (dt < 0) dt = 0;
      acc += dt;

      while (acc >= TICK_MS) {
        onTick(TICK_MS / 1000);
        acc -= TICK_MS;
      }

      onRender(acc / TICK_MS);
    },
    reset(now) {
      lastT = now;
      acc = 0;
    },
  };
}

export function run(onTick: TickFn, onRender: RenderFn): () => void {
  const stepper = createStepper(performance.now());
  let rafId = 0;
  let stopped = false;

  const frame = (now: number): void => {
    if (stopped) return;
    stepper.step(now, onTick, onRender);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}
