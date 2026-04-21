---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-003 for SpaceNerds: lock the gravity-well force model for the black hole."
---

# ADR-003: Gravity Model — Capped-Radius Inverse-Square

## Context

The MVP black hole (FR-6) pulls objects toward itself with a force that increases as distance decreases. Raw Newtonian gravity `F = G·m₁·m₂ / r²` has a well-known numerical problem: as `r → 0`, `F → ∞`, which crashes the simulation (entities can fly through each other in a single tick when the force term overwhelms `dt`).

Options:

- **Raw Newtonian (uncapped)** — physically real; numerically unsafe near singularities.
- **Capped-radius inverse-square:** `r_eff² = max(r², r_min²)`; compute force from `r_eff`. Equivalent to treating the well as a finite sphere. Simple, numerically stable, arcade-appropriate.
- **Plummer softening:** `F = G·m / (r² + ε²)`. Smooths singularity with one extra add. Used in astrophysical N-body sims.
- **Capped linear-gradient:** Force is linear in distance, zero above max-radius. Arcade-feeling but physically wrong (produces ellipses that are NOT Keplerian).
- **Custom piecewise curves** — infinite variation, tuned for "feel."

Per Research Brief § Gravity Well Model, and [PC Gamer — How to build a black hole](https://www.pcgamer.com/how-to-build-a-black-hole/), capped-radius inverse-square is the standard practical choice for games of this scale.

## Decision

**Capped-radius inverse-square with hard zero beyond `r_max_influence`.**

```
r_eff² = max(r², r_min²)
|F| = G · m / r_eff²             if r ≤ r_max_influence
|F| = 0                           if r > r_max_influence
```

Force direction: unit vector from entity to black-hole center.

Starter constants (to be tuned in Phase 3):
- `G = 1000`
- `r_min = 30 px` (also the event horizon — crossing `r_min` destroys the entity)
- `r_max_influence = 400 px` (a visible dashed ring at this radius is the fairness cue per FR-6.7)

## Consequences

**Easier:**
- Numerically stable under any `dt` and any approach velocity.
- One-line clamp that matches physical intuition ("the hole has a finite-size event horizon").
- Influence radius provides a natural cut-off so objects far from the hole aren't subtly dragged around the whole screen.
- Event horizon doubles as the lethal boundary — one constant serves two purposes.

**Harder:**
- The `r_max_influence` cliff can create a "gradient pop" when an entity crosses the boundary. Mitigate by either a short feathering region (drop off linearly over the last 50 px) OR by accepting the pop since the influence is visible (the dashed ring = the line the player expects).

**Trade-offs accepted:**
- We lose a bit of physical realism (a true black hole has no outer cut-off radius — its gravity is infinite in reach). This is arcade, not an astrophysics sim. The cut-off is a feature: it makes the ring-of-influence readable.
- We do not pursue Plummer softening because capped-radius is simpler to reason about and gives the same numerical benefit.

## Implementation note

**Amended post-grill-me (see [[grill-me-decisions]] D3):** returns **acceleration**, not force. The target entity's mass cancels out of Newtonian gravity's acceleration (equivalence principle), so there's no reason to compute force and then divide by mass later. Mass field dropped from `CoreEntity`.

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
  // Guard against r === 0 (entity exactly at center — vanishingly unlikely).
  if (r < 1e-6) return [0, 0];
  const mag = bh.G / rEff2;    // acceleration magnitude — no mass term
  return [(dx / r) * mag, (dy / r) * mag];
}
```

Caller adds these acceleration components to the entity's accumulator before the Verlet integration step.

## Alternatives rejected

| Option | Reason rejected |
|---|---|
| Raw inverse-square | Numerically unstable near the singularity. |
| Plummer softening | Equivalent benefit, slightly more opaque to tune. We prefer the explicit `r_min` cap because it doubles as the event horizon. |
| Capped linear gradient | Produces non-Keplerian orbits; no slingshot effect; feels "cheap." |

## References

- [PC Gamer — How to build a black hole](https://www.pcgamer.com/how-to-build-a-black-hole/)
- Research Brief § Technical Patterns / Gravity well model
- Gravitar (1982) commercial failure as fairness case study — Research Brief § Competitive Landscape
