---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-001 for SpaceNerds: lock the engine/rendering choice between LittleJS, raw Canvas 2D, PixiJS, Phaser, Godot HTML5, and Kaplay."
---

# ADR-001: Engine Choice — LittleJS (primary), raw Canvas 2D (fallback)

## Context

SpaceNerds is a 2-week web-only MVP: totally-vector graphics, Newtonian physics, runtime-synthesized audio, keyboard-only. Engine options evaluated in the Research Brief:

- **LittleJS** (Frank Force, MIT) — ~20KB core, WebGL+Canvas hybrid, batteries-included, non-opinionated on art style.
- **Raw Canvas 2D + zero deps** — full control, smallest bundle, most Claude-friendly.
- **Phaser 3** — mature 2D framework, ~1.2MB, sprite/physics-opinionated.
- **PixiJS v8** — ~450KB WebGL 2D renderer, no game logic.
- **Godot HTML5 export** — full engine, 40MB WASM, ~5MB Brotli, 10+ sec cold load.
- **Kaplay / Kaboom.js** — beginner-friendly, bitmap-first.

Constraints that matter:
- itch.io cold-load budget (<2 sec first paint).
- Claude-assisted development (code-first, file-based, small codebase easier to hold in context).
- Totally vector — no bitmap sprite pipeline needed.
- 35 concurrent entities at MVP scale (no need for WebGL throughput).

## Decision

**Primary: LittleJS. Fallback: raw Canvas 2D with zero frameworks.**

Phase 3 Task 1 spikes LittleJS for 1-2 hours. If its input/sound/loop wrappers conflict with our structure, we drop to raw Canvas 2D and move on. No more than half a day is spent on this decision.

## Consequences

**Easier:**
- Bundle budget achievable with either path (both well under 500 KB).
- No asset pipeline — procedural geometry means no sprite sheets, no texture atlases, no loaders.
- Code-first development fits Claude's strengths.
- Migration to v2+ WebGL or physics-library is possible from either starting point.

**Harder:**
- LittleJS is single-author and less famous than Phaser — smaller community, fewer Stack Overflow hits. Mitigated by the codebase being small enough to read cover-to-cover in 2 hours.
- Raw Canvas 2D means writing our own `AudioContext` unlock handling, our own game-loop, our own input manager. Claude does this fluently but it's ~300 lines of scaffolding that LittleJS gives us free.

**Trade-offs accepted:**
- We accept that Phaser's scene system and rich tooling are wasted on a single-screen arcade game.
- We accept that PixiJS's WebGL speed is wasted at n=35 entities.
- We accept Godot's 10-sec cold-load penalty is disqualifying for a web-first itch.io drop.
- We accept Kaplay's bitmap-first opinion would fight our aesthetic every day.

## Alternatives rejected

| Option | Reason rejected |
|---|---|
| Phaser 3 | Too heavy, sprite-opinionated, scene/event system is friction at this scope. |
| PixiJS v8 | Renderer-only; we'd still write all game logic; paying 450KB for WebGL sugar unneeded at 35 entities. |
| Godot HTML5 | 40MB WASM + 10-sec cold-load kills itch.io first-click experience. Engine-first workflow fights code-first Claude-assisted dev. |
| Kaplay / Kaboom | Bitmap-first opinions push away from our pure line-art direction. |
| Bevy (Rust + WASM) | Glorious tool; 2-week timeline + itch.io + "Claude writes 80% of code" rules it out. |

## References

- [LittleJS](https://github.com/KilledByAPixel/LittleJS)
- [Frank Force — "LittleJS, the tiny JS game engine"](https://frankforce.com/littlejs-%F0%9F%9A%82-the-tiny-javascript-game-engine-that-can/)
- [Godot 4.3 web export progress](https://godotengine.org/article/progress-report-web-export-in-4-3/)
- Research Brief § Recommendation / Engine Pick
