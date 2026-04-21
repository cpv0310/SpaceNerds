# SpaceNerds

A web-only arcade roguelike in the Asteroids lineage. Totally vector graphics, old-school synth audio, Newtonian zero-g physics, pure permadeath.

You command the Starship Poindexter, defending the Gamma Sector from the Ko-Dan Armada.

## Status

Phase 3 complete — all 21 tasks landed on `main`. 2-week vertical-slice MVP developed under [The Cascade](#methodology) spec-driven methodology.

Progress log in [`sdd/v0/specs/task-breakdown.md`](sdd/v0/specs/task-breakdown.md). Each task is one commit on `main`.

## Playing

**Live: https://cpv0310.github.io/SpaceNerds/**

Controls: Arrows / WASD rotate + thrust, Space fires, Shift hyperspaces (10% death chance), Esc pauses, M mutes.

## Developing

Requires Node 20 LTS.

```bash
npm install        # install deps
npm run dev        # Vite dev server, localhost:5173
npm test           # Vitest
npm run build      # production bundle to dist/
npm run typecheck  # tsc --noEmit
```

## Architecture

The spec, design, and ADRs are the source of truth — the code is a derivative. Read in this order:

- [`sdd/v0/specs/product-spec.md`](sdd/v0/specs/product-spec.md) — functional requirements (what the game does)
- [`sdd/v0/docs/technical-design.md`](sdd/v0/docs/technical-design.md) — architecture (how it's built)
- [`sdd/v0/docs/adr/`](sdd/v0/docs/adr) — significant decisions (engine, physics integrator, gravity model, audio, entity model, build tooling, game loop)
- [`sdd/v0/docs/grill-me-decisions.md`](sdd/v0/docs/grill-me-decisions.md) — Phase 2 exit-gate amendments (supersedes earlier docs where they disagree)
- [`CLAUDE.md`](CLAUDE.md) — project instructions (hard boundaries, conventions)

## Design pillars

Non-negotiable for the MVP:

- **Pure vector graphics** — no bitmaps, no sprite sheets, no `.png`/`.jpg`/`.svg`.
- **Runtime-synthesized audio** — Web Audio API only, no audio files.
- **No CSS post-processing** — authentic 1980s vector-arcade, not modern retro-glow. No bloom, no box-shadow.
- **Client-only** — no backend, no accounts, no network after page load. High scores in `localStorage`.
- **Keyboard-only, desktop-only** for MVP.
- **Pure permadeath** — no cross-run progression.

## Tech stack

TypeScript 5 (strict), Vite 5, Vitest, raw Canvas 2D, Web Audio API. Zero runtime dependencies. All dev dependencies MIT / BSD / Apache-2.

## Methodology

The project follows [The Cascade](https://github.com/cpv0310) — small waterfalls in sprints, where the spec is the product and the code is a derivative. Phases:

- **Phase 0** Research — done
- **Phase 1** Product Spec — done
- **Phase 2** Technical Design + ADRs + Task Breakdown — done
- **Phase 3** Implement — done
- **Phase 4** Review — pending
- **Phase 5** Compound — pending (includes playtest tuning)

## Author

Chris Van Dyke ([@cpv0310](https://github.com/cpv0310)) — Skunkwerks personal OSS umbrella.
