---
type: design-decisions
date: 2026-04-20
project: SpaceNerds
status: final
prompt: "Canonical record of the Phase 2 /grill-me exit-gate interview for SpaceNerds MVP. 18 design decisions resolving gaps, ambiguities, and unstated assumptions in the Technical Design, ADRs, and Task Breakdown. Each decision shows the question, the resolution, and (where applicable) amended code or interface. This document is authoritative; where it contradicts earlier drafts of TD/ADRs/Task Breakdown, this document wins until those are amended in place."
tags: [cascade, phase-2, grill-me, design-decisions, spacenerds]
related:
  - "[[product-spec]]"
  - "[[technical-design]]"
  - "[[task-breakdown]]"
---

# SpaceNerds — Phase 2 grill-me Decisions

Canonical record of the 18 design decisions resolved during the Phase 2 `/grill-me` interview (2026-04-20). These decisions are **amendments to the Technical Design, ADRs, and Task Breakdown** and take precedence over any earlier draft language.

## D1. Code repo location and hosting

- **Repo:** `github.com/cpv0310/SpaceNerds` (public).
- **On-disk:** `~/Documents/Code/SpaceNerds/` (outside the Obsidian vault; vault links to it by path).
- **First commit:** `README.md + LICENSE + .gitignore` — before Task 1 begins.
- **CI/CD:** GitHub Actions `deploy.yml` added in Task 1; publishes to GitHub Pages (see D16).

## D2. CoreEntity: ax_prev / ay_prev added; mass retracted

Original spec proposed adding `mass` to `CoreEntity`. **Retracted.** In Newtonian gravity, the target body's mass cancels out of the acceleration calculation (equivalence principle). Keeping `mass` and then dividing it out in integration is two multiplications for zero effect.

Amended `CoreEntity`:

```ts
interface CoreEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax_prev: number;   // Verlet: previous-frame acceleration
  ay_prev: number;
  rot: number;
  radius: number;
  alive: boolean;
  age: number;
  // NO mass field
}
```

At spawn, `ax_prev = ay_prev = 0`. First Verlet step degrades to Euler for one tick (negligible error).

## D3. Gravity API: `gravityAccel` (acceleration, not force)

ADR-003 originally showed a `gravityForce` function returning force. **Amended** to `gravityAccel` returning acceleration directly:

```ts
export function gravityAccel(
  ex: number, ey: number,
  bh: BlackHole
): [number, number] {
  const dx = bh.x - ex;
  const dy = bh.y - ey;
  const r2 = dx * dx + dy * dy;
  const rMax2 = bh.influenceR * bh.influenceR;
  if (r2 > rMax2) return [0, 0];
  const rMin2 = bh.eventHorizonR * bh.eventHorizonR;
  const rEff2 = Math.max(r2, rMin2);
  const r = Math.sqrt(r2);
  if (r < 1e-6) return [0, 0];
  const mag = bh.G / rEff2;   // no emass term
  return [(dx / r) * mag, (dy / r) * mag];
}
```

Thrust is likewise defined in **acceleration units** (`SHIP_THRUST_ACCEL = 200 px/s²`), not force. This keeps the physics consistent and mass-free.

## D4. Collision radii — canonical table

Committed to `config.ts` as named constants:

| Entity | Radius (px) | Constant |
|---|---|---|
| Ship | 10 | `SHIP_RADIUS` |
| Bullet | 2 | `BULLET_RADIUS` |
| Fighter | 12 | `FIGHTER_RADIUS` |
| Asteroid large | 40 | `ASTEROID_R_LARGE` |
| Asteroid medium | 24 | `ASTEROID_R_MEDIUM` |
| Asteroid small | 12 | `ASTEROID_R_SMALL` |
| Black hole — event horizon | 30 | `BH_R_MIN` |
| Black hole — influence | 400 | `BH_R_MAX_INFLUENCE` |
| Particle | 0 (no collision) | — |

Starter values. Tuned in Phase 3 Task 20.

## D5. Canvas viewport, DPI, line width, min-size

**Viewport:** fit-to-window preserving 16:9 aspect; letterbox or pillarbox with pure-black bars. Game code draws in logical 1280×720.

**DPI:** backing store sized to `cssSize × devicePixelRatio`; context transform scales logical→physical. Crisp on retina and 4K.

**Line width:** `1.5` logical pixels. Round caps/joins.

**Minimum window:** 1024 × 576 (= 720 × 16/9). Below either threshold, overlay "**RESIZE WINDOW TO CONTINUE**" in HUD color; pause physics; resume on resize above threshold.

Implementation (single `resize()` function from the grill-me answer, lives in `render/canvas.ts`):

```ts
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const gameAspect = PLAYFIELD_W / PLAYFIELD_H;
  let cssW, cssH;
  if (window.innerWidth / window.innerHeight > gameAspect) {
    cssH = window.innerHeight;
    cssW = cssH * gameAspect;
  } else {
    cssW = window.innerWidth;
    cssH = cssW / gameAspect;
  }
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const scale = canvas.width / PLAYFIELD_W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
```

## D6. Max-speed clamp: magnitude-scale post-integration

After the Velocity Verlet step, and only for ship and fighter:

```ts
const speed2 = e.vx * e.vx + e.vy * e.vy;
const max2 = MAX_SPEED * MAX_SPEED;
if (speed2 > max2) {
  const scale = MAX_SPEED / Math.sqrt(speed2);
  e.vx *= scale;
  e.vy *= scale;
}
```

Applied in all regimes (thrust + gravity). Not applied to asteroids, bullets, or particles.

## D7. Gravity applies to all non-cosmetic entities

Gravity acceleration (D3) is added to the force accumulator for every entity with `kind ∈ {ship, fighter, asteroid, bullet}`. Particles never. Black hole stationary (doesn't feel itself).

## D8. Input conflict resolution: opposing keys cancel

Rotation (and any opposing-direction inputs) computed as:

```ts
const turn = (isDown('ArrowRight') || isDown('KeyD') ? 1 : 0)
           - (isDown('ArrowLeft')  || isDown('KeyA') ? 1 : 0);
```

Neutral when both sides are held. Same pattern for any future opposing axes.

## D9. Audio unlock UX: silent on first SPACE

`AudioContext` created lazily on the first qualifying user gesture (typically the SPACE press that transitions TITLE → PLAY). SFX buffers generated during that transition.

On failure: set `audioEnabled = false`, render small muted-speaker icon in corner, run silently with no error dialog.

Mute state (toggled via M) honored regardless; when muted, `play()` is a no-op.

## D10. Thrust continuous-loop: raw oscillator + gain

Thrust SFX uses a dedicated code path (not jsfxr):

```ts
// On thrust start:
const osc = ctx.createOscillator();
osc.type = 'sawtooth';
osc.frequency.value = 85;
const gain = ctx.createGain();
gain.gain.value = 0;
osc.connect(gain).connect(masterGain);
osc.start();
gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);

// On thrust end:
gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
setTimeout(() => osc.stop(), 100);
```

Fallback: if tuning eats more than 2 hours in Task 17, swap to a looped AudioBuffer. All 9 other SFX stay on jsfxr.

## D11. Collision separation of concerns + canonical tick order

**`engine/collision.ts` is pure detection.** No side effects. Returns `Collision[]` pairs with kind-sorted ordering. Unit-testable as pure function.

**`game.ts` resolves collisions** — state changes, SFX triggers, particle spawns, score updates.

**Canonical 11-step tick order:**

```ts
function tick(dt: number) {
  input.captureFrame();                       // 1
  ship.control(dt);                           // 2
  for (const f of fighters) fighter.control(f, ship, dt);  // 3
  physics.applyGravity(entities, blackHole);  // 4
  physics.integrate(entities, dt);            // 5 — Verlet
  physics.postStep(entities, dt);             // 6 — max-speed clamp, wrap, age++
  const pairs = collision.detect(entities);   // 7
  for (const p of pairs) game.resolveCollision(p);  // 8
  entities.compact();                         // 9
  game.updateTimers(dt);                      // 10
  game.updatePhase(dt);                       // 11 — onboarding, spawners
}
```

## D12. State machine edge transitions

- **INITIALS_ENTRY:** ESC commits the initials as `"AAA"` and transitions to TITLE. Classic arcade default. Player's high score is still recorded.
- **PAUSED:** No quit-to-title path. Only ESC resumes. A run ends only on death. Revisit in v2+ if playtest shows frustration.

## D13. Task Breakdown: 18 ↔ 19 swap

Task 19 (persistence) was a dependency of Task 18 (screens). **Swap:** persistence becomes Task 18; screens becomes Task 19. Dependency order now flows correctly.

Amended sequence (Tasks 1-17 unchanged):
- **Task 18: localStorage persistence** (old Task 19)
- **Task 19: Title / Game Over / Initials screens** (old Task 18)
- **Task 20: Playtest + tuning** (unchanged)
- **Task 21: Deploy** (unchanged)

## D14. Testing: mocked Canvas ctx + mulberry32 PRNG

**Render tests** use a Proxy-mocked `CanvasRenderingContext2D` in Vitest; assertions target the sequence and args of method calls. No jsdom weirdness, no Playwright at MVP.

**PRNG** centralized in `src/rand.ts` (mulberry32 — small, fast, seedable). Production runs unseeded (`Date.now()`); tests pin a seed via `setSeed(42)`.

```ts
// src/rand.ts
let seed = Date.now();
export function setSeed(s: number) { seed = s; }
export function rand(): number {
  let t = (seed = (seed + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function randRange(min: number, max: number) { return min + rand() * (max - min); }
```

All `Math.random()` in game code replaced with `rand()`.

## D15. Aesthetic trip-wire: build-time lint

`package.json`:

```json
"scripts": {
  "check:aesthetic": "node scripts/check-aesthetic.mjs",
  "build": "npm run check:aesthetic && vite build"
}
```

`scripts/check-aesthetic.mjs` walks `src/` and `dist/` and fails the build if any file matches:
- Image extensions: `.png .jpg .jpeg .gif .webp .bmp .ico .svg`
- Audio extensions: `.mp3 .ogg .wav .m4a .flac .aac`
- CSS with `filter:` (blur, brightness, drop-shadow), `box-shadow:`, or `backdrop-filter:`

Build hard-fails with `aesthetic pillar violated: <file>: <reason>`.

**Process companion — added to code repo's CLAUDE.md:**

> If a feature requires crossing an aesthetic boundary (B-1 through B-3) to ship, cut the feature, don't cross the boundary. No exceptions.

## D16. Volume policy: mute-only

No slider. `M` key toggles mute. State persisted in `localStorage` as `Saved.muted`. Muted-speaker icon in corner reflects state.

## D17. Task-overrun pivot: 1.5× rule

Each task is budgeted ~1 evening session. **At 1.5 sessions without meeting acceptance criteria, STOP and replan.** Replan options in priority order:

1. Cut the task's scope to "minimum viable for dependent tasks."
2. Cut a later optional task (onboarding label polish, title-screen drone, thrust-trail polish, bonus-life milestones).
3. Defer the entire task to v2+ (only if not a dependency of MVP-critical tasks — Task 16 Onboarding is the only such candidate).
4. **NEVER push the ship date.**

When the rule fires: append `OVERRAN: <why> → <replan decision>` to the task's Notes field. Surfaces in Phase 5 Compound.

## D18. Minor defaults batch

- **Node version:** 20 LTS, pinned in `package.json` `engines`.
- **Menu font:** Press Start 2P via Google Fonts (single 14KB woff2, SIL OFL).
- **Score digits:** hand-drawn 7-segment vector glyphs, not from the font. One-time ~1h asset.
- **`justPressed` buffer on entering PAUSED:** cleared. Keys pressed during pause do not fire on resume.
- **Thrust vector direction:** ship-local nose (+x in local frame, rotated by `rot`).

## Deferred (not blockers)

- **Deployment specifics (D16 in interview):** concrete itch.io account creation and custom domain configuration moved to Task 21 planning. MVP default is GitHub Pages at `cpv0310.github.io/SpaceNerds` + ZIP upload to an itch.io account created before Task 21.

## Amendment Summary

Documents to amend in place (Claude will do these after grill-me close):

- **`docs/technical-design.md`** — update `CoreEntity` interface (D2), tick order section (D11), add resize code (D5), max-speed clamp (D6), gravity application policy (D7), font strategy (D18).
- **`docs/adr/ADR-003-gravity-model.md`** — rename `gravityForce` → `gravityAccel`; drop `emass`.
- **`specs/task-breakdown.md`** — swap Task 18 ↔ Task 19.
- **`specs/product-spec.md`** — no changes; all decisions are technical, not product-level.

This document (`grill-me-decisions.md`) is authoritative for any point where the source docs lag.

## Exit

Phase 2 `/grill-me` exit gate **passed**. Design is complete. Shared understanding reached. Ready for Phase 3 — Implementation.
