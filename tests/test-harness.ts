export interface MockCall {
  method: string;
  args: readonly unknown[];
}

export interface MockCtx {
  calls: MockCall[];
  props: Record<string, unknown>;
  ctx: CanvasRenderingContext2D;
  reset(): void;
  methodCalls(name: string): MockCall[];
}

export function createMockCtx(): MockCtx {
  const calls: MockCall[] = [];
  const props: Record<string, unknown> = {};

  const target = {};
  const handler: ProxyHandler<object> = {
    get(_t, prop) {
      const name = String(prop);
      if (name in props) return props[name];
      return (...args: unknown[]) => {
        calls.push({ method: name, args });
      };
    },
    set(_t, prop, value) {
      const name = String(prop);
      props[name] = value;
      calls.push({ method: `set:${name}`, args: [value] });
      return true;
    },
  };

  const ctx = new Proxy(target, handler) as unknown as CanvasRenderingContext2D;

  return {
    calls,
    props,
    ctx,
    reset() {
      calls.length = 0;
      for (const k of Object.keys(props)) delete props[k];
    },
    methodCalls(name: string) {
      return calls.filter((c) => c.method === name);
    },
  };
}

export interface MockAudioEvent {
  method: string;
  args: readonly unknown[];
}

export interface MockOscillator {
  type: string;
  frequency: { value: number };
  events: MockAudioEvent[];
  started: boolean;
  stopped: boolean;
}

export interface MockGain {
  gain: { value: number };
  events: MockAudioEvent[];
}

export interface MockAudioContext {
  currentTime: number;
  state: 'running' | 'suspended';
  destination: object;
  oscillators: MockOscillator[];
  gains: MockGain[];
  closed: boolean;
  createOscillator(): MockOscillator;
  createGain(): MockGain;
  resume(): Promise<void>;
  close(): Promise<void>;
}

export function createMockAudioContext(): MockAudioContext {
  const oscillators: MockOscillator[] = [];
  const gains: MockGain[] = [];
  const ctx: MockAudioContext = {
    currentTime: 0,
    state: 'running',
    destination: {},
    oscillators,
    gains,
    closed: false,
    createOscillator() {
      const events: MockAudioEvent[] = [];
      const osc: MockOscillator = {
        type: 'sine',
        frequency: {
          value: 440,
          setValueAtTime(v: number, t: number) {
            events.push({ method: 'freq.setValueAtTime', args: [v, t] });
          },
          exponentialRampToValueAtTime(v: number, t: number) {
            events.push({
              method: 'freq.exponentialRampToValueAtTime',
              args: [v, t],
            });
          },
          cancelScheduledValues(t: number) {
            events.push({ method: 'freq.cancelScheduledValues', args: [t] });
          },
        } as MockOscillator['frequency'] & Record<string, unknown>,
        events,
        started: false,
        stopped: false,
        connect(target: object) {
          events.push({ method: 'connect', args: [target] });
          return target;
        },
        start(t?: number) {
          events.push({ method: 'start', args: t === undefined ? [] : [t] });
          osc.started = true;
        },
        stop(t?: number) {
          events.push({ method: 'stop', args: t === undefined ? [] : [t] });
          osc.stopped = true;
        },
      } as unknown as MockOscillator & Record<string, unknown>;
      oscillators.push(osc);
      return osc;
    },
    createGain() {
      const events: MockAudioEvent[] = [];
      const g: MockGain = {
        gain: {
          value: 1,
          setValueAtTime(v: number, t: number) {
            events.push({ method: 'gain.setValueAtTime', args: [v, t] });
            g.gain.value = v;
          },
          linearRampToValueAtTime(v: number, t: number) {
            events.push({
              method: 'gain.linearRampToValueAtTime',
              args: [v, t],
            });
          },
          exponentialRampToValueAtTime(v: number, t: number) {
            events.push({
              method: 'gain.exponentialRampToValueAtTime',
              args: [v, t],
            });
          },
          cancelScheduledValues(t: number) {
            events.push({ method: 'gain.cancelScheduledValues', args: [t] });
          },
        } as MockGain['gain'] & Record<string, unknown>,
        events,
        connect(target: object) {
          events.push({ method: 'connect', args: [target] });
          return target;
        },
      } as unknown as MockGain & Record<string, unknown>;
      gains.push(g);
      return g;
    },
    async resume() {
      ctx.state = 'running';
    },
    async close() {
      ctx.closed = true;
    },
  };
  return ctx;
}

export interface MockCanvas {
  canvas: HTMLCanvasElement;
  mock: MockCtx;
}

export function createMockCanvas(cssW = 1280, cssH = 720): MockCanvas {
  const mock = createMockCtx();
  const style: Record<string, string> = {};
  const canvasObj = {
    width: cssW,
    height: cssH,
    style: new Proxy(style, {
      set(t, p, v) {
        t[String(p)] = String(v);
        return true;
      },
      get(t, p) {
        return t[String(p)];
      },
    }),
    getContext: (kind: string) =>
      kind === '2d' ? mock.ctx : null,
  } as unknown as HTMLCanvasElement;
  return { canvas: canvasObj, mock };
}
