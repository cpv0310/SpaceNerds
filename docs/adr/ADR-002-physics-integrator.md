---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-002 for SpaceNerds: lock the numerical integrator for Newtonian physics (ship + gravity well)."
---

# ADR-002: Physics Integrator — Velocity Verlet

## Context

SpaceNerds has Newtonian ship physics with a gravity-well black hole. The ship can thrust into or near the black hole's gravity field, which is a classic stiff-ish dynamical system.

Integrator options:

- **Explicit Euler** — simplest, `v += a·dt; x += v·dt`. Non-symplectic; energy drifts upward in orbital / gravity-well systems. Ship spirals out to infinity or detonates into the well.
- **Semi-implicit (symplectic) Euler** — one line change from explicit Euler: update velocity first, then position. Symplectic; energy is bounded. Standard choice for 2D games.
- **Velocity Verlet** — `x += v·dt + 0.5·a·dt²; v += 0.5·(a_old + a_new)·dt`. Second-order accurate, symplectic, cheap.
- **Runge-Kutta 4 (RK4)** — fourth-order accurate, four force evaluations per step, non-symplectic (energy can still drift in long-running systems).

Per the Research Brief's physics section and [Gaffer On Games — Integration Basics](https://gafferongames.com/post/integration_basics/), plain Euler diverges within seconds of thrust-into-well; symplectic methods are the only correct family for orbital / gravity-well dynamics.

## Decision

**Velocity Verlet, applied globally to all entities with linear motion.**

The code delta from semi-implicit Euler is ~4 lines. Verlet's slightly better accuracy comes free, and it's the textbook integrator for Newtonian systems.

## Consequences

**Easier:**
- Physics is stable under any combination of thrust + gravity. No surprise spiral-out, no explosion-into-well, no energy drift.
- Black hole gravity is fun to slingshot past (Gravitar-style) instead of frustrating.
- Deterministic given a fixed timestep, which unlocks the `Vitest` unit test strategy for physics.

**Harder:**
- Verlet requires storing the previous-frame acceleration. Adds a single `ax_prev, ay_prev` pair to each entity. Trivial.
- Friction / drag is slightly less obvious to implement in Verlet (needs to be folded into the acceleration function, not applied as a multiplicative decay to velocity). For SpaceNerds this is fine because `SHIP_FRICTION = 0` by default.

**Trade-offs accepted:**
- We accept ~4 extra lines of code per entity update vs plain Euler, in exchange for eliminating a known-divergence failure mode.
- We do not pursue RK4 because (a) it's not symplectic and thus not energy-conserving over long windows; (b) 4 force evaluations per step is overkill for arcade physics; (c) the accuracy gain is invisible at 60Hz ticks.

## Implementation note

```ts
// Per entity per tick:
const ax_new = forceX(e) / e.mass;
const ay_new = forceY(e) / e.mass;
e.x += e.vx * dt + 0.5 * e.ax_prev * dt * dt;
e.y += e.vy * dt + 0.5 * e.ay_prev * dt * dt;
e.vx += 0.5 * (e.ax_prev + ax_new) * dt;
e.vy += 0.5 * (e.ay_prev + ay_new) * dt;
e.ax_prev = ax_new;
e.ay_prev = ay_new;
```

For entities that experience no net force beyond instantaneous impulses (bullets), degenerate case reduces to `x += v·dt` — still correct.

## References

- [Gaffer On Games — Integration Basics](https://gafferongames.com/post/integration_basics/)
- [Codeflow — Integration by example: Euler vs Verlet vs Runge-Kutta](http://codeflow.org/entries/2010/aug/28/integration-by-example-euler-vs-verlet-vs-runge-kutta/)
- [Kahrstrom — Euler vs Verlet](https://kahrstrom.com/gamephysics/2011/08/03/euler-vs-verlet/)
- Research Brief § Technical Patterns / Physics
