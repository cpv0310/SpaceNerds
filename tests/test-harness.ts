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
