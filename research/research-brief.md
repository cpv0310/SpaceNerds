---
type: research-brief
date: 2026-04-20
project: SpaceNerds
status: draft
prompt: "Phase 0 Cascade Research Brief for SpaceNerds — a web-only neon-vector arcade roguelike in the Asteroids lineage. 2-week MVP vertical slice (single-screen, ship + thrust/rotate/shoot/hyperspace, 3-tier asteroids, 1 black hole, 1 Ko-Dan Fighter, 3 lives + score, localStorage high score). Full v2+ game is 5×5 seamless-scroll playfield, wormhole pair, 5 enemy types, 25-cell purge win. Totally vector graphics (pure line art, neon palette, no bitmaps, no bloom), old-school synth SFX via Web Audio runtime synthesis (Carpenter/Tangerine Dream lineage — NOT modern synthwave). Investigate competitors (Nova Drift, Luftrausers, Gravitar, Star Control, Subspace, Cobalt Core), engine options (PixiJS, Phaser, raw Canvas, LittleJS, Kaplay, Godot HTML5), vector rendering strategy, Web Audio synthesis (jsfxr, Tone.js, raw AudioContext), gravity well physics (integrator choice, capped inverse-square), Newtonian ship tuning, and localStorage high-score UX. Produce Competitive Landscape, Prior Art, Technical Patterns, Key Insights (Aesthetic / Mechanics / Technical), and Recommendation with engine pick, top 3 risks, top 3 OSS refs."
tags: [cascade, phase-0, research, spacenerds, arcade-roguelike, vector-graphics, web-audio]
sources:
  - https://store.steampowered.com/app/858210/Nova_Drift/
  - https://rogueliker.com/nova-drift-review/
  - https://nichegamer.com/reviews/nova-drift-review/
  - https://goldplatedgames.com/2019/06/03/review-nova-drift/
  - https://www.pocketgamer.com/nova-drift/app-army-assemble/
  - https://indiegamereviewer.com/nova-drift-preview-an-updated-asteroids-homage-early-access/
  - https://thegemsbok.com/art-reviews-and-articles/mid-week-mission-luftrausers-vlambeer-review/
  - https://www.gamedeveloper.com/audio/q-a-why-vlambeer-returned-to-its-roots-with-i-luftrausers-i-
  - https://en.wikipedia.org/wiki/Gravitar
  - https://en.wikipedia.org/wiki/SubSpace_(video_game)
  - https://store.steampowered.com/app/352700/Subspace_Continuum/
  - https://en.wikipedia.org/wiki/Cobalt_Core
  - https://www.gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat
  - https://ledmeister.com/supmeler.htm
  - https://pixijs.com/
  - https://phaser.io/
  - https://github.com/KilledByAPixel/LittleJS
  - https://frankforce.com/littlejs-%F0%9F%9A%82-the-tiny-javascript-game-engine-that-can/
  - https://kaplayjs.com/
  - https://github.com/Shirajuki/js-game-rendering-benchmark
  - https://generalistprogrammer.com/comparisons/phaser-vs-pixijs
  - https://aircada.com/blog/pixijs-vs-phaser
  - https://godotengine.org/article/progress-report-web-export-in-4-3/
  - https://github.com/godotengine/godot/issues/68647
  - https://web.dev/articles/canvas-performance
  - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
  - https://mattdesl.svbtle.com/drawing-lines-is-hard
  - https://github.com/mhalber/Lines
  - https://sfxr.me/
  - https://github.com/chr15m/jsfxr
  - https://tonejs.github.io/
  - https://gafferongames.com/post/integration_basics/
  - http://codeflow.org/entries/2010/aug/28/integration-by-example-euler-vs-verlet-vs-runge-kutta/
  - https://kahrstrom.com/gamephysics/2011/08/03/euler-vs-verlet/
  - https://www.pcgamer.com/how-to-build-a-black-hole/
  - https://kidscancode.org/godot_recipes/4.x/physics/asteroids_physics/index.html
  - https://gist.github.com/11216544
  - https://github.com/gre/behind-asteroids
  - https://github.com/deathraygames/404-js13k-2020
  - https://gamedevjs.com/articles/using-local-storage-for-high-scores-and-game-progress/
  - https://www.factmag.com/2017/10/28/stranger-things-synths-plugins-techniques/
  - https://microchop.substack.com/p/samplers-synths-and-the-halloween
---

# Research Brief: SpaceNerds

## Research Question

**How do we ship a playable 2-week MVP of a totally-vector-graphics arcade roguelike — with zero-g Newtonian physics, runtime-synthesized old-school arcade audio, and a credible path to the full v2+ 5×5 sector game — on web-only infrastructure, using the engine, rendering strategy, and physics/audio primitives most likely to succeed under those constraints?**

Sub-questions:
1. What does Nova Drift (our closest competitor) do well and where can we differentiate?
2. Which of {PixiJS, Phaser, raw Canvas 2D, LittleJS, Kaplay, Godot HTML5} is the highest-velocity pick for a 2-week Claude-assisted build that is authentically vector and scales cleanly to v2+?
3. What is the right rendering primitive for crisp neon vector lines at 60 fps?
4. What is the right Web Audio strategy for Carpenter-era arcade SFX without importing audio files?
5. What is the right numerical integrator + gravity model for the black hole, and what physics constants should the ship use?

---

## Competitive Landscape

| Product | Approach | Strengths | Gaps we can exploit |
|---|---|---|---|
| **Nova Drift** (Jeffrey Rosenthal, 2022) | Asteroids + roguelike deep upgrade tree; arena arena-based arena not traversal. Overwhelmingly Positive on Steam (96% of ~9k reviews), ~20-min runs ([Steam](https://store.steampowered.com/app/858210/Nova_Drift/), [Rogueliker](https://rogueliker.com/nova-drift-review/)). | Enormous build variety (mini-diamond upgrade trees; dramatic build divergence per run). Difficulty ramps fairly. Strong arcade-roguelike archetype. | **Static arena, no traversal** ([Pocket Gamer](https://www.pocketgamer.com/nova-drift/app-army-assemble/)). **Visually minimalist but modern-glow, not authentically vector**. No narrative framing. No objective beyond score/survival. **Divisive momentum controls** ("never completely in sync with your ship" — [Pocket Gamer](https://www.pocketgamer.com/nova-drift/app-army-assemble/)) but also the thing fans love — we should embrace the same floaty physics and not apologize. **Can get repetitive** between upgrade-unlock beats ([Lords of Gaming](https://lordsofgaming.net/2025/05/nova-drift-review-a-unique-retro-rogue-lite/)). |
| **Luftrausers** (Vlambeer, 2014) | Arcade inertia + short runs + combinable plane-part builds, ~100+ loadout combos. "Summum of the Vlambeer philosophy — games that should've been made in the 80s." 7-color palette, strict design discipline ([Gemsbok](https://thegemsbok.com/art-reviews-and-articles/mid-week-mission-luftrausers-vlambeer-review/)). | Two tight mechanical twists: regen-while-not-firing (forces tactical disengagement) and spawn-rate-as-function-of-enemy-saturation (natural difficulty curve). X20 score multiplier with ~3s decay window keeps aggression high. | Single-screen scroll, no sector traversal. No gravity mechanics. Strong art tells us: a severely limited palette is an asset, not a constraint. |
| **Asteroids** (Atari, 1979) / **Asteroids Deluxe** (1981) | Canonical. Rotate + thrust + fire + hyperspace, 3-tier asteroid break. Vector monitor. | Timeless. Every decision here is load-bearing arcade heritage. Hyperspace is a risk/reward panic button (random reappearance, can kill you). | Zero narrative, zero meta. Our brief expects all of that. |
| **Gravitar** (Atari, 1982) | **The single most relevant prior art.** Asteroids derivative with gravity — ship gets pulled slowly to the deadly star in overworld, downward in side-view. Rich Adam programmed the gravity. Combined Asteroids rotate/thrust with Lunar Lander gravity and added exploration/cave-flying ([Wikipedia](https://en.wikipedia.org/wiki/Gravitar)). | Proves the formula works: Newtonian ship + gravity well + vector aesthetic + arcade difficulty. Reversed gravity in higher difficulty tiers. | Was commercially one of Atari's lowest-selling coin-ops — players found it punishing. **Lesson: pair gravity with forgiving early cells, readable gravity cues, and a safe default approach vector.** |
| **Star Control 2** (Accolade, 1992) — Super Melee | Rotate+thrust combat with inertia, planetary gravity well on battlefield, unique ships. Each ship type has fixed inertia "rotations-to-halt" count (Earthling Cruiser = 12.5, Kohr-Ah = 5; Ariloulaleelay is momentumless) ([Ledmeister ref](https://ledmeister.com/supmeler.htm)). | Validates discrete tunable inertia constants as a design lever. Planet-as-gravity-well proven at 1v1 scale. | Duel-focused, not roguelike. Not directly relevant to our MVP, but informs v2+ enemy differentiation (a Scout with low inertia feels categorically different from a Capital Ship with high inertia — almost free content design). |
| **SubSpace / Continuum** (1995, still live) | Quasi-realistic zero-friction MMO. Ships retain inertia except in safe zones. Wall-bounces preserve momentum ([Wikipedia](https://en.wikipedia.org/wiki/SubSpace_(video_game))). | Validates that "you can never fully stop" is fun at skill cap. Proves no-damage-from-walls keeps arcade flow going (vs. realistic crashing which kills momentum). | Top-down with tiles, not vector. Multiplayer. Not competition — reference. |
| **Cobalt Core** (Rocket Rat, 2023) | Sci-fi roguelike deckbuilder. Movement-as-resource design philosophy — "align parts with enemy weak point, dodge cannon, movement is a resource you build up and spend" ([Game Developer](https://www.gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat)). | Validates clean, legible run structure for a space roguelike. Strong narrative framing (characters as pilots). | Turn-based deckbuilder, different genre. Useful only for run-structure framing and readable UI. |

**Differentiation angle for SpaceNerds** (what we do that Nova Drift doesn't):
1. **Sector traversal, not arena** — the 5×5 grid with seamless scroll and fog-of-war minimap is a Defender/Star Raiders-lineage move that Nova Drift explicitly doesn't have.
2. **Defend-objective, not score-chase** — plant-the-beacon per cell is diegetic and readable in ways "survive waves" isn't.
3. **Narrative framing** — Starship Poindexter / Ko-Dan Armada / Kur / sector command radio chatter lets us recruit *The Last Starfighter* nostalgia that Nova Drift has no claim to.
4. **Authentic 1980s vector** (not modern-minimal-glow). Pure line art, no bloom. This is visually unique in the 2026 arcade-roguelike landscape.
5. **Runtime-synthesized Carpenter-era audio** (not licensed synthwave). Cheaper to ship, more distinctive, matches the "generated on-chip" arcade authenticity.

---

## Prior Art

### OSS Asteroids/vector references worth inspecting

- **[gre/behind-asteroids](https://github.com/gre/behind-asteroids)** — JS13K 2015 winner (Desktop, Mobile, Community categories). ~13KB zipped. Uses WebGL post-processing to fake CRT vector-monitor glow. Demonstrates the minimum viable architecture for a playable vector Asteroids in-browser with atmosphere. **Recommended inspection target** for shader-based CRT feel (though our brief says no bloom — we'd selectively borrow motion/hit feedback, not the glow).
- **[deathraygames/404-js13k-2020](https://github.com/deathraygames/404-js13k-2020)** — Asteroids clone with custom physics library authored for JS13K 2020. Good reference for a compact physics-from-scratch layer.
- **[Kos/js13k-2021](https://github.com/Kos/js13k-2021)** — 3D wireframe-rendered Asteroids, retro "all lines" look. Reference for pure-line-art rendering choices when you can't afford bitmaps.
- **[morroware/JSteroids](https://github.com/morroware/JSteroids)** — Modern HTML5 Canvas Asteroids clone, vanilla JS, smooth animation. Reference-quality, no engine dependency.
- **[jsocol/asteroids](https://github.com/jsocol/asteroids)** and **[gotno/asteroids](https://github.com/gotno/asteroids)** — Older Canvas 2D implementations, instructive on idiomatic shape.
- **[kidscancode.org Godot Asteroids recipe](https://kidscancode.org/godot_recipes/4.x/physics/asteroids_physics/index.html)** — Clear distillation of Asteroids-style `RigidBody2D` physics; useful even if we don't pick Godot.

### Libraries that solve parts of the problem

- **[jsfxr](https://github.com/chr15m/jsfxr)** / **[sfxr.me](https://sfxr.me/)** — JavaScript port of DrPetter's sfxr. Produces canonical arcade SFX (pickupCoin, laserShoot, explosion, powerUp, hitHurt, jump, blipSelect) via Web Audio. Ludum Dare staple. **Likely direct fit for all MVP SFX.** npm-installable, Pro version offers sound-pack export.
- **[sfxr.js](http://humphd.github.io/sfxr.js/)** — Earlier port, historical reference.
- **[Tone.js](https://tonejs.github.io/)** — Higher-level Web Audio framework. Best fit if we want Carpenter-style arpeggiated pads in v2+ (transport/scheduling, pre-built synths, effects).
- **[LittleJS](https://github.com/KilledByAPixel/LittleJS)** — WebGL-rendered, tiny (~20KB core, JS13K branch ships at 7KB), includes rendering, physics, particles, sound, input ([frankforce.com](https://frankforce.com/littlejs-%F0%9F%9A%82-the-tiny-javascript-game-engine-that-can/)). Worth serious consideration for MVP.
- **[Shirajuki js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)** — Benchmarks Three.js, Pixi.js, Phaser, Babylon.js, Two.js, Hilo, melonJS, Kaboom, Kaplay, Kontra, Excalibur, Litecanvas, LittleJS, Canvas API, and DOM head-to-head. Reference for engine-picking.
- **[mhalber/Lines](https://github.com/mhalber/Lines)** — Six different implementations of wide-line rendering in OpenGL. Reference implementation if we need crisp thick vector lines in WebGL later.

### Games/apps with vintage-synth SFX libraries worth reviewing

- **Stranger Things sound-design playbooks** ([FactMag](https://www.factmag.com/2017/10/28/stranger-things-synths-plugins-techniques/), [MicroChop on Carpenter's Halloween](https://microchop.substack.com/p/samplers-synths-and-the-halloween)) — Carpenter and Tangerine Dream both favored the Sequential Circuits Prophet-5. TD's arpeggios came from modular sequencers that drove filter AND pitch. Tempo was slow by modern standards, repetition was meditative not punchy. **Design note: our arcade SFX are short blips; music (v2+) is slow arpeggiated analog pads, not danceable synthwave.**

---

## Technical Patterns

Common architecture for a web vector arcade roguelike:

### 1. Game loop
- Fixed-timestep simulation (e.g., 60Hz logic tick) with interpolated rendering is the gold standard for deterministic physics. See [Gaffer On Games — Integration Basics](https://gafferongames.com/post/integration_basics/) for the canonical write-up.
- For a 2-week build, a simpler variable-timestep `requestAnimationFrame` loop using `dt` from `performance.now()` is acceptable *if* integrator is chosen carefully (see Physics).

### 2. Entity / scene model
- Plain JS objects with `{ x, y, vx, vy, rot, radius, alive }` in a flat array — sufficient for ~200 entities with broadphase elided. No ECS needed for MVP.
- Spatial hashing (grid-bucketed) becomes valuable only when moving to 5×5 seamless-scroll in v2+; defer.

### 3. Rendering — vector line art
- **Batch paths**: One `beginPath()` per color/material, draw many shapes into it, one `stroke()` at the end. [MDN canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) and [web.dev canvas performance](https://web.dev/articles/canvas-performance) both confirm this is the dominant perf lever for path-heavy workloads.
- **Pre-generate asteroid hulls**: Each asteroid's polygon computed once at spawn (~12 vertices of jittered radii) and stored as an array; rotation is a cheap transform matrix applied at draw time. This is how Atari did it in 1979 and it still wins.
- **Ship + bullet vertices**: Hardcode as static arrays, transform per-draw. No geometry allocation per frame.
- **Text**: Canvas `fillText` with a vector-style font (Press Start 2P, Orbitron, or self-drawn segment-style numerals for score).

### 4. Rendering — Canvas 2D vs WebGL
| Dimension | Canvas 2D | WebGL |
|---|---|---|
| Ease of use | Very high (imperative, well-known) | Medium (shader setup, state machine) |
| Line-draw quality | Native antialiased strokes, `lineWidth` respects AA | `gl.lineWidth` stuck at 1px in most drivers ([medium — pixelscommander](https://medium.com/@pixelscommander/why-does-webgl-antialiasing-lie-51e5d3e208bb)); need to expand lines to triangle strips |
| Performance ceiling | ~1ms per draw call cost at scale ([2dgraphs benchmark](https://2dgraphs.netlify.app/)) but batched stroke is cheap | Near-zero per-call cost once set up |
| 60 fps with ~100 entities | Easily sustainable | Overkill |

For MVP workloads (~1 ship, ~20 asteroids, ~10 bullets, ~5 enemies = ~35 entities, each ≤16 vertices = ~560 lines peak), **Canvas 2D is comfortably sufficient** per batching guidance and published benchmarks. We don't need WebGL until v2+ entity counts climb above ~200 concurrent primitives.

### 5. Input
- Keyboard event handlers write into a `keys = {}` map; the game loop reads flags. Classic pattern.
- Guard against browser behaviors: `preventDefault()` on arrow keys (scroll), spacebar (page scroll), hyperspace key (whatever we pick).

### 6. Audio synthesis strategies for vintage arcade SFX
| Strategy | Pros | Cons |
|---|---|---|
| **jsfxr presets** ([link](https://github.com/chr15m/jsfxr)) | Tuned presets named laserShoot/explosion/powerUp/hitHurt etc. Exactly the arcade blip register we want. Tiny. | Limited palette beyond presets; need to tweak params for unique voices. |
| **Raw AudioContext + OscillatorNode** | Total control. Carpenter-authentic analog feel. No dep. | Hand-crafting envelopes for every SFX is hours of tuning. Volume balancing by hand. |
| **Tone.js** | Prebuilt synths, effects, transport scheduling. Great for v2+ music. | Overkill for MVP SFX, adds kb. |

Hybrid approach (recommended): **jsfxr for SFX** (ship thrust, shoot, explosion, hyperspace, death, score-tick, beacon-plant, hit) + **raw AudioContext** for the optional title-screen drone/jingle. Defer Tone.js to v2+ music.

### 7. Physics — numerical integration
Our ship and gravity are a textbook 2-body-ish problem. The [Gaffer On Games integration piece](https://gafferongames.com/post/integration_basics/) and [Kahrstrom comparison](https://kahrstrom.com/gamephysics/2011/08/03/euler-vs-verlet/) agree:

- **Explicit Euler** — unstable for orbital / gravity systems; energy drifts upward, ship spirals out or explodes into black hole.
- **Semi-implicit (symplectic) Euler** — cheap, stable, energy-conserving enough for arcade. Standard choice for 2D games.
- **Velocity Verlet** — more accurate, still cheap, symplectic. Great for orbital-ish dynamics.
- **RK4** — 4th order accurate but **not symplectic**; more expensive; energy can still drift. Overkill and wrong-tool for this class of problem.

**Recommendation: Velocity Verlet for the ship when near a black hole; semi-implicit Euler fallback everywhere else**, or just use Velocity Verlet globally. It's maybe 6 lines of code more than Euler and it will make the gravity well fun instead of frustrating.

### 8. Gravity well model
From [PC Gamer — building a black hole](https://www.pcgamer.com/how-to-build-a-black-hole/) and physics-sim community:
- Raw Newtonian $F = Gm_1m_2/r^2$ goes to infinity as $r \to 0$, which numerically **will** crash the simulation.
- Standard fix: **capped radius** — `r² = max(r², r_min²)`. Equivalent to treating the well as a sphere of non-zero radius.
- Alternative fix: **soft gravity**: `F = Gm/(r² + ε²)` (Plummer softening). Smooths singularity elegantly.
- **Event horizon**: below a visual threshold radius, the ship is "consumed" — in MVP this respawns ship as one of 3 lives; in v2+, this is the wormhole trigger that teleports the ship to the paired black hole with momentum preserved (hypothetically adding a small velocity rotation for flair).

Suggested constants (to be tuned): `G_blackhole = 800–1500`, `r_min = 30px`, `r_max_influence = 400px` (beyond this, gravity clamps to zero to stop the ship being pulled from across the screen).

### 9. Newtonian ship tuning (starting constants for Phase 2 Design)

Drawing on the [GameDev.net discussion](https://gamedev.net/forums/topic/666273-best-approach-for-asteroids-style-movementphysics/), the [Asteroids gist](https://gist.github.com/11216544), Star Control 2's discrete rotation counts, and standard arcade feel:

```
SHIP_ROTATION_SPEED   = 4.0 rad/sec          // ~0.5 full rotation per second
SHIP_THRUST_ACCEL     = 200 px/sec²          // tuneable
SHIP_MAX_SPEED        = 400 px/sec           // cap prevents "lost in space"
SHIP_FRICTION         = 0.0                   // pure Newtonian (authentic) OR
SHIP_FRICTION         = 0.01 per frame        // slight drag (forgiving; lean accessible)
BULLET_SPEED          = 600 px/sec
BULLET_LIFE           = 1.0 sec
HYPERSPACE_COOLDOWN   = 3.0 sec
HYPERSPACE_DEATH_RISK = 0.10                  // 10% chance to die on exit (Asteroids precedent)
```

Tuning philosophy: **start pure-Newtonian and playtest**. Add drag only if playtesters can't turn around at top speed. Star Control 2's lesson is that different enemy ships can have different rotation/thrust constants — use this for v2+ enemy differentiation.

### 10. localStorage high-score pattern
From [gamedev.js article](https://gamedevjs.com/articles/using-local-storage-for-high-scores-and-game-progress/) and common practice:
- Key under a namespace: `spacenerds.highScores` = JSON array of `{initials, score, date}`.
- Cap at top 10 entries.
- On game over, if `score > min(highScores)`, prompt for 3-letter initials (classic arcade).
- Initials entry UX: left/right arrows cycle A–Z, space confirms next letter. Fully keyboard, matches our input constraint.
- Clamp storage: one key, ≤2KB. Avoid accidental QUOTA_EXCEEDED.
- Edge case: private-browsing / Safari sometimes throws on `setItem`. Wrap writes in try/catch, degrade silently.

---

## Key Insights

### Aesthetic

1. **"Totally vector" means a design discipline, not a style.** Luftrausers limited itself to 7 colors and was strict about it — the constraint produced the identity ([Gemsbok review](https://thegemsbok.com/art-reviews-and-articles/mid-week-mission-luftrausers-vlambeer-review/)). SpaceNerds should pick a 4–6 color palette (pink / cyan / magenta / amber / green / white on black) and hold that line religiously. Every new thing drawn has to justify the color it chose.
2. **No bloom, no glow is a competitive advantage, not a compromise.** Nova Drift has "vibrant flashy attacks" that reviewers call "functional but doesn't pop" ([Niche Gamer](https://nichegamer.com/reviews/nova-drift-review/)). Going authentic 1979-vector isn't retro-by-default — it's a deliberate art-direction statement and visually distinct in the 2026 arcade-roguelike market.
3. **Audio must match the era the graphics are from, not the era the brief's prompt is from.** Carpenter's Halloween and Tangerine Dream's Phaedra used Prophet-5 / modular Moog with slow arpeggios and filter-swept pads ([MicroChop](https://microchop.substack.com/p/samplers-synths-and-the-halloween), [Vintage Synth Explorer](https://forum.vintagesynth.com/viewtopic.php?t=35770)). That's a fundamentally different vibe from 2010s synthwave (Kavinsky, Carpenter Brut) which is punchier and 4-on-the-floor. Our audio direction is **meditative menace**, not **dance-rock**.
4. **Screen-shake and hit-stop are free.** Neither requires assets. Both read as 80s-arcade. Use sparingly for big beats (death, capital ship kill).

### Mechanics

1. **The 3-seconds-of-multiplier decay pattern from Luftrausers is directly portable** ([Gemsbok](https://thegemsbok.com/art-reviews-and-articles/mid-week-mission-luftrausers-vlambeer-review/)). Reward aggression, punish camping. Pairs well with our fixed forward-blaster (you have to approach to shoot = you're already where the enemies are).
2. **Nova Drift's "controls are divisive" framing is a feature, not a bug** — it's a skill gate that creates the game's personality. We should NOT add twin-stick / mouse aim to "fix" it. The Newtonian struggle IS the fantasy.
3. **Gravitar's commercial failure came from punishing gravity without readable cues.** Lesson: the black hole needs a **visible influence radius** (e.g., a dim concentric ring or particle drift) so the player can gauge approach. This is diegetic telegraphing, non-negotiable for fairness.
4. **Luftrausers' enemy-saturation spawn-rate dampener is a better difficulty knob than fixed timers.** "Spawn more only when fewer than N enemies onscreen" naturally paces the player's skill. Adopt this for v2+ invasion tempo.
5. **Hyperspace should keep the Asteroids risk cost.** Asteroids Deluxe had ~1 in 10 chance of reentering into a rock. This is where the panic-button feels like a real choice. Don't make it cooldown-only.
6. **Cobalt Core's "movement as resource" reframing** ([Game Developer](https://www.gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat)) is instructive for v2+ sector traversal: fuel/time pressure makes crossing empty cells meaningful instead of trivial.

### Technical

1. **Canvas 2D is correct for MVP.** WebGL is overkill at our entity counts ([2dgraphs benchmark](https://2dgraphs.netlify.app/), [web.dev canvas-perf](https://web.dev/articles/canvas-performance)). WebGL's 1px-line driver limitation ([Medium article](https://medium.com/@pixelscommander/why-does-webgl-antialiasing-lie-51e5d3e208bb)) is a real tax. Defer WebGL to v2+ only if profiling demands it.
2. **Godot HTML5 is wrong for this project.** The 4.3 build ships 40MB uncompressed WASM (~5MB Brotli) ([Godot 4.3 web export progress](https://godotengine.org/article/progress-report-web-export-in-4-3/), [issue 68647](https://github.com/godotengine/godot/issues/68647)). Cold-load on old devices can take 10+ seconds. For a "visit itch.io and play instantly" arcade game, this kills first-impression conversion. Also: Godot's engine-first workflow fights Claude-assisted code-first development.
3. **Kaplay / Kaboom fits beginners but may fight authenticity.** Its opinionated API, ECS, and bitmap-sprite-first approach will push us away from pure line art. Pass.
4. **Symplectic integrator (Verlet or semi-implicit Euler) is mandatory near the gravity well.** Plain Euler will explode within seconds of thrust-into-well. The code delta is trivial.
5. **Procedural asteroid geometry is practically free.** Jittered-radius polygon, 8–12 verts, stored once per asteroid, transformed per-frame. This is the MVP's single most "vector-authentic" win.
6. **Runtime audio synth means zero asset pipeline.** Combined with procedural geometry, SpaceNerds ships as a single JS bundle + index.html. itch.io upload is literally a ZIP of two files. Perfect for a 2-week slice.

---

## Recommendation

### Build vs Buy vs Adapt

**Build.** With adaptation. This is a project where the "bought" primitives (Godot, Phaser, heavyweight physics engines) each cost more in friction than they save in features, at this scope. Adapt pattern-level artifacts from OSS Asteroids clones, reuse jsfxr verbatim for SFX, hand-roll physics and rendering in a thin `~800 line` core that Claude can navigate fluently.

### Engine Pick: **LittleJS** (primary) or **raw Canvas 2D + no framework** (fallback)

**Primary recommendation: LittleJS** ([KilledByAPixel/LittleJS](https://github.com/KilledByAPixel/LittleJS))

Rationale:
- Tiny (~20KB core, 7KB JS13K branch) — aligns with the "single ZIP on itch.io" shipping story.
- Includes exactly what we need: WebGL-accelerated rendering, built-in physics scaffolding, particle system, sound helpers (integrates with jsfxr-style output), keyboard/mouse/gamepad input. Nothing we don't need.
- Batteries-included enough to skip the tedious boilerplate (game loop, input, audio context init) while still letting us write all the game logic ourselves — which is the shape of Claude-assisted dev we want.
- Actively maintained by Frank Force (KilledByAPixel), good docs, community examples.
- Single-author codebase — predictable API, easy for Claude to hold in context.
- Non-opinionated about art style — unlike Kaplay/Kaboom which expect sprites, LittleJS is happy drawing whatever you draw.
- Does not fight our "totally vector" aesthetic — we'll just use its canvas layer and draw line primitives directly.

**Fallback: raw Canvas 2D + zero dependencies** (if LittleJS has any friction during Phase 2 prototyping — say, its input/sound wrappers conflict with how we want to structure things).

Rationale:
- Zero bundle cost beyond our own JS.
- Claude writes and reviews this style of codebase fastest.
- The entire MVP — ship, asteroids, black hole, fighter, bullets, particles, SFX (via jsfxr), high-score screen — is achievable in ~1500 lines of clean vanilla JS. [Katy's "Asteroids in 10 hours" writeup](https://katyscode.wordpress.com/2012/06/13/coding-challenge-write-asteroids-in-10-hours-or-less/) reports ~10 hours for the base game; we're adding 1 enemy, 1 black hole, 1 HUD — comfortably within a 2-week evening budget.
- Graduates cleanly to v2+ without refactor — the 5×5 seamless-scroll mostly adds a camera transform and an entity-spatial-hash.

**Explicit rejections**:
- **Phaser 3** — mature but heavy (~1.2 MB), opinionated toward sprite/physics workflows that fight our aesthetic, and the scene/event machinery is friction for a game this simple.
- **PixiJS v8** — great renderer, but it's only a renderer. We'd still be writing all game logic ourselves, and paying 450KB for WebGL sugar we don't need on ~35 entities.
- **Godot HTML5** — bundle + load-time penalty kills itch.io cold-start. Also engine-first workflow fights Claude-assisted code-first development.
- **Kaplay / Kaboom.js** — beginner-friendly but bitmap-first and opinionated in ways that fight authentic vector art direction.
- **Bevy (Rust + WASM)** — glorious for some uses; 2-week timeline + "ship to itch.io" + "Claude writes 80% of code" combine to make Rust ECS the wrong tool.

### Top 3 Risks

1. **Gravity well feels unfair or invisible (kill rate >> fun rate).** Gravitar's commercial failure was exactly this. **Mitigation**: ship-visible influence-radius ring, readable ship-acceleration vectors (small arrow indicator when in well's gradient), capped-radius gravity model with tuneable `G` and `r_min`. Playtest in week 2 before locking scope.
2. **Newtonian controls bounce off first-session players.** Nova Drift's reviews flag this explicitly as divisive ([Pocket Gamer](https://www.pocketgamer.com/nova-drift/app-army-assemble/)). For our audience (retro-arcade fans, 80s nostalgists) it's on-brief, but a new player can quit in 60 seconds. **Mitigation**: forgiving first 30 seconds (empty space, no enemies), a visible "thrust" and "rotation" tooltip on title screen, possibly an optional "slight drag" toggle for the accessibility-minded.
3. **"Totally vector + old-school synth" gets diluted under time pressure and we ship a generic arcade clone.** Schedule pressure at week 2 will tempt us to import a sprite, use a licensed track, add bloom. **Mitigation**: codify the aesthetic pillars in the Product Spec as hard constraints, not preferences. If tempted to cross a line, cut a feature instead.

### Top 3 OSS References to Inspect During Phase 2 Design

1. **[gre/behind-asteroids](https://github.com/gre/behind-asteroids)** — JS13K 2015 winner. Architecture of a minimalist Asteroids with atmosphere; study how it handles loop, input, and audio in a tight budget.
2. **[deathraygames/404-js13k-2020](https://github.com/deathraygames/404-js13k-2020)** — Cleaner, more recent Asteroids implementation with custom compact physics library. Directly portable physics patterns.
3. **[chr15m/jsfxr](https://github.com/chr15m/jsfxr)** — Our chosen SFX library. Read the source, understand how presets get from params to AudioBuffer. This IS our audio engine for MVP.

Secondary reference: **[KilledByAPixel/LittleJS](https://github.com/KilledByAPixel/LittleJS)** — if we pick it as the engine, read its `examples/` folder end-to-end before writing a line of SpaceNerds code. Two hours of read-time saves a day of trial-and-error.

---

*End of Research Brief. Ready to feed into Phase 1 Product Spec finalization and Phase 2 Technical Design.*
