---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-007 for SpaceNerds: lock the game loop timing model (fixed-timestep simulation vs variable-timestep)."
---

# ADR-007: Game Loop — Fixed-Timestep Simulation with Interpolated Rendering

## Context

The game loop drives simulation and rendering. Two shape classes:

- **Variable-timestep** — each frame ticks the simulation by the actual elapsed `dt`. Simple. Physics becomes non-deterministic (behavior depends on frame rate) and can misbehave at very long or very short frames.
- **Fixed-timestep with interpolation** — simulation runs at a fixed rate (e.g. 60 Hz). If the render frame is longer, multiple sim ticks happen between renders. If shorter, the render interpolates between the last two sim states. Deterministic, stable, standard in "real" games.

Per the [Gaffer On Games canonical write-up](https://gafferongames.com/post/integration_basics/), fixed-timestep is the correct answer for any game with non-trivial physics.

## Decision

**Fixed-timestep simulation at 60 Hz with interpolated rendering.**

```ts
const TICK_HZ = 60;
const TICK_MS = 1000 / TICK_HZ;
let acc = 0;
let lastT = performance.now();

function frame(nowT: number) {
  let dt = nowT - lastT;
  lastT = nowT;
  if (dt > 250) dt = 250;  // tab-blur-resume clamp
  acc += dt;

  while (acc >= TICK_MS) {
    tick(TICK_MS / 1000);
    acc -= TICK_MS;
  }

  const alpha = acc / TICK_MS;
  render(alpha);

  requestAnimationFrame(frame);
}
```

## Consequences

**Easier:**
- Physics is deterministic. Given a seed, a run is replayable frame-for-frame.
- Unit tests for physics are meaningful — assertions hold across runs.
- Behavior does not degrade on low-end machines; frame drops merely make rendering choppier, not physics broken.
- Long tab-blur periods (E-8) are clamped and don't produce 30-second physics "catch-up" storms.

**Harder:**
- The render pass needs to interpolate between the last two sim states for smooth visuals when sim rate != render rate. For SpaceNerds, since we render at vsync (≤ 60 Hz) and sim at 60 Hz, the interpolation is almost always a no-op. We still write it correctly so that on high-refresh-rate monitors (144 Hz, 240 Hz) the game reads as smooth.
- Slightly more code than variable-timestep.

**Trade-offs accepted:**
- We accept the ~50 lines of loop bookkeeping for determinism and stability.
- We do not run the sim faster than render rate (e.g. 120 Hz sim). 60 Hz matches vsync for the vast majority of displays and saves CPU.

## Edge behaviors covered by this ADR

- **E-7 (pause):** Pause sets a flag; the loop skips the `while (acc >= TICK_MS)` block. Render still runs (so the paused state is drawn). Acc does not grow while paused (we update `lastT` in the frame regardless).
- **E-8 (tab blur):** Page Visibility API listener. On blur, set paused=true and clamp `acc = 0`. On focus, set `lastT = performance.now()`, unpause not automatic — player presses key.

## References

- [Gaffer On Games — Integration Basics / Fix Your Timestep](https://gafferongames.com/post/integration_basics/)
- Research Brief § Technical Patterns / Game loop
