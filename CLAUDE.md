# CLAUDE.md — SpaceNerds

This file is Claude Code's project instructions for the SpaceNerds codebase. Read this first on every session start.

## Project Identity

**SpaceNerds** is a web-only arcade roguelike in the Asteroids lineage. The player commands the Starship Poindexter, defending the Gamma Sector from the Ko-Dan Armada. Totally vector graphics, old-school synth audio, Newtonian zero-g physics, pure permadeath.

This is a 2-week vertical-slice MVP being built under **The Cascade** spec-driven development methodology. The spec, design, and ADRs are the source of truth; the code is a derivative.

## Repository Layout

*Target layout. Not every file below exists yet — the tree fills in over Tasks 1-21. Check the filesystem before reading or editing a path.*

```
SpaceNerds/
├── CLAUDE.md                          ← this file
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── scripts/
│   └── check-aesthetic.mjs            aesthetic pillar build-time lint
├── src/
│   ├── main.ts
│   ├── config.ts                      all tunable constants — ONLY place for magic numbers
│   ├── rand.ts                        seedable PRNG (mulberry32)
│   ├── game.ts                        state machine + orchestration
│   ├── engine/
│   │   ├── loop.ts                    fixed-timestep 60Hz loop
│   │   ├── entities.ts                per-kind entity pools
│   │   ├── physics.ts                 Velocity Verlet, gravity, wrap
│   │   ├── collision.ts               pure detection (no side effects)
│   │   └── input.ts
│   ├── render/
│   │   ├── canvas.ts                  DPR-aware resize, batched line draws
│   │   └── hud.ts
│   ├── audio/
│   │   ├── sfx.ts                     jsfxr integration + raw thrust oscillator
│   │   └── presets.ts
│   ├── entities/
│   │   ├── ship.ts
│   │   ├── asteroid.ts
│   │   ├── bullet.ts
│   │   ├── fighter.ts
│   │   ├── blackhole.ts
│   │   └── particle.ts
│   ├── screens/
│   │   ├── title.ts
│   │   ├── gameover.ts
│   │   └── initials.ts
│   └── persist.ts
├── tests/
│   ├── test-harness.ts                mocked Canvas ctx, rand seeding
│   ├── physics.test.ts
│   ├── collision.test.ts
│   ├── ...
├── sdd/
│   └── v0/                            Spec-driven-development artifacts, v0 slice
│       ├── specs/
│       │   ├── product-spec.md
│       │   └── task-breakdown.md      THE runbook — start every session here
│       ├── docs/
│       │   ├── technical-design.md
│       │   ├── grill-me-decisions.md  amendments to TD/ADRs, authoritative
│       │   └── adr/
│       │       ├── ADR-001-engine-choice.md
│       │       ├── ADR-002-physics-integrator.md
│       │       ├── ADR-003-gravity-model.md
│       │       ├── ADR-004-audio-library.md
│       │       ├── ADR-005-entity-model.md
│       │       ├── ADR-006-build-tooling.md
│       │       └── ADR-007-game-loop-timing.md
│       └── research/
│           └── research-brief.md      competitive + technical prior art
└── dist/                              build output (gitignored)
```

## Source-of-Truth Hierarchy

When the docs disagree, later wins:

1. **`sdd/v0/docs/grill-me-decisions.md`** — Phase 2 exit-gate amendments. Takes precedence over anything else.
2. **`CLAUDE.md`** — this file. Hard rules for every session.
3. **`sdd/v0/docs/technical-design.md`** + ADRs — architecture and decisions.
4. **`sdd/v0/specs/product-spec.md`** — functional requirements (what to build).
5. **`sdd/v0/specs/task-breakdown.md`** — sequenced implementation tasks.
6. **`sdd/v0/research/research-brief.md`** — prior art, informational.

## Hard Boundaries (DO NOT CROSS)

These are architectural pillars, not preferences. The build lint (`npm run check:aesthetic`) enforces most of them mechanically.

1. **No bitmap/raster image assets.** All visuals are procedurally-drawn vector line art. No `.png`, `.jpg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`.
2. **No audio files.** All audio is runtime-synthesized via Web Audio API (jsfxr + raw oscillators). No `.mp3`, `.ogg`, `.wav`, `.m4a`, `.flac`, `.aac`.
3. **No CSS post-processing.** No `filter: blur/brightness/drop-shadow`, no `box-shadow`, no `backdrop-filter`. The aesthetic is authentic 1980s vector-arcade, not modern retro-glow.
4. **No backend, no server, no accounts, no network calls after page load.** Pure client-side.
5. **No mobile, no touch input** for MVP. Desktop browsers only.
6. **Pure permadeath between runs.** No cross-run progression, no meta-currency, no persistent upgrades beyond the high-score table.
7. **Keyboard-only input** for MVP.
8. **Zero-gravity Newtonian physics for the ship.** No auto-braking, no "fly like a plane."
9. **Single-screen playfield** for MVP. The 5×5 sector is a v2+ feature; do not scaffold it.

### The Cut-Before-Cross Rule

> **If a feature requires crossing any boundary above to ship, cut the feature. Do not cross the boundary. No exceptions.**

When a task in the Task Breakdown feels like it needs a bitmap, an MP3, or a bloom filter, STOP. The feature is either wrong or its implementation is wrong. Re-read the Research Brief's competitive section — the entire point of the aesthetic is that it's different from "modern retro" games.

### Must Ask Before Changing

- Engine / framework swap (LittleJS vs Canvas 2D — ratified after Task 1 spike)
- Addition of any new external dependency
- Any divergence from a Phase 1 Functional Requirement
- Any change to the palette, typography, or overall visual register
- Any analytics, telemetry, tracking, or third-party script

## Development Workflow (Phase 3)

Every implementation session follows this pattern:

1. **Clear context** (`/clear`) — no cross-task pollution.
2. **Read the task.** Open `sdd/v0/specs/task-breakdown.md`, find the lowest-numbered `pending` task whose dependencies are `done`.
3. **Load supporting context.** Read the task block, plus relevant sections of:
   - `sdd/v0/specs/product-spec.md` (FRs this task satisfies)
   - `sdd/v0/docs/technical-design.md` (architecture, tick order, interfaces)
   - `sdd/v0/docs/grill-me-decisions.md` (amendments)
   - Relevant ADR(s)
4. **Set Status.** Update the task's Status field to `in-progress` in `task-breakdown.md`.
5. **TDD RED.** Write tests from the Acceptance Criteria. Run them. Confirm they fail.
6. **TDD GREEN.** Implement the minimum code to pass the tests.
7. **TDD IMPROVE.** Refactor if needed.
8. **Verify.** Run the task's Verification command (usually `npm test` + a manual check).
9. **Update task.** Set Status to `done`. Fill the Notes field with anything surprising, any deviation from spec, any tuning value that ended up different from the starter.
10. **Commit.** One commit per completed task. See the Commit Convention below.
11. **End session.** Close the terminal, come back tomorrow fresh.

### The 1.5× Overrun Rule

If a task reaches **1.5 evening sessions** without meeting acceptance criteria, STOP. Do not push. Replan:

1. Cut the task's scope to the minimum needed by its dependents.
2. Cut a later optional task (onboarding label polish, thrust-trail polish, title drone).
3. Defer the entire task to v2+ (only if not a dependency of MVP-critical tasks; Task 16 Onboarding is the only true candidate).
4. **NEVER push the 14-day ship date.**

When the rule fires, append `OVERRAN: <why> → <replan decision>` to the task's Notes field and surface it in Phase 5 Compound.

## Tech Stack

- **Language:** TypeScript 5.x, strict mode. Node 20 LTS.
- **Bundler:** Vite 5.
- **Test runner:** Vitest (shares Vite's transform).
- **Engine:** LittleJS (primary) or raw Canvas 2D + zero deps (fallback, ratified after Task 1).
- **Rendering:** Canvas 2D, batched-path (one `beginPath`/`stroke` per color).
- **Physics integrator:** Velocity Verlet (symplectic — plain Euler diverges).
- **Gravity model:** capped-radius inverse-square, `F = G/max(r², r_min²)`, clamp to zero beyond `r_max_influence`.
- **Audio SFX:** jsfxr presets (one-shots) + raw `OscillatorNode+GainNode` (thrust, continuous).
- **Persistence:** `localStorage` under key `spacenerds.v1`. No backend.
- **Hosting:** GitHub Pages (`cpv0310.github.io/SpaceNerds`) + itch.io mirror.

All dependencies MIT / BSD / Apache-2. No GPL.

## Commands

*These become available after Task 1 scaffolds `package.json`. Until then there is no build/test loop — the work is spec and docs only.*

```bash
npm install             # install deps
npm run dev             # dev server with HMR, localhost:5173
npm run test            # run Vitest
npm run test:watch      # Vitest in watch mode
npm run check:aesthetic # aesthetic pillar lint
npm run build           # production build (runs check:aesthetic first)
npm run preview         # preview production build locally
```

Build fails if `check:aesthetic` finds any forbidden file extension or CSS property. This is intentional.

## Coding Standards

- **TypeScript strict mode.** No `any`. No `!` non-null assertions unless justified in a comment.
- **Immutability preferred.** Mutations are fine inside a single function for performance (game loop hot path), but module-level state is immutable-by-convention.
- **Small files.** 200-400 lines typical, 800 max. If a file grows past 400 lines, split.
- **Single source of tunables.** Every numeric constant used by game logic lives in `src/config.ts`. No magic numbers in entity code.
- **Pure functions where possible.** Physics, collision detection, and math helpers are pure. Rendering, audio, and state management have unavoidable side effects.
- **No TODOs in committed code.** If a task is incomplete, leave it `pending` in the Task Breakdown. Do not litter the code with `// TODO`.
- **No premature abstraction.** Three similar lines is better than a helper function used in three places with slight variations.

## Testing Standards

- **TDD-first.** Write the test before the implementation. Not after.
- **Coverage target: 80%** of physics, collision, scoring, persistence modules.
- **Canvas tests use a Proxy-mocked context** (`tests/test-harness.ts#mockCtx`) — verify method calls and args, not pixels.
- **PRNG tests seed deterministically.** `setSeed(42)` at the top of any test that depends on randomness.
- **No Playwright / no real-browser tests in MVP.** Manual visual verification in the dev server is how rendering quality is validated.
- **Every edge case from `product-spec.md § Edge Cases` (E-1 to E-14) has a dedicated test.**

## Git Workflow

- **Branch strategy: `main` only.** No feature branches for this MVP. Every commit lands on `main`. If you need to experiment, branch locally and don't push.
- **One commit per completed task.** Commit message format:
  ```
  <type>(task<N>): <short description>
  
  - What was built
  - What was tested
  - Any deviation from task spec (with reason)
  
  Refs: sdd/v0/specs/task-breakdown.md § Task <N>
  ```
- **Commit types:** `feat` | `fix` | `refactor` | `test` | `docs` | `chore`.
- **No `--no-verify`, no `--amend` of pushed commits, no force pushes to `main`.**
- **Signed commits are not required for this project.**
- **This project's commit format supersedes any global default.** Global rules may specify a plain `<type>: <description>` format; for SpaceNerds always use the `(task<N>)` scope form above. Commits that don't map to a task (e.g. the initial scaffold) may omit the `(task<N>)` scope.

## Repo

- **GitHub:** https://github.com/cpv0310/SpaceNerds (public)
- **Default branch:** `main`

## State Machine (quick reference)

```
TITLE ──SPACE──→ PLAY ──ESC──→ PAUSED ──ESC──→ PLAY
                  │              │
                  │              └─────────────→ (no quit-to-title path)
                  │
                  └── 0 lives ──→ GAME_OVER ──new HS?──→ INITIALS_ENTRY ──SPACE/ESC──→ TITLE
                                      │                       │
                                      └── no HS ──→ TITLE     └── ESC commits "AAA"
```

## Entity Tick Order (per grill-me D11)

Every tick, in order:

1. `input.captureFrame()`
2. `ship.control(dt)` — set ship `ax_prev`/`ay_prev` for thrust
3. `fighter.control(f, ship, dt)` for each fighter
4. `physics.applyGravity(entities, blackHole)` — accumulate
5. `physics.integrate(entities, dt)` — Velocity Verlet
6. `physics.postStep(entities, dt)` — max-speed clamp, wrap, age++
7. `collision.detect(entities)` — pure, returns pairs
8. `game.resolveCollision(pair)` for each pair — effects here
9. `entities.compact()` — sweep dead
10. `game.updateTimers(dt)` — cooldowns
11. `game.updatePhase(dt)` — onboarding, spawners

Do not reorder without updating `sdd/v0/docs/grill-me-decisions.md`.

## Palette (never deviate)

```ts
export const PALETTE = {
  ship:      '#ff2fcf',  // hot pink
  bullet:    '#fffbe6',  // warm white
  asteroid:  '#65ffe0',  // cyan
  fighter:   '#ffb347',  // amber
  blackhole: '#a661ff',  // magenta
  ring:      '#6d3fb3',  // dim magenta (gravity influence ring)
  particle:  '#fffbe6',
  hud:       '#65ffe0',
  bg:        '#000000',
};
```

Every `strokeStyle` assignment references `PALETTE.<key>`. No hard-coded hex strings elsewhere. New colors require a grill-me-style justification (i.e., don't add one).

## When You're Stuck

In priority order:

1. Re-read the task's Acceptance Criteria in `sdd/v0/specs/task-breakdown.md`.
2. Check `sdd/v0/docs/grill-me-decisions.md` for a relevant decision.
3. Check the relevant ADR.
4. Check `sdd/v0/docs/technical-design.md` for the architecture.
5. Check `sdd/v0/specs/product-spec.md` for the functional requirement.
6. If the question isn't answered, STOP. Leave a clear note in the task's Notes field and ask Chris before inventing.

Do not guess at architecture. Do not make up tuning values — use the starters in `config.ts` and tune in Task 20.

## Phase Progression (The Cascade)

- Phase 0 Research — DONE (`sdd/v0/research/research-brief.md`)
- Phase 1 Product Spec — DONE (`sdd/v0/specs/product-spec.md`)
- Phase 2 Technical Design + ADRs + Task Breakdown — DONE
- Phase 2 `/grill-me` exit gate — DONE (`sdd/v0/docs/grill-me-decisions.md`)
- **Phase 3 Implement — IN PROGRESS** ← you are here, work tasks 1-21 in order
- Phase 4 Review — pending (multi-reviewer fresh-context pass after Task 21)
- Phase 5 Compound — pending (learnings capture, commit, ship)

## Key People / References

- **Owner:** Chris Petit (GitHub: `cpv0310`)
- **Entity:** Skunkwerks (personal OSS umbrella)
- **Methodology:** The Cascade — small waterfalls done in sprints. Spec is the product, code is a derivative.
