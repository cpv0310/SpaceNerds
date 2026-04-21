---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-006 for SpaceNerds: lock the build tooling — bundler, language, test runner."
---

# ADR-006: Build Tooling — Vite + TypeScript + Vitest

## Context

We need: TypeScript compilation, dev server with hot reload, production bundle, test runner, ≤500 KB total gzipped output.

Options:

- **Vite + TypeScript + Vitest** — Vite bundles via esbuild/Rollup, native TS support, HMR, tiny config. Vitest shares Vite's config — one pipeline.
- **Parcel** — zero-config, decent DX; larger toolchain, slower incremental builds.
- **esbuild directly** — fastest, requires custom dev server + test runner glue.
- **Rollup with plugins** — flexible, more config.
- **Plain `tsc` + `http-server`** — minimal but no HMR, no test integration.
- **Webpack 5** — swiss-army-knife, slowest DX.

## Decision

**Vite 5 + TypeScript 5 + Vitest.**

Single `package.json`, single `vite.config.ts`, single `tsconfig.json`. Dev via `npm run dev`, prod build via `npm run build`, tests via `npm test`.

## Consequences

**Easier:**
- Zero-config for TS. Vite "just works."
- HMR during development — edit a tuning constant in `config.ts`, see the change in <100 ms without losing game state.
- Vitest shares Vite's transform pipeline so test suite doesn't need separate TS config.
- Production bundle is already minified and tree-shaken. No extra tooling.
- GitHub Actions CI is ~15 lines: checkout, install, test, build.

**Harder:**
- Vite requires a modern Node (18+) — not a problem for our dev environment.
- If we later want SSR / framework integration, Vite has opinions. Not relevant here.

**Trade-offs accepted:**
- Small amount of tooling coupling (Vite-specific config syntax). Migration out is always possible.
- We don't pursue "no bundler at all" (raw ES modules served directly) because the size benefit is negligible and we lose HMR, tree-shaking, and the test pipeline.

## Project skeleton

```
SpaceNerds-code/           # separate from vault
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts
│   ├── config.ts
│   ├── game.ts
│   ├── engine/
│   │   ├── loop.ts
│   │   ├── entities.ts
│   │   ├── physics.ts
│   │   ├── collision.ts
│   │   └── input.ts
│   ├── render/
│   │   └── canvas.ts
│   ├── audio/
│   │   ├── sfx.ts
│   │   └── presets.ts
│   ├── entities/
│   │   ├── ship.ts
│   │   ├── asteroid.ts
│   │   ├── bullet.ts
│   │   ├── fighter.ts
│   │   ├── blackhole.ts
│   │   └── particle.ts
│   └── persist.ts
├── tests/
│   ├── physics.test.ts
│   ├── collision.test.ts
│   ├── asteroid.test.ts
│   ├── scoring.test.ts
│   ├── persist.test.ts
│   └── run-lifecycle.test.ts
└── dist/                 # build output; gitignored
```

Single `tsconfig.json` with strict mode on:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

## Alternatives rejected

| Option | Reason rejected |
|---|---|
| Parcel | Slower incrementals than Vite; larger toolchain install. |
| esbuild standalone | No dev server, no test runner; we'd re-build too much wheel. |
| Webpack 5 | Configuration complexity is way disproportionate to need. |
| Plain tsc + http-server | No HMR; debug loop is 3-5x slower. |
| Rollup standalone | More config than Vite; Vite is Rollup-with-a-good-default-config under the hood. |

## References

- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)
- [TypeScript tsconfig strict mode](https://www.typescriptlang.org/tsconfig#strict)
