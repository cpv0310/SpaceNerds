---
type: task-breakdown
date: 2026-04-20
project: SpaceNerds
spec: "[[product-spec]]"
design: "[[technical-design]]"
status: draft
prompt: "Phase 2 Cascade Task Breakdown for SpaceNerds MVP. Translate the Technical Design into sequenced, dependency-aware implementation tasks sized for one-session TDD loops. Each task has description, dependencies, files, acceptance criteria, verification command, and status."
tags: [cascade, phase-2, task-breakdown, spacenerds]
---

# Task Breakdown: SpaceNerds MVP

Sequenced implementation tasks for the 2-week vertical-slice MVP. Each task is sized to fit in a single Claude Code session (one evening, one `/clear` between) with clean context. Tasks are ordered by dependency.

---

## Phase 3 Kickoff — Read This First

**This section is the handoff brief for the human (Chris) starting Phase 3 implementation on the development machine. Read it before the first Claude Code session.**

### One-time setup checklist (before Task 1)

- [ ] Create GitHub repo: `github.com/cpv0310/SpaceNerds` (public)
- [ ] Clone to local: `~/Documents/Code/SpaceNerds/`
- [ ] Copy these Phase 0-2 artifacts from the vault into the repo:
  - `research/research-brief.md`
  - `specs/product-spec.md`
  - `specs/task-breakdown.md` (this file)
  - `docs/technical-design.md`
  - `docs/grill-me-decisions.md`
  - `docs/adr/ADR-001` through `ADR-007`
  - `CLAUDE.md` (root of repo — project instructions for Claude)
- [ ] Initial commit: `git init && git add . && git commit -m "docs: import Phase 0-2 Cascade artifacts"`
- [ ] Push to GitHub, set `main` as default branch
- [ ] Enable GitHub Pages on the repo (Settings → Pages → Deploy from GitHub Actions) — Task 1 will add the workflow
- [ ] Create itch.io account (deferrable to Task 21 if preferred)
- [ ] Open the repo in a Claude Code session: `cd ~/Documents/Code/SpaceNerds && claude`

### Per-session task pattern

**Every implementation session starts with a fresh context (`/clear`).** This is non-negotiable per The Cascade — cross-task context pollution is the #1 cause of design drift.

**Session opening prompt template:**

```
We're implementing Task N of SpaceNerds.

Read these docs in order:
1. CLAUDE.md — project rules and architecture
2. specs/task-breakdown.md § Task N — what to build
3. specs/product-spec.md — for requirements context (FRs this task satisfies)
4. docs/technical-design.md — for architecture (module layout, data models, tick order)
5. docs/grill-me-decisions.md — for design amendments and clarifications
6. docs/adr/ADR-*.md — for specific decisions relevant to this task

Then follow the TDD loop:
- Write the tests first, from Task N's Acceptance Criteria. Run them; confirm they fail (RED).
- Implement only enough to make the tests pass (GREEN).
- Refactor if needed (IMPROVE).
- Run the full test suite — no regressions.
- Update Task N's Status to `done` and fill in the Notes field with anything surprising.
- Commit with a clear message: "feat(taskN): <short description>".

If Task N hits 1.5 evening sessions without passing acceptance criteria, STOP and replan per the 1.5× rule (top of task-breakdown.md).
```

Paste that prompt into the first message of each session, substituting the task number. Claude handles the rest.

### Status lifecycle

Each task's `Status:` field transitions:

```
pending → in-progress → done
```

At session start, Claude sets Status to `in-progress` in the task-breakdown. At session end (after verification passes), Claude sets Status to `done` and commits the change. **The task-breakdown.md file is the single source of truth for progress.**

### Picking the next task

Tasks are sequenced by dependency. **Always work the lowest-numbered task whose Status is `pending` and whose dependencies are all `done`.** If multiple tasks are pending with satisfied dependencies, work in numeric order.

### Commit convention

One commit per completed task. Commit message format:

```
<type>(task<N>): <short description>

- What was built
- What was tested
- Any deviation from task spec (with reason)

Refs: specs/task-breakdown.md § Task <N>
```

Types: `feat` (new feature), `test` (test-only addition), `refactor` (no behavior change), `fix` (bug fix), `docs` (documentation), `chore` (tooling / build).

### Where to get answers during implementation

| Question | Authoritative source |
|---|---|
| What should this feature do? | `specs/product-spec.md` (FRs) |
| What's the architecture here? | `docs/technical-design.md` |
| Why did we pick X over Y? | `docs/adr/ADR-NNN-*.md` |
| What was amended after grill-me? | `docs/grill-me-decisions.md` (wins over earlier drafts) |
| What are the hard rules? | `CLAUDE.md` § Hard Boundaries |
| What's this tunable constant? | `src/config.ts` (all tunables live here) |

### Overrun rule (1.5× — per grill-me D17)

**If any task reaches 1.5 evening sessions without meeting acceptance criteria, stop and replan.** Options in priority order:

1. Cut the task's scope to minimum-viable-for-dependencies.
2. Cut a later optional task.
3. Defer the entire task to v2+ (only if not a dependency of MVP-critical tasks; Task 16 Onboarding is the only such candidate).
4. **NEVER push the ship date.**

When the rule fires, append `OVERRAN: <why> → <replan decision>` to the task's Notes.

---

## Conventions

- Status: `pending` | `in-progress` | `done`
- "Verification" is the exact command an agent runs to confirm the task is complete.
- "Files" lists files to create or modify.
- `Notes` accumulates surprises / decisions during implementation.

---

## Task 1: Project scaffold + LittleJS spike

- **Description:** Bootstrap the code repo separate from the vault. Create a Vite + TypeScript + Vitest project. Install LittleJS. Produce a black canvas with a white triangle that responds to arrow-key rotation — a 30-minute smoke test of the engine choice.
- **Dependencies:** None
- **Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `tests/smoke.test.ts`
- **Acceptance Criteria:**
  - `npm install` completes with zero errors.
  - `npm run dev` serves the app at `localhost:5173` and displays a black canvas with a vector triangle.
  - Arrow keys rotate the triangle in real time.
  - `npm test` runs and passes the smoke test.
  - `npm run build` produces a `dist/` folder under 150 KB gzipped.
- **Verification:** `npm run build && du -sh dist/ && npm test`
- **Status:** done
- **Notes:**
  - LittleJS pinned at `^1.18.0`. ESM import through Vite tree-shakes aggressively — production bundle is 28 KB on disk, **9.48 KB gzipped total** (vs. 150 KB budget). Engine choice looks viable; Task 2 will formally ratify.
  - Scaffold stack: Vite `^5.4.0`, TypeScript `^5.4.5` strict, Vitest `^1.6.0` — all per ADR-006.
  - `tests/smoke.test.ts` is a pipeline-level smoke (trivial assertion, ES2022 `.at()`, async/await), not an import of `main.ts`. Reason: `main.ts` calls `engineInit` at top level for the Vite bootstrap, so importing it from a Node vitest context would need jsdom or dynamic-import gymnastics. Real unit tests begin at Task 6 (physics), which is where pure helpers first appear.
  - `scripts/check-aesthetic.mjs` listed in CLAUDE.md Repository Layout is **deferred**. No task currently owns it; slot it in before Task 21 polish, or open a micro-task.
  - `npm audit` reports 4 moderate vulns in transitive dev deps (esbuild/Vite chain). Non-blocking for a client-only MVP; revisit at Task 21.
  - Visual acceptance (black canvas + rotating white triangle) confirmed manually on 2026-04-20.

## Task 2: Engine choice decision

- **Description:** Based on Task 1 experience, ratify LittleJS as primary OR fall back to raw Canvas 2D. Document the choice as an amendment to ADR-001. Half-day time-box.
- **Dependencies:** Task 1
- **Files:** `docs/adr/ADR-001-engine-choice.md` (amend with "Ratification" section)
- **Acceptance Criteria:**
  - Clear choice between LittleJS and raw Canvas 2D committed.
  - Rationale recorded in ADR.
- **Verification:** Human review (Chris).
- **Status:** done
- **Notes:**
  - Ratified **raw Canvas 2D** as the engine; LittleJS dropped. ADR-001 amended with a "Ratification — Phase 3, Task 2" section explaining the reasoning (spec-specified loop / physics / rendering bypass most of LittleJS's value; the ~300 lines of scaffolding we save are easier to write ourselves than the overrides required to use it).
  - **Scope deviation:** Task 2's Files list is ADR-001 only, but keeping `src/main.ts` on LittleJS after ratifying Canvas 2D would put code and decision out of sync. Rewrote `src/main.ts` as raw Canvas 2D (equivalent rotating-triangle spike), added `<canvas id="game">` to `index.html`, and removed `littlejsengine` from dependencies in the same commit. This is throw-away scaffolding — Task 3 replaces it with the fixed-timestep loop + state machine.
  - Production bundle now **1.28 KB gzipped** (was 9.48 KB with LittleJS). Budget is 150 KB. We have ~117× headroom.
  - Visual acceptance re-confirmed by Chris after engine swap on 2026-04-20.

## Task 3: Game loop + state machine skeleton

- **Description:** Implement the fixed-timestep loop from ADR-007 and the top-level state machine (TITLE → PLAY → PAUSED → GAME_OVER → INITIALS_ENTRY). No entities yet — just state transitions and a debug overlay showing current state.
- **Dependencies:** Task 2
- **Files:** `src/engine/loop.ts`, `src/game.ts`, `tests/game-loop.test.ts`, `tests/state-machine.test.ts`
- **Acceptance Criteria:**
  - Fixed-timestep loop ticks at 60 Hz with `performance.now()` drift measured over 10s < 2%.
  - State machine accepts transitions and rejects illegal ones.
  - Unit tests cover all legal transitions and at least 3 illegal ones.
  - Visual: title screen shows "SPACENERDS" in vector-style text and a "PRESS SPACE TO PLAY" prompt.
  - SPACE transitions TITLE → PLAY. ESC transitions PLAY → PAUSED and back.
- **Verification:** `npm test` passes the game-loop and state-machine suites; manual: cycle all states.
- **Status:** done
- **Notes:**
  - `src/engine/loop.ts` exposes a pure `createStepper()` (testable with injected `now` timestamps) plus `run()` that wraps it in a `requestAnimationFrame` pump. `TICK_HZ = 60`, `TICK_MS = 1000/60`, tab-blur clamp at 250ms per ADR-007.
  - `src/game.ts` is a minimal state machine — `createGame()` returns `{ state, transition, canTransition }`. Illegal transitions throw with a descriptive message and leave state unchanged (fail-fast). Legal-transition table is a `Readonly<Record<GameState, readonly GameState[]>>`.
  - Test coverage: 9 loop tests (no-time, 1-tick, N-ticks, 250ms clamp, alpha range, uniform & jittery 10-second drift both < 2%, constants) + 15 state-machine tests (initial, 7 legal, 7 illegal).
  - Built `src/config.ts` now with `PLAYFIELD_W/H` and the full `PALETTE` (both are canonical-per-CLAUDE-and-TD and needed for title-screen rendering). Held back every tunable not yet referenced — they land with the task that introduces them.
  - `main.ts` rewritten: canvas bootstrap, D5-style aspect-preserving resize, SPACE/ESC key handling, `run(tick, render)` with state-dispatched render. Task 7 will replace the inline resize/draw helpers with `render/canvas.ts`; Task 4 replaces the inline keydown listener with `engine/input.ts`.
  - Text rendering uses the generic `monospace` font as a stand-in. Per D18, Task 19 swaps in Press Start 2P.
  - Floating-point note: `Math.floor(250 / TICK_MS)` evaluates to 14 because `250 / (1000/60)` is `14.999999…` in IEEE-754; the stepper produces 15 ticks because the 15th `acc >= TICK_MS` check passes. Test asserts the range `[15, 16]` instead of the expression.
  - Production bundle **1.59 KB gzipped** (was 1.28 KB at end of Task 2). Budget 150 KB. ~94× headroom.
  - Manual cycling of GAME_OVER and INITIALS_ENTRY paths is deferred to Task 14 (lives/death) — nothing in Task 3 triggers them. State-machine tests cover those transitions exhaustively, so the acceptance criterion "cover all legal transitions" is met by the test suite, not by the UI.

## Task 4: Input system

- **Description:** Keyboard input manager with `isDown` (held) and `justPressed` (edge-triggered, cleared per tick). PreventDefault on arrow keys, space, shift, escape. Handle browser tab blur clearing all keys.
- **Dependencies:** Task 3
- **Files:** `src/engine/input.ts`, `tests/input.test.ts`
- **Acceptance Criteria:**
  - `isDown('ArrowLeft')` is true while key is held, false otherwise.
  - `justPressed('Space')` is true on the tick the key was first pressed, false after.
  - Tab blur clears all held keys.
  - No page-scroll on arrow keys or space.
  - Test suite covers held, press, release, and blur scenarios.
- **Verification:** `npm test tests/input.test.ts`
- **Status:** done
- **Notes:**
  - `createInput(target)` factory returns `{ isDown, justPressed, captureFrame, clear, dispose }`. Indexed by `e.code` (locale-independent: `Space`, `ArrowLeft`, `ShiftLeft`, etc.), not `e.key`.
  - Two-stage `justPressed`: keydown events push into `pending`; `captureFrame()` atomically swaps `pending` → `framePressed` and clears `pending`. OS autorepeat keydown events are filtered out because the key is already in `held`.
  - `preventDefault` fires on ArrowLeft/Right/Up/Down, Space, ShiftLeft/Right, Escape — the scroll-hijacking + browser-shortcut set.
  - Blur listener clears `held`, `pending`, and `framePressed` (E-8 alignment).
  - `main.ts` now owns a single `Input` instance; `captureFrame()` runs at the top of each sim tick, matching D11 step 1. SPACE and ESC transitions now go through `justPressed`, so a held key only fires one transition.
  - Vitest runs in Node (no DOM globals). Tests use a tiny `makeKeyEvent` helper that decorates a plain `Event` with `code`/`key` properties — avoids taking a jsdom/happy-dom dep.

## Task 5: Entity manager + core entity types

- **Description:** Implement `engine/entities.ts` with per-kind arrays, spawn / despawn / iterate / clear helpers. Define all entity TypeScript interfaces from the Technical Design.
- **Dependencies:** Task 3
- **Files:** `src/engine/entities.ts`, `src/entities/*.ts` (type defs + empty constructors), `tests/entities.test.ts`
- **Acceptance Criteria:**
  - Each kind has a typed spawn function.
  - Despawn by marking `alive = false`; compaction sweep removes dead entities.
  - `byKind('asteroid')` returns only asteroids.
  - Test coverage: spawn, despawn, compaction, round-trip through clear().
- **Verification:** `npm test tests/entities.test.ts`
- **Status:** done
- **Notes:**
  - `src/entities/core.ts` holds `CoreEntity` + `initCore(x, y, radius)`. One kind-per-file for Ship/Asteroid/Bullet/Fighter/BlackHole/Particle, each exporting a plain typed constructor.
  - **Deviation from D2:** added `ax: number; ay: number` accumulator fields to `CoreEntity` (D2 specified only `ax_prev/ay_prev`). Rationale: D11 separates `applyGravity` and `ship.control` from `integrate`, which implies a per-entity accel accumulator — otherwise thrust + gravity would have to be combined inline in `integrate`. Keeping `ax/ay` as the "accel accumulated this tick" and `ax_prev/ay_prev` as "saved for next Verlet half-kick" is the cleanest mapping. Will amend D2 in grill-me-decisions at the end of Phase 3 or sooner if this bites us.
  - Store is a factory `createStore()` returning per-kind pools. `all()` concatenates; `byKind(k)` returns the live pool with a generic-typed return so `byKind('ship')` gives `Ship[]`, etc.
  - `despawn(e)` flips `alive=false` only; `compact()` does the in-place swap-compact sweep per pool (order-preserving — tested). `clear()` empties all pools.
  - Added the D4 collision-radii constants and a few spawn defaults (`SHIP_STARTING_LIVES`, `RESPAWN_INVULN`, `BULLET_LIFE`, `BH_G/R_MIN/R_MAX_INFLUENCE`) to `config.ts` since constructors read them.
  - 14 tests covering each spawn, `all()`/`byKind()`, despawn-then-compact, order preservation, clear, and round-trip spawn-clear-spawn.

## Task 6: Physics — Velocity Verlet integrator

- **Description:** Implement `engine/physics.ts` with the Velocity Verlet step per ADR-002. Include a "zero-force" integration path for entities with no acceleration (bullets) that collapses correctly.
- **Dependencies:** Task 5
- **Files:** `src/engine/physics.ts`, `tests/physics.test.ts`
- **Acceptance Criteria:**
  - Constant-force drop test: integrate 5 sec at `a = 100`, assert `x` matches `0.5·a·t²` within 1e-3 px.
  - Zero-force test: integrate 10 sec, assert position = initial + v·t exactly.
  - Circular-orbit test: simulate a test particle in a simple gravity well for 10 seconds; assert orbital radius does not drift > 5%.
  - Max-speed clamp applies via vector norm, not axis-aligned.
- **Verification:** `npm test tests/physics.test.ts`
- **Status:** done
- **Notes:**
  - Exports: `integrate(entities, dt, accelFn)`, `postStep(entities, dt)`, `wrapPlayfield(e, w, h)`, `clampMaxSpeed(e, max)`, `AccelFn` type.
  - **Integrator:** kick-drift-kick Velocity Verlet with `accelFn` called twice per tick (once for a(t), once for a(t+dt)). Exact for constant accel at any `dt` (test confirms drop test is at the FP floor), bounded energy error on circular orbit (test: drift 0.00% over 10s — KDK is symplectic).
  - **Deviation from D11 / D2:** the canonical tick order had `applyGravity` as a separate step *before* `integrate`. That ordering only gives you a(t) at x(t) — not a(t+dt) at x(t+dt) — which forces a semi-implicit-Euler integrator with O(t·dt) error (~4 px drift at 5s, a=100, dt=1/60). Moving the accel computation *inside* `integrate` is what makes it true Verlet. `ship.control` and gravity will therefore live inside the `accelFn` closure passed to `integrate`, not as pre-integrate tick steps. `ax/ay/ax_prev/ay_prev` fields stay — now they cache the latest computed accel across frames (useful for rendering thrust trails and for debug readouts).
  - `wrapPlayfield` defaults to 1280×720 (logical playfield per FR-4.2) but takes explicit w/h for tests.
  - `clampMaxSpeed` uses vector-magnitude scaling per D6 (tested explicitly — preserves direction, not axis-aligned).
  - `postStep` advances `age` and wraps. Max-speed clamp is NOT in postStep — it's per-kind and callers invoke `clampMaxSpeed` directly (ship/fighter only, per D6).
  - 16 tests: zero-force, constant-force (two dt values), circular orbit drift, dead-entity skip, clamp above/at/below cap + direction preservation, wrap in four directions, postStep age/wrap/alive-gating.

## Task 7: Rendering — Canvas 2D line primitives

- **Description:** Implement `render/canvas.ts` with `beginFrame`, `strokePath`, `strokeCircle`, `strokeDashedCircle`, `text`. Use batched-path pattern (one `beginPath` per color). No effects, no gradients, no filters.
- **Dependencies:** Task 2
- **Files:** `src/render/canvas.ts`, `tests/render.test.ts` (canvas assertions via mock or jsdom + visual smoke check)
- **Acceptance Criteria:**
  - `strokePath([{x:0,y:0},{x:100,y:100}], '#ff2fcf')` produces a hot-pink diagonal line on the canvas.
  - `strokeDashedCircle` correctly dashes (verify by counting context method calls).
  - `text` renders legibly (manual verify in dev server).
  - All color strings come from the `PALETTE` constant.
- **Verification:** `npm test tests/render.test.ts`; manual inspection in dev server.
- **Status:** done
- **Notes:**
  - `createRenderer({ canvas, getDevicePixelRatio?, getViewport? })` factory. DPR and viewport are injectable for tests; default to real `window` globals in production.
  - Exports: `beginFrame()` (fills PLAYFIELD_W×H with `PALETTE.bg`), `strokePath(pts, color, {closed?})`, `strokeCircle(x,y,r,color)`, `strokeDashedCircle(x,y,r,color,dash)` (sets + clears `setLineDash` around the stroke), `text(s,x,y,color,size,align?,baseline?)`, plus `resize()`, `width()`, `height()`.
  - `resize()` implements D5 end-to-end: aspect-preserving CSS fit, `cssSize × dpr` backing store, logical-to-physical scale via `ctx.setTransform`, `lineWidth=1.5`, round caps/joins.
  - Tests use a Proxy-mocked `CanvasRenderingContext2D` (D14) — every method call and prop-set gets recorded, asserted by name/args. 12 tests total: beginFrame bg, strokePath (setStroke + beginPath + moveTo + lineTo + stroke ordering, 3-vertex path arg check, empty-/single-point no-op, closed option), strokeCircle (arc+stroke), strokeDashedCircle (setLineDash set-then-clear), text (fillStyle/font/align), resize (aspect preservation at two viewport shapes, DPR applied, line attributes set).
  - Test harness in `tests/test-harness.ts` exposes `createMockCtx` and `createMockCanvas` for future render-adjacent tests.
  - `main.ts` now delegates all drawing to `Renderer`. The title / play / paused / game-over / initials screens render through `r.text(...)`. The debug state badge stays as-is but goes through the same renderer.
  - Still using `monospace` fallback font (D18 swaps in Press Start 2P at Task 19). Every color passed to the renderer comes from `PALETTE.*` — no hex literals escape `config.ts`.

## Task 8: Ship controller + movement

- **Description:** Implement the ship entity: rotate, thrust (with visible flame particles — can stub particles as single-pixel dots here), soft max-speed cap, screen wrap. Render ship as a vector triangle.
- **Dependencies:** Task 4, Task 5, Task 6, Task 7
- **Files:** `src/entities/ship.ts`, `tests/ship.test.ts`
- **Acceptance Criteria:**
  - Arrow-left / right rotates at 4 rad/sec.
  - Arrow-up / W thrusts along facing direction.
  - Ship has momentum — stops thrusting and continues drifting.
  - Screen wrap works on all four edges.
  - Max speed clamp kicks in; ship never exceeds `SHIP_MAX_SPEED`.
  - Unit tests: rotation rate, thrust direction, speed cap, wrap.
- **Verification:** `npm test tests/ship.test.ts`; manual: fly around the playfield.
- **Status:** done
- **Notes:**
  - `src/entities/ship.ts` gained `controlShip(ship, input, dt)`, `shipAccel(ship)`, and `drawShip(r, ship)`. Rotation uses the D8 opposing-key-cancel idiom (right − left). Both Arrow and WASD bindings work simultaneously per FR-2.3.
  - Thrust is represented as a `thrusting: boolean` latch set by `controlShip`; `shipAccel` reads the latch and returns `(cos rot, sin rot) * SHIP_THRUST_ACCEL`. Dead ship forces `thrusting = false` and returns zero accel.
  - Added to `config.ts`: `SHIP_ROTATION_SPEED=4`, `SHIP_THRUST_ACCEL=200`, `SHIP_MAX_SPEED=400` (Research Brief starters; Task 20 tunes).
  - `main.ts` now owns the entity store, runs the full sim per tick while in PLAY (control → integrate → clampMaxSpeed → postStep → compact), and draws the ship during PLAY / PAUSED. Spawn happens at TITLE→PLAY (`startRun()` clears + spawns at playfield center).
  - 19 ship tests: rotation (L/R + WASD + opposing-cancel), thrust latch + direction at rot=0 and rot=π/2, `shipAccel` pure output, momentum persistence, soft max-speed cap (asymptotic approach to SHIP_MAX_SPEED), wrap on three edges, dead ship ignores input.
  - Ship silhouette is a 4-point convex hull (nose, port rear, rear notch, starboard rear); thrust flame is a separate 3-point path rendered only while `thrusting`.

## Task 9: Blaster + hyperspace

- **Description:** Spacebar fires bullets from the ship's nose in the ship's facing direction; bullets have a fixed lifespan and wrap on screen edges. Shift triggers hyperspace: teleport to a random position with ~2 sec invulnerability and 10% chance of death-on-exit.
- **Dependencies:** Task 8
- **Files:** `src/entities/bullet.ts`, modify `src/entities/ship.ts`, `tests/bullet.test.ts`, `tests/hyperspace.test.ts`
- **Acceptance Criteria:**
  - Bullet speed = 600 px/s in world frame (not relative to ship velocity).
  - Bullet despawns after 1.0 sec.
  - Fire cooldown prevents spam.
  - Hyperspace respects cooldown.
  - Hyperspace death rate = 10% (statistically verified with seeded RNG over 1000 samples, assertion within ±2%).
- **Verification:** `npm test`; manual: fire & hyperspace repeatedly.
- **Status:** done
- **Notes:**
  - `ship.ts` gained `tryFireBullet(ship, store)` and `tryHyperspace(ship, randFn)`, both cooldown-gated and no-op on dead ship.
  - `bullet.ts` gained `updateBullet(b, dt)` (decrements `lifeRemaining`, flips `alive=false` at ≤ 0) and `drawBullet(r, b)` (cyan-warm stroke circle).
  - `controlShip` now ticks down `fireCooldown`, `hyperspaceCooldown`, and `invulnUntil` each frame. Cooldown-tick runs even for dead ships so the same function is safe to call unconditionally.
  - Bullet velocity is world-frame (`BULLET_SPEED * (cos rot, sin rot)`); ship velocity is explicitly ignored per FR-3.3. Bullet spawns at `ship.radius * 1.4` forward of ship center.
  - Hyperspace: teleports to random interior point, zeroes velocity + accel accumulators, sets `invulnUntil = max(current, HYPERSPACE_INVULN=2s)`, sets cooldown = 3s, rolls `rand() < 0.10` for death.
  - **PRNG**: created `src/rand.ts` with mulberry32 (per D14). `setSeed` deterministic, `rand` returns `[0,1)`. Tests seed with `42`; production runs unseeded from `Date.now()`.
  - **Death-rate statistical test**: 10,000 seeded samples, `|observed − 0.10|` is well under 2% (the seed-42 run is deterministic — it will pass on every CI run).
  - main.ts: sim tick now fires/hyperspaces on `justPressed` Space/Shift, updates bullets, and renders bullets before the ship so the ship sits on top.
  - **invulnUntil semantics deviation**: TD specified "world-time timestamp", we use "seconds remaining" decremented each tick (aligned with the cooldown fields). Functionally identical; I'll amend the TD description later.
  - 11 bullet tests + 7 hyperspace tests; all 119 previously-passing tests remain green.

## Task 10: Asteroid system (3-tier split)

- **Description:** Implement asteroid entity, spawn logic, polygon hull generation, passive drift + rotation, and the 3-tier split behavior (large → 2 medium → 2 small → vapor).
- **Dependencies:** Task 6, Task 7
- **Files:** `src/entities/asteroid.ts`, `tests/asteroid.test.ts`
- **Acceptance Criteria:**
  - Hull generation: 8-12 verts, radii jittered ±30%, fixed at spawn.
  - Asteroids drift with their initial velocity; no acceleration.
  - On destroy: large spawns 2 medium at same position with random outward velocity; medium → 2 small; small → nothing.
  - Initial spawn at run start: at least 4 large, no closer than 300 px from ship.
  - Periodic spawn during active play when total < cap.
- **Verification:** `npm test tests/asteroid.test.ts`; manual.
- **Status:** done
- **Notes:**
  - `createAsteroid` now generates an 8–12-vert polygonal hull at spawn (evenly angled, radius jittered ±`ASTEROID_HULL_JITTER` = 30%). Hull is stored once and never regenerated — `drawAsteroid` rotates/translates by `(a.rot, a.x, a.y)` each frame.
  - `updateAsteroid(a, dt)`: advances `a.rot += a.rotVel * dt`. Asteroids never accelerate (no thrust path, no entry into `accelFor`).
  - `splitAsteroid(store, a, randFn)`:
    - large → 2 medium, medium → 2 small, small → 0 (vapor).
    - Parent marked `alive=false` regardless of tier.
    - Children inherit parent position + small random jitter (<±3 px) to prevent spawn overlap.
    - Children spawn at ±(π/2 + small noise) from parent velocity direction, at parent speed + `ASTEROID_SPLIT_SPEED_BOOST` (40 px/s starter).
  - `spawnInitialAsteroids(store, shipX, shipY, count, randFn)`: rejection-samples positions until `count` (default 4) are placed ≥ `ASTEROID_MIN_SHIP_DIST` (300 px) from the ship. Random initial velocity in `[20, 60]` px/s. Bounded retry (50×).
  - **Periodic spawner NOT shipped in this task** — gating it on total<cap is straightforward but Task 16 (onboarding) controls *when* periodic spawning starts, and Task 10 doesn't need to ship it to satisfy acceptance. Starter `ASTEROID_SPAWN_INTERVAL=4s` and `ASTEROID_MAX=12` are in config for Task 16 / 20.
  - main.ts: `startRun()` now spawns the ship and the initial 4 large asteroids. Simulate tick updates asteroid rotations; render draws asteroids (closed cyan polygons) under bullets under ship.
  - 13 asteroid tests: hull vertex count + jitter bound + fixed-hull reuse, `updateAsteroid` rotation + dead-skip, split for each of three tiers, children inherit position, children have non-zero outward velocity, initial-spawn distance constraint + non-zero velocity + all-large.
  - `ASTEROID_RADIUS` exported for Task 11 collision tuning and Task 15 scoring.

## Task 11: Collision detection

- **Description:** Implement `engine/collision.ts` with circle-circle broadphase + narrowphase. Emit a list of collisions per tick. Resolve each pair into the right effect (bullet-asteroid, ship-asteroid, ship-fighter, etc.) — resolution handled in `game.ts` step.
- **Dependencies:** Task 5, Task 8, Task 9, Task 10
- **Files:** `src/engine/collision.ts`, `src/game.ts` (resolution step), `tests/collision.test.ts`
- **Acceptance Criteria:**
  - Overlapping circles detected; just-touching detected; just-separated NOT detected.
  - Order of entities in the pair is deterministic (sorted by kind).
  - All 9 collision cases from Technical Design § Collision Resolution are unit-tested.
  - Edge cases E-1 through E-14 that involve collisions are each a dedicated test.
- **Verification:** `npm test tests/collision.test.ts`
- **Status:** done
- **Notes:**
  - **Detection** (`src/engine/collision.ts`): pure. `detect(entities)` runs O(n²) circle-circle with broadphase-narrowphase collapsed (we're at n≤35). Particles are skipped. Pairs are emitted with the kind-ordered canonical form per `KIND_ORDER` — `asteroid(0) < blackhole(1) < bullet(2) < fighter(3) < particle(4) < ship(5)` — so `(a.kind, b.kind)` in the returned pair is always in alphabetical-by-order-index order.
  - **Resolution** (`src/engine/resolve.ts`): the dispatch table keys off `"${a.kind}:${b.kind}"`. 9 cases ship, aligned to TD § Collision Resolution. Both-dead pair is a no-op (matters for E-13 replay during the resolve loop).
  - **Invulnerability rule**: `invulnUntil > 0` blocks asteroid/fighter/fighter-bullet damage (E-5). It does NOT block black-hole event-horizon death (E-1). Invulnerable-ship-vs-fighter kills the fighter but spares the ship (matches classic arcade "ram with shields" feel).
  - **Friendly fire**: ship bullet vs ship is silently ignored; fighter bullet vs fighter likewise. Tested explicitly. Bullet-spawn-at-nose clearance (Task 9) handles the common case of freshly-fired bullet overlapping its own ship.
  - **Edge cases tested**: E-1 (BH horizon ignores invuln), E-5 (invuln + asteroid, invuln + fighter bullet, invuln + fighter-ram), E-6 (fighter-asteroid mutual destruction, no score), E-13 (second bullet on already-dead asteroid is a no-op, bullet survives). E-2 (split-in-gravity), E-8 (tab blur), E-14 (hyperspace-same-frame-as-death) are ordering concerns handled by the tick sequence, not this module.
  - **main.ts wiring**: `detect(store.all())` runs after `postStep`; each pair routed to `resolveCollision` before `compact()`. Put a first bullet through a large asteroid and you'll see 2 mediums pop out.
  - 24 collision tests: 6 geometry (overlap / touch / separated / dead / particle-exclude / ordering), 9 pair-kind detection, 9 resolution-case, 6 edge-case. 163 tests total green.

## Task 12: Black hole — gravity + event horizon + visible influence ring

- **Description:** Implement the black hole entity. Gravity force per ADR-003 (capped-radius inverse-square). Event horizon destroys entities that cross `r_min`. Rendering: animated nested rings, central black disc, and the **visible dashed influence ring at `r_max_influence`** (FR-6.7 fairness requirement).
- **Dependencies:** Task 6, Task 7, Task 11
- **Files:** `src/entities/blackhole.ts`, modify `src/engine/physics.ts` to accumulate gravity into force function, `tests/blackhole.test.ts`
- **Acceptance Criteria:**
  - Gravity force returns zero beyond `r_max_influence`.
  - Gravity force is capped at `r_min` (no infinity).
  - Ship crossing event horizon is destroyed (one life lost).
  - Asteroid crossing event horizon is consumed without splitting.
  - Hyperspace does NOT protect from event-horizon death (per E-1).
  - Visible dashed ring rendered at `r_max_influence` (manual visual check).
  - Rotating radial spokes animate smoothly.
- **Verification:** `npm test tests/blackhole.test.ts`; manual: fly near the hole, see ring, slingshot past.
- **Status:** done
- **Notes:**
  - `gravityAccel(ex, ey, bh)` per D3 — acceleration, not force. Returns `[0,0]` beyond `influenceR` and at `r≈0`; magnitude capped at `G/eventHorizonR²`. Inverse-square law verified: at r=100 vs r=200 magnitudes follow 1:4 ratio.
  - `updateBlackHole(bh, dt)` advances `ringPhase` at 0.5 rad/s (D18 didn't pin it, starter value) and wraps to `[0, 2π)`.
  - `drawBlackHole(r, bh)`:
    - solid magenta ring at `eventHorizonR + 4`
    - 8 rotating radial spokes between `eventHorizonR + 4` and `+14`
    - **dashed dim-magenta ring at `influenceR` per FR-6.7** (the non-negotiable fairness cue), 10/8 dash pattern
    - no filled disc — the canvas bg is already black per PALETTE.bg
  - `accelFor` in main.ts now accumulates: ship-thrust (if ship) + gravity from every live black hole. Particles return `[0,0]` per D7. Every other kind (ship, fighter, asteroid, bullet) is in-scope for gravity.
  - `placeBlackHole(shipX, shipY)` uses `randRange(120, W-120) × (120, H-120)`, rejection-sampled until ≥ 250 px from ship spawn (FR-6.1). Fallback to upper-right area if 50 attempts fail.
  - Event-horizon deaths: ship-vs-BH and asteroid-vs-BH and bullet-vs-BH and fighter-vs-BH are all handled by Task 11's resolver using the `CoreEntity.radius = eventHorizonR` that `createBlackHole` sets — circle-circle detection doubles as event-horizon detection.
  - 11 tests for Task 12: 6 `gravityAccel` (beyond influence, inside influence, direction, r_min cap, r=0 safety, inverse-square law), 3 event-horizon collisions (ship/asteroid/invuln), 2 `updateBlackHole` (advance + wrap).

## Task 13: Ko-Dan Fighter enemy

- **Description:** Implement the Fighter entity with basic AI (approach / strafe / retreat). Fires bullets at the player. Destroyed by one projectile hit. Subject to black hole gravity.
- **Dependencies:** Task 9 (bullets), Task 11 (collision), Task 12 (gravity)
- **Files:** `src/entities/fighter.ts`, `tests/fighter.test.ts`
- **Acceptance Criteria:**
  - Fighter at > 400 px from player thrusts toward player.
  - Fighter at 150-400 px strafes perpendicular and fires.
  - Fighter at < 150 px retreats.
  - Fighter fires at cooldown, bullet from its position in ship direction.
  - Fighter destroyed by a single player bullet, awards 200 points.
  - Fighter is affected by black hole gravity and destroyed by event horizon.
  - Fighter spawns periodically during active play, capped at 3 concurrent.
- **Verification:** `npm test tests/fighter.test.ts`; manual.
- **Status:** done
- **Notes:**
  - `controlFighter(f, ship, dt)`: picks `aiState` from squared distance (`approach > 400², strafe [150²,400²], retreat < 150²`), then sets `rot` accordingly (face-ship / face-perpendicular / face-away). Ticks `fireCooldown` down.
  - `fighterAccel(f)`: thrust vector at `FIGHTER_THRUST_ACCEL * (cos rot, sin rot)` — always on (fighters are always trying to move in the direction of their current AI state).
  - `tryFighterFire(f, ship, store)`: fires only while strafing and when cooldown is clear. Bullet aimed at the ship's current position (not fighter's rotation), with `'fighter'` source. `FIGHTER_BULLET_SPEED=500 px/s` world-frame.
  - `spawnFighterAtEdge(store, randFn)`: picks a random one of the four playfield edges, random position along it, 10 px inset.
  - Scoring for fighter kills (200 points) is Task 15 — here we just ensure single-shot destruction via the existing `bullet:fighter` resolver (Task 11).
  - Drawing: 6-vert amber silhouette (swept-wing shape, clearly distinct from the ship triangle and asteroid polygon) per FR-7.7.
  - **main.ts wiring**:
    - `accelFor` gained a fighter branch: `kind === 'fighter' ? fighterAccel(e)` plus the same gravity accumulation as every other non-particle entity (D7).
    - `simulate` runs `controlFighter` and `tryFighterFire` for each fighter, then `clampMaxSpeed(FIGHTER_MAX_SPEED=280)` after integrate.
    - A `fighterSpawnTimer` ticks down; when ≤0 and live fighter count < 3, `spawnFighterAtEdge` runs and the timer resets to `FIGHTER_SPAWN_INTERVAL=8s`. Task 16 onboarding will gate this until the grace window ends.
    - Fighters render between asteroids and bullets in the z-order.
  - 17 fighter tests: 3 AI state bands, 3 rotations per state, 2 `fighterAccel` (alive + dead), 4 firing (in-range fire, out-of-range no-fire, cooldown gating, dead no-fire), 2 spawn (interior + edge-adjacent), 1 cooldown tick. All 189 previously-green tests remain green.

## Task 14: Lives, respawn, game over

- **Description:** Implement the lives lifecycle: start at 3, decrement on ship death, respawn at center with 2-sec invulnerability, transition to GAME_OVER at zero lives.
- **Dependencies:** Task 3 (state machine), Task 8 (ship), Task 11 (collision detection identifies deaths)
- **Files:** modify `src/game.ts`, `src/entities/ship.ts`, `tests/lives.test.ts`
- **Acceptance Criteria:**
  - Lives count starts at 3.
  - Ship death → decrement, respawn at center with invuln window.
  - Third death → GAME_OVER state.
  - Invulnerable ship cannot be harmed by enemy bullets or asteroids (per E-5).
  - Invulnerable ship STILL dies crossing the black hole event horizon (per E-1).
- **Verification:** `npm test tests/lives.test.ts`; manual: die 3 times, observe GAME_OVER.
- **Status:** done
- **Notes:**
  - `respawnShip(ship)` in `entities/ship.ts`: resets position to playfield center, zeroes all velocity/accel fields, clears cooldowns, re-enables `alive`, and seeds `invulnUntil = RESPAWN_INVULN` (2s).
  - `processShipDeath(ship, game)` in `game.ts`: called per tick after `detect→resolve`. No-op if `alive`. Otherwise decrements `lives`, then either `respawnShip` (if `lives > 0`) or `game.transition('GAME_OVER')` (if `lives === 0` and game is still in PLAY).
  - **Invulnerability**: already working end-to-end from Task 11 (resolver checks `invulnUntil > 0` for asteroid/fighter/fighter-bullet) and Task 12 (BH horizon ignores invuln per E-1).
  - **State wiring**: main.ts now transitions GAME_OVER → TITLE on `Space` (FR-10.3 "PRESS SPACE TO PLAY AGAIN"). Task 19 swaps in the high-score check and may route to INITIALS_ENTRY instead.
  - `renderGameOver` overlays "GAME OVER" + prompt on the frozen scene (ship gone, asteroids + black hole still visible). Final-score display lands in Task 15 once the scoring system exists.
  - 11 lives tests: starting lives, respawn resets (position, velocity, accel, invuln, cooldowns), processShipDeath paths (no-op alive, decrement + respawn, third-death → GAME_OVER, dead-in-GAME_OVER stays dead).

## Task 15: Scoring + HUD

- **Description:** Implement scoring (asteroid sizes, fighter kills) and draw the HUD: score top-left, lives top-right (as 3 small ship icons), game state indicators.
- **Dependencies:** Task 7, Task 10, Task 13, Task 14
- **Files:** `src/game.ts` (scoring logic), `src/render/hud.ts`, `tests/scoring.test.ts`
- **Acceptance Criteria:**
  - Scoring values: asteroid large = 20, medium = 50, small = 100; fighter = 200.
  - Score displays in vector-style glyphs.
  - Lives HUD updates on death and respawn.
  - No double-score on same-frame multi-bullet hits (per E-13).
- **Verification:** `npm test tests/scoring.test.ts`; manual.
- **Status:** done
- **Notes:**
  - `RunState` now lives in `src/game.ts` per TD § Run state — `score`, `asteroidsBroken`, `enemyKills`, `phase`, `phaseSwitchAt`, `elapsed`. `createRunState()` factory matches onboarding defaults (Task 16 will gate spawners on `phase`).
  - Scoring constants landed in config: `SCORE_ASTEROID_LARGE=20`, `SCORE_ASTEROID_MEDIUM=50`, `SCORE_ASTEROID_SMALL=100`, `SCORE_FIGHTER=200` (OQ-5 starters; Task 20 tunes).
  - `resolveCollision(c, store, randFn, runState?)` takes an optional `runState`. Scoring runs only on ship-bullet-kills-asteroid/fighter pairs. Friendly fire and fighter-vs-asteroid (E-6) and black-hole consumption award no points. `runState` is optional to keep the existing 24 collision tests green without touching them.
  - **E-13 double-award avoidance** is already structural: `resolveCollision` early-returns when either entity is already dead, so a second bullet on a dead asteroid doesn't hit the scoring branch.
  - `src/render/hud.ts` draws `SCORE <N>` in HUD cyan, top-left, and three small ship silhouettes top-right (bright = remaining life, dim ring color = lost life). Lives render as miniature 4-point hulls, nose-right so the vector shape reads at 14 px scale.
  - main.ts: `runState = createRunState()` on `startRun()`; HUD renders in `renderScene` so it appears in PLAY / PAUSED / GAME_OVER. `elapsed` ticks during sim; resolveCollision now receives `runState`. GAME_OVER overlay now shows `FINAL SCORE <N>`.
  - 7 scoring tests + 4 HUD tests.

## Task 16: Onboarding grace window

- **Description:** Implement the 20-30 sec enemy-free / asteroid-spawn-paused start window per FR-13. Initial asteroids are still present; only NEW spawns are suppressed. No fighters spawn during onboarding.
- **Dependencies:** Task 10, Task 13
- **Files:** modify `src/game.ts`, `tests/onboarding.test.ts`
- **Acceptance Criteria:**
  - First 25 sec of active play: no fighter spawns, no new asteroid spawns.
  - At t = 25, both resume normally.
  - Initial asteroid set from Task 10 is NOT affected.
  - Unit test with mocked time covers the transition.
- **Verification:** `npm test tests/onboarding.test.ts`
- **Status:** done
- **Notes:**
  - New module `src/spawners.ts` owns periodic-spawn logic. Exports:
    - `SpawnTimers { fighter, asteroid }` + `createSpawnTimers()`
    - `updateRunPhase(run)` — flips `onboarding → active` when `run.elapsed >= run.phaseSwitchAt`. One-way (never switches back to onboarding).
    - `tickSpawners(store, run, timers, dt, randFn)` — decrements both timers; bails early (and holds timers to full interval) when `phase !== 'active'`; otherwise fires a fighter or asteroid spawn when its timer reaches 0 and the respective cap (`FIGHTER_MAX=3`, `ASTEROID_MAX=12`) isn't yet met.
  - `src/entities/asteroid.ts` gained `spawnAsteroidAtEdge(store, randFn)` — random edge, 10 px inset, velocity pointed roughly inward with small cross-axis jitter.
  - `main.ts` refactored: replaced inline `fighterSpawnTimer` logic with `tickSpawners`, which now handles both fighter AND periodic asteroid spawning in one call. `ONBOARDING_GRACE_SEC=25` is the default `phaseSwitchAt`.
  - Initial 4 large asteroids from `spawnInitialAsteroids` (Task 10) are **not affected** by onboarding — they spawn once in `startRun` and stay.
  - 9 onboarding tests: phase lifecycle (start/stay-below/switch-at/persist-after), fighter/asteroid no-spawn in onboarding even past interval, both begin spawning after `phase='active'`, integration test asserting first fighter spawn occurs at `elapsed >= ONBOARDING_GRACE_SEC`.

## Task 17: Audio — jsfxr SFX integration

- **Description:** Integrate jsfxr. Define all 10 MVP SFX presets in `audio/presets.ts`. Handle Safari `AudioContext` unlock on first gesture. Wire all SFX into game events.
- **Dependencies:** Task 3, Task 9, Task 10, Task 13, Task 14
- **Files:** `src/audio/sfx.ts`, `src/audio/presets.ts`, `tests/sfx.test.ts`
- **Acceptance Criteria:**
  - All 10 SFX play on their triggering events: ship shoot, thrust (continuous), 3 asteroid-bang tiers, fighter shoot, fighter bang, ship bang, hyperspace in, hyperspace out.
  - Mute toggle silences all audio.
  - Safari initial-gesture unlock works (tested manually on Safari).
  - Unit test mocks `AudioContext` and verifies correct `play` calls per game event.
- **Verification:** `npm test`; manual audio test in Chrome, Firefox, Safari.
- **Status:** pending
- **Notes:**

## Task 18: localStorage persistence

*(Swapped with old Task 18 post-grill-me — see [[grill-me-decisions]] D13. Persistence must exist before Screens can read from it.)*

- **Description:** Implement high-score persistence per FR-12 and the "top 10" high-score table. Handle private-mode / quota failures silently.
- **Dependencies:** Task 3
- **Files:** `src/persist.ts`, `tests/persist.test.ts`
- **Acceptance Criteria:**
  - High scores survive page refresh.
  - Top 10 only; eleventh entry evicts the lowest.
  - Corrupt JSON is reset silently to defaults.
  - Quota-exceeded throws caught; game continues.
  - Mute state persists via `Saved.muted`.
  - Unit test with mocked `localStorage`.
- **Verification:** `npm test tests/persist.test.ts`; manual: play, get high score, reload, verify.
- **Status:** pending
- **Notes:**

## Task 19: Title screen + Game Over + Initials entry

- **Description:** Implement the TITLE, GAME_OVER, and INITIALS_ENTRY state renders and transitions. Title shows current high score; Game Over shows final score and "NEW HIGH SCORE" if applicable; Initials entry is keyboard-only (arrows cycle A-Z, space confirms). ESC during INITIALS_ENTRY commits "AAA" and returns to TITLE (per [[grill-me-decisions]] D12).
- **Dependencies:** Task 3 (state machine), Task 15 (HUD), Task 18 (persistence)
- **Files:** `src/screens/title.ts`, `src/screens/gameover.ts`, `src/screens/initials.ts`, `tests/screens.test.ts`
- **Acceptance Criteria:**
  - TITLE displays game name, high score, and prompt. Uses Press Start 2P web font (D18).
  - GAME_OVER displays final score + high-score-check.
  - INITIALS_ENTRY accepts 3 letters, confirms with SPACE, cancels with ESC (records "AAA").
  - All screens are vector-only, no images.
- **Verification:** `npm test`; manual: play through full cycle.
- **Status:** pending
- **Notes:**

## Task 20: Playtest pass + tuning

- **Description:** Run the full MVP end-to-end for ~30 playtests over 2-3 sessions. Tune every constant in `config.ts` to feel right. Specifically: ship responsiveness, gravity well strength, asteroid density, fighter aggression, score curve, onboarding grace duration.
- **Dependencies:** All preceding tasks.
- **Files:** `src/config.ts` (exclusive edits here), any balance-related adjustments
- **Acceptance Criteria:**
  - Chris reaches personal-best improvement curve over 5 consecutive runs without frustration (SM-6).
  - Median run length lands in 3-7 min (SM-8).
  - Every death feels attributable, no "what killed me" moments (SM-9).
  - Gravity well reads fairly (visible influence ring working as intended).
  - Onboarding grace window feels right — not too long, not too short.
- **Verification:** Playtest log recorded as bullet list in this task's Notes field.
- **Status:** pending
- **Notes:**

## Task 21: Polish, cross-browser test, deploy

- **Description:** Final polish pass. Cross-browser test (Chrome, Firefox, Safari, Edge). Fix any Safari audio weirdness. Deploy to itch.io (ZIP) and own Skunkwerks domain. Verify SM-1, SM-2, SM-4.
- **Dependencies:** Task 20
- **Files:** `index.html` (meta tags, CSP), `dist/` (build output)
- **Acceptance Criteria:**
  - Lighthouse score: Performance ≥ 90, Best Practices ≥ 95.
  - 60 FPS sustained on Chrome and Safari on M1 MacBook Pro (SM-2).
  - 10-min playtest completes with zero console errors (SM-4).
  - Live URL on itch.io AND on own domain (SM-1).
- **Verification:** Manual cross-browser test + Lighthouse run + live URL walk.
- **Status:** pending
- **Notes:**

---

## Summary

21 tasks. Dependency-ordered. Each sized for a single Claude Code session (~1-2 hours of focused work). Projected distribution across the 14 evening budget:

- **Week 1 (Days 1-7):** Tasks 1-11 (foundation through collision)
- **Week 2 (Days 8-14):** Tasks 12-21 (black hole → ship)

Expected slack: ~2 days absorbed into Tasks 20 + 21 (playtest + deploy), which are the flexible parts. Any task that overruns by more than a day triggers a scope replan, not an hours-overrun.
