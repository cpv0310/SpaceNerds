---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-005 for SpaceNerds: lock the entity model (plain objects vs ECS vs inheritance)."
---

# ADR-005: Entity Model — Plain Objects in Per-Kind Arrays

## Context

SpaceNerds simulates at most ~150 entities (ship, asteroids, bullets, fighters, black hole, particles). Each has position, velocity, rotation, and a small kind-specific state bag.

Options:

- **Plain objects in flat arrays (one pool per kind)** — `asteroids: Asteroid[]`, `bullets: Bullet[]`. Entities are typed TypeScript interfaces. Iteration is a `for` loop.
- **Entity-Component-System (ECS)** — entities are just IDs; components stored in separate typed arrays (SoA); systems iterate over relevant components. High throughput. Libraries: bitecs, miniplex.
- **Class inheritance** — `class Entity { ... } class Asteroid extends Entity { ... }`. Traditional OO.
- **Single flat array with discriminated union** — one `entities: Entity[]` where `Entity = Ship | Asteroid | Bullet | ...`. `switch (e.kind)` in hot paths.

Our workload: 60 Hz tick, ≤ 150 entities, ~8 systems (physics, collision, asteroid spawn, fighter AI, black hole gravity, bullet expire, particle fade, render).

## Decision

**Plain TypeScript objects in per-kind arrays.**

- One array per entity kind (asteroids, bullets, fighters, particles, the single ship, the single black hole).
- Each object is a plain TS object conforming to its interface.
- Systems iterate the arrays directly in `for` loops.
- Despawn by setting `alive = false` and compacting once per tick (O(n) sweep).

## Consequences

**Easier:**
- TypeScript's type narrowing works: `for (const a of asteroids) { a.tier; }` — no `switch` or `instanceof`.
- Claude reads and writes this style fluently. Zero ceremony.
- No framework to learn; no library version to update; no abstraction tax.
- The codebase stays under ~1500 lines, fully holdable in Claude's context.
- Profile-then-optimize is trivial because the data path is explicit.

**Harder:**
- Cross-kind iteration (e.g., "all things subject to gravity") requires writing a union iterator. Trivial: `function* allEntities() { yield ship; for (const a of asteroids) yield a; ... }`.
- If we ever scale past 1000 entities, an ECS becomes worthwhile. For MVP and v2+, we are nowhere near this.

**Trade-offs accepted:**
- We lose the theoretical cache-efficiency of SoA layout. At 150 entities, this is noise.
- We lose the "composable component" pattern. At our scope, every entity has known structure; composition would be premature abstraction.

## Alternatives rejected

| Option | Reason rejected |
|---|---|
| ECS (bitecs, miniplex) | Overhead unjustified at n ≤ 150; adds learning + bundle cost; obscures data flow for Claude. |
| Class inheritance | Constructor dance, `this` binding risk, works against data-oriented thinking. |
| Single flat array + discriminated union | Every hot loop needs a `switch`; type narrowing is less ergonomic than per-kind arrays; not cache-friendly either. |

## References

- [Data-Oriented Design](https://www.dataorienteddesign.com/dodbook/) (for intuition, not adopted as dogma)
- Research Brief § Technical Patterns / Entity model
