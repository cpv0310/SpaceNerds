---
type: technical-design
date: 2026-04-20
project: SpaceNerds
spec: "[[product-spec]]"
research: "[[research-brief]]"
status: draft
prompt: "Phase 2 Cascade Technical Design for SpaceNerds MVP (2-week vertical slice). Translate Product Spec FRs/NFRs and Research Brief findings into an architecture, technology stack, data models, module interfaces, component designs, and testing strategy that an implementation team (human + Claude) can execute from. MVP only; v2+ considerations marked as roadmap, not current scope."
tags: [cascade, phase-2, technical-design, spacenerds, architecture]
---

# Technical Design: SpaceNerds MVP

## Purpose

This document specifies *how* we build the SpaceNerds MVP defined in the [[product-spec]]. It is the implementation blueprint — architecture, tech stack, data shapes, module interfaces, component behaviors, and test strategy. It is scoped to the **2-week vertical-slice MVP** and explicitly foregoes scaffolding for v2+ features beyond what keeps the extension path open.

## Architecture Overview

SpaceNerds is a **single-page client-side browser game** with no backend. It runs entirely in the player's browser, persists high scores via `localStorage`, and ships as a static bundle of HTML + JS + (optionally) a single font file. All graphics are procedurally drawn; all audio is procedurally synthesized.

### Top-Level Module Diagram

```
┌────────────────────────────────────────────────────────────┐
│                        index.html                          │
│                    (bootstrap + canvas)                    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                      main.ts (entry)                       │
│                  starts game, owns loop                    │
└──┬───────────────┬──────────────┬──────────────┬───────────┘
   │               │              │              │
   ▼               ▼              ▼              ▼
┌──────┐     ┌──────────┐   ┌──────────┐  ┌────────────┐
│ game │     │ renderer │   │  input   │  │   audio    │
│ loop │     │ (Canvas) │   │ (keys)   │  │  (jsfxr)   │
└──┬───┘     └──────────┘   └──────────┘  └────────────┘
   │
   ▼
┌────────────────────────────────────────────────────────────┐
│                         engine                             │
│  state machine │ entity manager │ physics │ collision      │
└──┬─────────────────────────────────────────────────────────┘
   │
   ▼
┌────────────────────────────────────────────────────────────┐
│                        entities                            │
│  ship │ asteroid │ bullet │ fighter │ blackhole │ particle │
└────────────────────────────────────────────────────────────┘
```

### State Machine

The game has a small explicit state machine. This is non-negotiable because it eliminates an entire class of "ambiguous state" bugs.

```
                 ┌──────────────┐
                 │    TITLE     │
                 │  show high   │
                 │   scores     │
                 └──────┬───────┘
                        │ SPACE
                        ▼
             ┌──────────────────────┐
    ┌───────▶│        PLAY          │────────┐
    │        │  run active, entities│        │ 0 lives
    │        │  sim, render, collide│        ▼
    │        └──────────┬───────────┘  ┌──────────────┐
    │                   │              │  GAME OVER   │
    │                   │              │ final score, │
    │        PAUSED via ESC            │ new high chk │
    │                   ▼              └──────┬───────┘
    │            ┌──────────┐                 │
    │            │  PAUSED  │                 │ new HS?
    │            │ overlay  │                 ▼
    │            │  dim FG  │         ┌────────────────┐
    │            └─────┬────┘         │ INITIALS_ENTRY │
    │                  │ ESC/P        │ 3-char entry   │
    └──────────────────┘              └────────┬───────┘
                                               │ confirm
                                               ▼
                                        (back to TITLE)
```

The state machine is a single enum plus a typed `currentState` variable in the `game` module. Every frame dispatches on current state; transitions are explicit function calls.

### Game Loop

**Fixed-timestep simulation, interpolated render.** 60 Hz sim tick, render every `requestAnimationFrame`. This is the [Gaffer On Games](https://gafferongames.com/post/integration_basics/) standard pattern. It makes physics deterministic, keeps vsync tear-free, and stays correct if a frame stalls.

Pseudocode:

```ts
const TICK_HZ = 60;
const TICK_MS = 1000 / TICK_HZ;
let acc = 0;
let lastT = performance.now();

function frame(nowT: number) {
  let dt = nowT - lastT;
  lastT = nowT;
  if (dt > 250) dt = 250;  // clamp after tab-blur pause
  acc += dt;

  while (acc >= TICK_MS) {
    tick(TICK_MS / 1000);  // simulation step, dt in seconds
    acc -= TICK_MS;
  }

  const alpha = acc / TICK_MS;  // [0,1) render interpolation factor
  render(alpha);

  requestAnimationFrame(frame);
}
```

We accept the small visual latency this adds because determinism and stable physics are worth more than strict real-time.

## Technology Stack

| Layer | Choice | Rationale | ADR |
|---|---|---|---|
| Language | TypeScript 5.x | Type safety for physics math and entity state; first-class support in all candidate bundlers; Claude writes TS fluently. | — |
| Engine | **LittleJS** (primary) / raw Canvas 2D (fallback) | LittleJS is ~20KB, batteries-included, non-opinionated for vector-only art. Fallback is zero-dep and Claude-friendly. Final pick ratified in Phase 3 Task 1 prototyping. | [[adr/ADR-001-engine-choice]] |
| Bundler | Vite 5.x | Fastest dev iteration, zero config for TS + HTML, tiny production bundle, built-in TS + HMR. | [[adr/ADR-006-build-tooling]] |
| Rendering primitive | Canvas 2D, batched `beginPath`/`stroke` per color | At ~35 entities × ~16 verts each, Canvas 2D is comfortably 60 FPS. WebGL's 1px line-width driver limit is a real tax. WebGL deferred to v2+. | [[adr/ADR-001-engine-choice]] |
| Physics integrator | Velocity Verlet | Symplectic; energy-conserving; essential for ship-near-black-hole stability. Plain Euler diverges in seconds. | [[adr/ADR-002-physics-integrator]] |
| Gravity model | Capped-radius inverse-square | `F = G·m / max(r², r_min²)` with clamp to zero beyond `r_max_influence`. Physically sensible, numerically stable, tuneable. | [[adr/ADR-003-gravity-model]] |
| Entity model | Plain objects in typed arrays, flat pool, no ECS | 35 entities, no need for ECS overhead. `{ x, y, vx, vy, rot, radius, alive, kind }` pattern, per-kind arrays. | [[adr/ADR-005-entity-model]] |
| Audio (SFX) | jsfxr | Canonical arcade-blip generator, MIT-licensed, npm-installable, zero audio files. Matches our "totally runtime" aesthetic. | [[adr/ADR-004-audio-library]] |
| Audio (music) | None for MVP | Deferred to v2+. Optional title-screen drone via raw `AudioContext` if time permits; cuttable if not. | [[adr/ADR-004-audio-library]] |
| Persistence | `localStorage` | Single namespace `spacenerds.v1`, JSON-encoded, ≤2KB total, graceful degradation on quota/private-mode failure. | — |
| Testing | Vitest | Native Vite integration, identical semantics to Jest, fast, TS-first. | [[adr/ADR-006-build-tooling]] |
| Deployment | itch.io + own Skunkwerks domain mirror | Static ZIP upload to itch, `rsync` (or `gh-pages` / Cloudflare Pages) for domain. | — |

## Data Models

### Entity kinds

Six active entity kinds plus particles. Each kind has its own pool (flat array) for cache locality and cheap iteration. `kind` is a string tag for code clarity.

```ts
// Shared core (every entity)
// Amended post-grill-me (see docs/grill-me-decisions.md D2):
// ax_prev/ay_prev added for Velocity Verlet; mass deliberately NOT included
// because gravity is computed as acceleration directly (see ADR-003 / D3).
interface CoreEntity {
  x: number;          // px, world coords
  y: number;          // px
  vx: number;         // px/sec
  vy: number;         // px/sec
  ax_prev: number;    // px/sec², previous-frame acceleration (Verlet)
  ay_prev: number;    // px/sec²
  rot: number;        // radians; 0 = facing +x ("east")
  radius: number;     // collision radius (circle approx)
  alive: boolean;
  age: number;        // sec, monotonic since spawn
}
```

#### Ship

```ts
interface Ship extends CoreEntity {
  kind: 'ship';
  lives: number;             // 3 at run start
  invulnUntil: number;       // world-time, respawn / hyperspace window
  thrusting: boolean;        // one-frame latch for thrust rendering & SFX
  fireCooldown: number;      // sec until next shot allowed
  hyperspaceCooldown: number;// sec
}
```

Canonical values at spawn: `x, y = viewport center`, `vx = vy = rot = 0`, `radius = 10`, `alive = true`, `age = 0`, `lives = 3`, `invulnUntil = now + 2`, all cooldowns = 0.

#### Asteroid

```ts
interface Asteroid extends CoreEntity {
  kind: 'asteroid';
  tier: 'large' | 'medium' | 'small';   // 3-tier split (FR-5.2)
  hull: Point[];                         // pre-generated polygon verts in local space
  rotVel: number;                        // radians/sec passive rotation
}
```

Tier mapping (starter; tune in Phase 3):
| Tier | Radius | Points | Spawns on destroy |
|---|---|---|---|
| large | 40 px | 20 | 2 × medium |
| medium | 24 px | 50 | 2 × small |
| small | 12 px | 100 | nothing |

Hull generation: 8-12 verts evenly spaced in angle, radius perturbed by ±30%, fixed at spawn time, never regenerated. Draw uses the rotation matrix only.

#### Bullet

```ts
interface Bullet extends CoreEntity {
  kind: 'bullet';
  source: 'ship' | 'fighter';
  lifeRemaining: number;    // sec, despawn at 0
}
```

Speed is fixed in world frame at spawn (`600 px/s` starter); velocity does NOT add to shooter's velocity (classic Asteroids behavior).

#### Fighter (Ko-Dan)

```ts
interface Fighter extends CoreEntity {
  kind: 'fighter';
  aiState: 'approach' | 'strafe' | 'retreat';
  aiTimer: number;           // sec, state dwell
  fireCooldown: number;
}
```

Basic AI in MVP (expand in v2+): if player > 400 px away → thrust toward player; if 150-400 → strafe perpendicular and fire on cooldown; if < 150 → retreat. Obstacle avoidance only for asteroids and black hole (simple repulsion from nearest hazard).

#### BlackHole

```ts
interface BlackHole extends CoreEntity {
  kind: 'blackhole';
  // vx/vy/rot unused at MVP scope (stationary)
  eventHorizonR: number;     // r_min, lethal radius (30 px)
  influenceR: number;        // r_max_influence (400 px)
  G: number;                 // gravity constant (800-1500, tune)
  ringPhase: number;         // animation phase for vector rings
}
```

#### Particle (explosion / thrust trail)

```ts
interface Particle extends CoreEntity {
  kind: 'particle';
  lifeRemaining: number;
  color: string;       // neon palette entry
  length: number;      // if line-particle, px
}
```

Thrust trail uses particles with short life (~0.3s) spawned per-frame behind the ship. Explosions spawn a burst of 12-18 radial particles.

### Run state

```ts
interface RunState {
  phase: 'onboarding' | 'active';  // onboarding = grace window per FR-13
  phaseSwitchAt: number;           // world-time when onboarding ends
  score: number;
  runStartAt: number;              // world-time (for stats)
  enemyKills: number;
  asteroidsBroken: number;
}
```

### Persistent state (localStorage)

```ts
interface Saved {
  version: 1;
  highScores: { initials: string; score: number; dateISO: string }[];  // top 10
  runCount: number;
  muted: boolean;
}
```

Stored under key `spacenerds.v1`. JSON-encoded. Read on title load, written on game-over and mute toggle. Writes wrapped in `try/catch`; failures silent.

## Module Interfaces

Modules are single TypeScript files unless explicitly noted. Each exports a small named API.

### `main.ts`
- `start(): void` — called from `index.html` inline script; bootstraps the engine.

### `game.ts` (state machine + orchestration)
- `init(): void`
- `transition(to: State): void`
- `tick(dt: number): void`
- `render(alpha: number): void`
- `state(): State`

### `engine/loop.ts`
- `run(tick: (dt: number) => void, render: (alpha: number) => void): void` — owns the fixed-timestep loop and `requestAnimationFrame` pump.

### `engine/entities.ts`
- `spawnShip(x, y): Ship`
- `spawnAsteroid(x, y, tier, vx, vy): Asteroid`
- `spawnBullet(x, y, rot, source): Bullet`
- `spawnFighter(x, y): Fighter`
- `spawnBlackHole(x, y): BlackHole`
- `spawnParticle(x, y, vx, vy, color, life): Particle`
- `all(): readonly Entity[]` — iteration for systems
- `byKind<K extends Entity['kind']>(k: K): Entity[]`
- `despawn(e: Entity): void`
- `clear(): void` — on state transition to TITLE

### `engine/physics.ts`
- `integrate(entities: CoreEntity[], dt: number, forces: Vec2Fn): void` — Velocity Verlet step.
- `applyGravity(ship: Ship, blackHole: BlackHole): Vec2` — per-entity gravity force contribution.
- `wrapPlayfield(e: CoreEntity, w: number, h: number): void` — MVP screen wrap.

### `engine/collision.ts`
- `detect(entities: CoreEntity[]): Collision[]` — circle-circle broadphase + narrowphase. Returns a list of colliding pairs.

O(n²) is fine for n=35. No spatial hash in MVP.

### `engine/input.ts`
- `isDown(key: KeyCode): boolean`
- `justPressed(key: KeyCode): boolean` — edge-triggered, cleared each tick
- `install(): void` — adds DOM listeners, preventDefault on arrows/space/shift

### `render/canvas.ts`
- `init(canvas: HTMLCanvasElement): void`
- `beginFrame(): void` — clears, sets transform
- `strokePath(pts: Point[], color: string): void`
- `strokeCircle(x, y, r, color): void`
- `strokeDashedCircle(x, y, r, color, dash): void` — for the gravity influence ring
- `text(s, x, y, color, size): void`

All `stroke*` calls batch internally by color; flushed at `endFrame()` if we want max perf. For MVP we can draw imperatively and profile later.

### `audio/sfx.ts`
- `init(): Promise<void>` — called on first user gesture per FR-11.4, handles Safari unlock
- `play(name: SfxName): void` — where `SfxName = 'shoot' | 'thrust' | 'bang_large' | 'bang_medium' | 'bang_small' | 'fighter_shot' | 'fighter_bang' | 'ship_bang' | 'hyperspace_in' | 'hyperspace_out' | 'beacon_placed'` (beacon reserved for v2+ but trivial to ship now)
- `setMuted(muted: boolean): void`

### `persist.ts`
- `load(): Saved` — returns default on missing/corrupted
- `save(s: Saved): void` — silent on failure
- `addHighScore(initials, score): Saved` — returns updated state, top-10 clamp

### `config.ts` (all tunable constants in ONE file)
```ts
export const SHIP_ROTATION_SPEED = 4.0;  // rad/sec
export const SHIP_THRUST_ACCEL = 200;
export const SHIP_MAX_SPEED = 400;
export const SHIP_FRICTION = 0.0;        // pure Newtonian
export const BULLET_SPEED = 600;
export const BULLET_LIFE = 1.0;
export const SHIP_FIRE_COOLDOWN = 0.2;
export const HYPERSPACE_COOLDOWN = 3.0;
export const HYPERSPACE_DEATH_RISK = 0.10;
export const RESPAWN_INVULN = 2.0;

export const BH_G = 1000;
export const BH_R_MIN = 30;
export const BH_R_MAX_INFLUENCE = 400;

export const ASTEROID_SPAWN_INTERVAL = 4.0;
export const ASTEROID_MAX = 12;

export const FIGHTER_SPAWN_INTERVAL = 8.0;
export const FIGHTER_MAX = 3;

export const ONBOARDING_GRACE_SEC = 25;

export const PLAYFIELD_W = 1280;
export const PLAYFIELD_H = 720;

export const PALETTE = {
  ship: '#ff2fcf',       // hot pink
  bullet: '#fffbe6',     // warm white
  asteroid: '#65ffe0',   // cyan
  fighter: '#ffb347',    // amber
  blackhole: '#a661ff',  // magenta
  ring: '#6d3fb3',       // dim magenta for influence ring
  particle: '#fffbe6',
  hud: '#65ffe0',
  bg: '#000000',
};
```

Tuning happens in this file and only this file. Do not spread magic numbers through the code.

## Component Designs

### Ship controller

Per tick, in order:

1. Read input keys.
2. Apply rotation: `rot += (leftDown ? -1 : 0 + rightDown ? 1 : 0) * SHIP_ROTATION_SPEED * dt`.
3. If `thrustDown && !dead`: apply thrust acceleration in facing direction. Spawn a thrust particle.
4. If `fireDown && fireCooldown <= 0`: spawn bullet; reset cooldown. Play shoot SFX.
5. If `hyperspaceDown && hyperspaceCooldown <= 0`: teleport to random position; reset cooldown; set `invulnUntil`; 10% chance: mark destroyed. Play hyperspace SFX.
6. Cooldowns tick down.
7. Velocity Verlet integration applies (in `physics.ts`).
8. Clamp to max speed (soft cap via scalar norm, not axis-aligned).
9. Wrap via `wrapPlayfield`.

### Asteroid system

- At run start: spawn `ASTEROID_MAX` large asteroids at random positions with ≥ 300 px distance from ship.
- Periodically (each `ASTEROID_SPAWN_INTERVAL` seconds during `phase === 'active'`): if total < `ASTEROID_MAX`, spawn a new large at an edge with inward velocity.
- No asteroid spawn during `onboarding`.
- On destruction: tier `large` → spawn 2 `medium` at destruction point with random outward velocities; `medium` → 2 `small`; `small` → particles only.

### Collision resolution

Per tick, after physics:

1. Bullet vs Asteroid: asteroid splits, bullet consumed, score +=, SFX.
2. Bullet vs Fighter: fighter dies, bullet consumed, score +=, SFX.
3. Ship vs Asteroid: ship destroyed (unless invuln), asteroid splits.
4. Ship vs Fighter: both destroyed (unless ship invuln → fighter dies, ship survives).
5. Ship vs Fighter bullet: ship destroyed (unless invuln).
6. Ship vs BlackHole event horizon: ship destroyed (invuln does NOT protect, per E-1).
7. Asteroid vs BlackHole event horizon: asteroid consumed (no split).
8. Fighter vs Asteroid: both destroyed (E-6).
9. Bullet vs BlackHole event horizon: bullet consumed.

Edge cases from the spec (E-1 through E-14) are unit-tested.

### BlackHole renderer

- Central filled black disc (radius = `eventHorizonR`, fully opaque — invisible against bg, creates the "hole").
- Vector ring 1: solid magenta at `eventHorizonR + 4`, subtle animated dash.
- Vector ring 2: rotating radial spokes (8 spokes, rotate at 0.5 rad/s, animate `ringPhase`).
- Vector ring 3 (FR-6.7 fairness ring): dashed dim magenta at `influenceR`. Low opacity (via `globalAlpha`), always visible. Non-negotiable.

### HUD

- Top left: current score, live-digit vector glyphs (or Press Start 2P web font).
- Top right: lives, rendered as 3 small ship silhouettes (same poly as the real ship, scaled 0.5, greyed for lost lives).
- Bottom center (in onboarding): fading "DRIFT TEST" label for first ~20 sec of first-ever run.
- Everything respects `PALETTE.hud` color.

### Title & Game Over screens

Plain `render()` pass when state is `TITLE` / `GAME_OVER`. Vector-style text only. Space key advances. Game Over detects new high score and transitions to `INITIALS_ENTRY` state.

## Integration Points

None external. This is a self-contained browser page.

- **Deployment targets:**
  - itch.io: ZIP the `dist/` folder (index.html + bundle.js + optional font), upload.
  - Own domain: `rsync dist/ user@host:/var/www/spacenerds` or Cloudflare Pages from GitHub.
- **Browser integration:**
  - Fullscreen API: optional "F for fullscreen" binding, not required for MVP.
  - Page Visibility API: auto-pause on blur (E-8).
  - Web Audio API: unlock on first user gesture (OQ-10 / E-11).

## Security Considerations

- **No user-generated content**, no accounts, no backend → no injection surface.
- **localStorage values are trusted** only for local display; high-score tampering is a non-issue for a single-player arcade game.
- **Content Security Policy** meta tag: strict — `default-src 'self'; script-src 'self'; style-src 'self'` (plus Google Fonts if we use a web font).
- **No third-party scripts, no analytics, no telemetry** (matches B-5 and A-5).

## Performance Targets

From the spec NFRs and research brief guidance:

| Metric | Target | How we verify |
|---|---|---|
| Frame rate | 60 FPS sustained | FPS counter dev-only overlay; `performance.now()` delta logging in Chrome DevTools |
| Entity count | ≤ 150 concurrent | Capped by spawn caps; asserted in debug build |
| Per-frame tick cost | ≤ 8 ms on M1 MBP | Chrome DevTools Performance tab |
| Per-frame render cost | ≤ 8 ms on M1 MBP | Same |
| Bundle size (gzipped) | ≤ 500 KB total | `du -sh dist/`, automated in CI |
| Cold page load (broadband) | ≤ 2 s first meaningful paint | Chrome Lighthouse |
| Input-to-visible latency | ≤ 16 ms (1 frame) | Manual visual test with high-FPS recording |

Performance budget sheet kept as a row in the Task Breakdown's "Playtest & Tuning" task.

## Testing Strategy

**Coverage target: 80% of physics, collision, scoring, and persistence modules.** UI and render code are deliberately lightly tested.

### Unit tests (Vitest)

- **Physics:** Verlet integration correctness (dropping ball under constant force matches closed-form solution to 4 decimal places over 5 seconds). Conservation (no unexplained energy gain in gravity-well test over 10 seconds, drift < 5%).
- **Collision:** Circle-circle detection correctness (overlapping, touching, just-separated). Pair ordering irrelevance.
- **Asteroid split:** Large → 2 medium; medium → 2 small; small → 0. Positions inherit parent + jitter; velocities outward.
- **Scoring:** Each entity-destruction type awards the correct value. No double-awards on simultaneous collisions (E-13).
- **Lives lifecycle:** Start = 3, decrement on death, respawn with invuln until lives = 0 → transition to GAME_OVER.
- **Persistence:** High-score list maintains top-10, rejects duplicates correctly (or allows, TBD), survives round-trip JSON, degrades silently on quota exceeded (E-9).
- **Hyperspace:** Cooldown prevents spam. 10% death rate holds in expectation over 10k samples with fixed seed.

### Integration tests

- **Run lifecycle:** Start at TITLE → transition to PLAY on SPACE → simulate 10 ship deaths → assert GAME_OVER reached. Mock time.
- **Onboarding:** First 25 sec of PLAY have zero fighter or asteroid spawns beyond the initial set.
- **Edge cases E-1 through E-14:** each has a dedicated test.

### Manual playtest (Phase 3 pass)

Feel-tuning pass for:
- Ship handling (is Newtonian fair?)
- Gravity well readability (can the player tell where the influence ring is?)
- Asteroid density (too crowded? too sparse?)
- Fighter aggression (is 1 fighter at a time right?)
- Score curve (is the 3-7 min run length target met?)
- Aesthetic coherence (does it FEEL 1980s?)

## Deployment Strategy

1. `npm run build` → `dist/` with hashed filenames.
2. Push `dist/` to a GitHub repo with GitHub Pages enabled OR upload ZIP to itch.io (both; they're independent).
3. Own-domain mirror: either GitHub Pages with CNAME, or Cloudflare Pages project auto-building from the repo.
4. **No backend**, **no CI/CD beyond the build step** for MVP. A simple GitHub Action on push to `main` that runs `npm test && npm run build && upload artifact` is the only automation worth setting up.

## Open Questions Deferred to Phase 3

- **Exact tuning values** for every constant in `config.ts` — all are starter values, all tuned in playtest.
- **Web font vs runtime-drawn glyphs** for score digits — decide at Task 18 (HUD) based on feel.
- **Thrust trail look** — line-segments vs dot particles vs triangle fragments.
- **Optional title-screen drone audio** — ship or cut based on Week 2 budget.
- **Screen shake magnitudes** — start at 0, add if something feels weightless.

## References

- Parent: [[product-spec]]
- Research: [[research-brief]]
- Methodology: [[The Cascade]]
- ADRs: `docs/adr/` (ADR-001 through ADR-007)
- Task Breakdown: `specs/task-breakdown.md`
