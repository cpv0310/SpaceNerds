---
type: product-spec
date: 2026-04-20
project: SpaceNerds
status: draft
prompt: "Synthesize the Phase 1 Cascade interview (28 questions across concept, mechanics, aesthetic, scope, business model) into a formal Product Spec. MVP is a 2-week vertical slice; full game (v2+) is a 5x5 seamless-scrolling sector roguelike. Totally vector graphics, old-school synth audio, web-only."
tags:
  - cascade
  - phase-1
  - product-spec
  - spacenerds
  - arcade-roguelike
  - vector-graphics
related:
  - "[[transcript]]"
  - "[[research-brief]]"
  - "[[The Cascade]]"
---

# Product Spec: SpaceNerds

## Problem Statement

Chris Petit (Skunkwerks) wants to ship a playable, portfolio-grade, web-first arcade game in 2 weeks of evening work that (a) proves the Skunkwerks ethos of small, opinionated, craft-quality software, (b) serves as a tangible output of the Cascade development methodology, and (c) establishes an aesthetic and technical foundation that can be expanded over subsequent passes into the fully-designed game without rewrites.

**Target player:** 30- to 50-year-old web visitors with nostalgia for 1980s vector-arcade games (Asteroids, Tempest, Gravitar, Battlezone), roguelike enthusiasts who appreciate pure permadeath runs, and casual visitors drawn by the aesthetic who want a clear 5-minute score-chase loop.

**Target ship:** 2 weeks of evening work, web-only, no backend, no accounts, no install.

## Game Summary

A totally-vector-graphics arcade roguelike in the Asteroids lineage. The player commands the Starship Poindexter, defending the Gamma Sector of the galaxy from the Ko-Dan Armada (warlord: Kur). Zero-g Newtonian physics. Fly, shoot, survive. Pure permadeath. Three lives. Classic arcade scoring. Old-school synth soundscape.

The full game design (v2+) is a 5x5 seamless-scrolling sector with 25 cells to clear, two linked black holes forming a wormhole pair, a fog-of-war radar minimap, five enemy types, invasion-tempo escalation, and within-run milestone upgrades. The MVP ships a single-screen vertical slice of this design.

## User Stories

### Phase 1 (MVP)

- **As a curious visitor**, I want to click a URL and begin playing inside 2 seconds, so I can sample the game with zero install friction.
  - Acceptance: first-paint <2s on broadband, single-key input starts a run from the title screen.
- **As an arcade player**, I want precise Newtonian ship controls that reward skill rather than brute-force button-mashing, so I feel in command of a physics-accurate vessel.
  - Acceptance: rotate and thrust with independent keys; momentum persists; no auto-braking; hyperspace is a risk-bearing escape.
- **As a player in a run**, I want each life to end from a clearly-caused collision (asteroid, enemy shot, black hole, hyperspace misfortune) that I can learn from, so death feels fair.
  - Acceptance: every death is attributable to a single on-screen cause; no invisible damage; no "I don't know what killed me" moments.
- **As a player across sessions**, I want my high score to persist and display on the title screen, so I have something to beat.
  - Acceptance: best score and run count survive page refresh; visible on title and game-over screens.
- **As a player pattern-matching on 80s arcade**, I want the visuals and sound to feel authentically 1980s, not modern-retro-styled, so the nostalgia reads as genuine homage.
  - Acceptance: zero bitmap assets, zero glow/bloom post-processing, all audio runtime-synthesized via Web Audio API, palette restricted to vector-arcade neon (pink/cyan/magenta/amber on black).

### Phase 2 (Enhancement, informal roadmap)

- **As a returning player**, I want a full 5x5 Gamma Sector to explore and defend with meaningful strategic route choices across cells.
- **As a returning player**, I want a radar minimap with fog of war so I experience tension from unknown cells and "sensor ping" revelations.
- **As a player investing in mastery**, I want weapon modifier pickups, milestone upgrade choices every 5 cells, and five distinct enemy types so run-to-run variation is rich.
- **As a player savoring the fantasy**, I want AI co-pilot radio banter, named ship Easter eggs, and a period-appropriate synth soundtrack.

## Functional Requirements

### Phase 1 (MVP, 2-week scope)

#### FR-1: Ship & Physics

- **FR-1.1** Player controls a single ship ("Starship Poindexter") rendered as a simple vector wireframe (triangular silhouette in the Asteroids tradition).
- **FR-1.2** Ship obeys zero-gravity Newtonian inertia: thrust applies linear acceleration in the ship's facing direction; momentum persists until another force acts.
- **FR-1.3** Ship rotation is independent of velocity (rotating does not change momentum direction).
- **FR-1.4** Max speed is bounded (soft cap) to keep gameplay readable.
- **FR-1.5** Thrust produces a visible vector-flame trail from the ship's stern for as long as thrust is held.

#### FR-2: Controls

- **FR-2.1** Keyboard-only input.
- **FR-2.2** Default bindings: Left/Right arrows OR A/D rotate the ship; Up arrow OR W applies thrust; Space fires the blaster; Left-Shift triggers hyperspace.
- **FR-2.3** All bindings accept both arrow-key and WASD alternatives simultaneously.
- **FR-2.4** No mouse input in MVP.

#### FR-3: Weapons

- **FR-3.1** Forward blaster: fires a vector projectile from the ship's nose in the ship's facing direction.
- **FR-3.2** Blaster has a minimum fire interval (rate-of-fire cap) to prevent hold-to-win.
- **FR-3.3** Projectiles travel at a fixed speed in world space (not relative to ship velocity) and despawn after a fixed maximum travel distance or screen wrap, whichever is first (see FR-4.3 for screen-edge behavior).
- **FR-3.4** Hyperspace: teleports the ship to a random position on-screen; brief invulnerability window on arrival; small random chance of destruction on arrival (classic Asteroids homage).
- **FR-3.5** Hyperspace has a cooldown to prevent spam.

#### FR-4: Playfield

- **FR-4.1** The MVP playfield is a single screen. The game does not scroll or wrap camera in MVP.
- **FR-4.2** Canonical MVP resolution target: 1280x720 logical (scaled to browser viewport at render time).
- **FR-4.3** Screen edge behavior: Asteroids-style torus wrap (ship, projectiles, asteroids, enemies all wrap on both axes). This is the MVP-only choice because the single-screen arena has no larger "sector" fiction yet; v2+ replaces this with hard walls at the sector boundary.
- **FR-4.4** Playfield background is pure black. No starfield, no nebulae, no parallax in MVP.

#### FR-5: Asteroids

- **FR-5.1** Asteroids spawn procedurally at run start and on a periodic timer during the run.
- **FR-5.2** Asteroids have three size tiers: large, medium, small.
- **FR-5.3** Shooting an asteroid destroys it and spawns two smaller asteroids (large -> 2 medium -> 2 small each -> vapor). Small asteroids destroyed give no further spawns.
- **FR-5.4** Asteroids drift with random initial velocity and rotation; they do not accelerate on their own.
- **FR-5.5** Asteroids are rendered as vector polygons with irregular jagged silhouettes (classic Asteroids look).
- **FR-5.6** Asteroid-ship collision destroys the ship (consumes one life).
- **FR-5.7** Asteroid-enemy collision destroys both (no friendly fire penalty).

#### FR-6: Black Hole

- **FR-6.1** One black hole is placed at run start at a non-deterministic location inside the playfield, avoiding the ship's spawn position with at least some minimum distance (starter constant: keep ≥ 250px from spawn point; tune in Phase 3).
- **FR-6.2** Black hole applies a gravitational pull to the ship, asteroids, projectiles, and enemies within a defined radius of influence.
- **FR-6.3** Gravity model: **capped-radius inverse-square** — `F = G · m / max(r², r_min²)` with the force clamped to zero beyond `r_max_influence`. Starter constants from research: `G = 800–1500`, `r_min = 30 px`, `r_max_influence = 400 px`. Final values tuned in Phase 3.
- **FR-6.4** An object crossing the event horizon (inner lethal radius, equal to `r_min`) is destroyed. For the ship: one life lost. For asteroids, projectiles, and enemies: removed from play.
- **FR-6.5** The black hole is rendered as an animated vector distortion (rotating nested rings or radial spokes) over a black disc.
- **FR-6.6** The black hole does not move.
- **FR-6.7** **FAIRNESS REQUIREMENT — Visible gravity influence ring.** The black hole must render a subtle, persistent visible indicator of its `r_max_influence` boundary so the player can see where the pull zone begins. Acceptable treatments: a faint dashed circle, a ring of drifting particles at the boundary, or a dim radial-gradient glow *within the "totally vector" constraint* (e.g. line-segment particles). This is a non-optional fairness cue. Gravitar (1982) failed commercially because invisible gravity felt unfair — we do not repeat the mistake.
- **FR-6.8** No wormhole behavior in MVP (single black hole; the second hole and linked teleport are v2+).

#### FR-7: Enemies (Ko-Dan Fighter)

- **FR-7.1** The MVP ships a single enemy type: the Ko-Dan Fighter.
- **FR-7.2** Fighter spawns on a periodic timer with small variance.
- **FR-7.3** Fighter AI: thrust toward the player's ship; fire forward when the player is within some firing cone and range; avoid direct collision with asteroids with basic steering.
- **FR-7.4** Fighter is destroyed by a single player projectile hit.
- **FR-7.5** Fighter-ship collision destroys both (one life lost for player).
- **FR-7.6** Fighter is affected by black hole gravity and destroyed by the event horizon.
- **FR-7.7** Fighter is rendered as a distinct vector wireframe visually clearly different from the player's ship (different silhouette, different neon hue).

#### FR-8: Lives & Run Lifecycle

- **FR-8.1** A run begins with 3 lives.
- **FR-8.2** On ship destruction, the ship respawns at the center of the screen with a brief invulnerability window (~2 seconds), unless no lives remain.
- **FR-8.3** When the third life is lost, the run ends. Game state transitions to a Game Over screen.
- **FR-8.4** There is no "win" condition in MVP — the run continues until the player has no lives left. Asteroids and enemies continue spawning at a roughly steady rate (no formal difficulty ramp in MVP; MVP enemy/asteroid spawn cadence is tuned for a ~3-7 minute median run).

#### FR-9: Scoring

- **FR-9.1** Destroying an enemy Fighter awards points.
- **FR-9.2** Destroying asteroids awards points weighted by size (larger asteroids award more).
- **FR-9.3** The current score displays persistently in the HUD during the run.
- **FR-9.4** No combo multiplier in MVP. No survival-time bonus in MVP.

#### FR-10: Screens & UI

- **FR-10.1** Title screen displays: game title ("SpaceNerds"), current high score, control reminder ("PRESS SPACE TO PLAY"), tag line (e.g. "Defend the Gamma Sector").
- **FR-10.2** In-game HUD displays: current score, lives remaining (rendered as small ship icons), and optionally a subtle hyperspace-cooldown indicator.
- **FR-10.3** Game Over screen displays: final score, whether a new high score was achieved, "PRESS SPACE TO PLAY AGAIN" prompt.
- **FR-10.4** All UI text is rendered in a vector-style monospace or pixel-free geometric font (runtime-rendered shapes preferred; a single open-license web font is an acceptable fallback).

#### FR-11: Audio

- **FR-11.1** All audio is runtime-synthesized via the Web Audio API. No audio files are shipped in MVP.
- **FR-11.2** SFX required for MVP: player shot, asteroid hit, asteroid destruction (size-dependent pitch), enemy shot, enemy destruction, ship destruction, hyperspace in, hyperspace out, thrust rumble (continuous while held).
- **FR-11.3** Music is not required for MVP. A subtle ambient drone loop is acceptable if it fits in the development budget; deferred to v2+ otherwise.
- **FR-11.4** Audio respects browser autoplay policy: context resumes on first player input, not on page load.
- **FR-11.5** Master volume toggle (mute / unmute) accessible from title screen.

#### FR-12: Persistence

- **FR-12.1** High score persists across sessions via `localStorage`.
- **FR-12.2** Run count persists across sessions via `localStorage`.
- **FR-12.3** Stored values are plain JSON, single key namespace (e.g. `spacenerds.v1`).
- **FR-12.4** On corrupted/missing storage, the game resets stored state silently and continues.
- **FR-12.5** No cookies. No network persistence. No accounts.
- **FR-12.6** High-score screen accepts 3-letter initials entry when a new high score is achieved (arcade-classic; keyboard-only: left/right arrows cycle A-Z, space confirms). Top 10 entries are kept.

#### FR-13: Onboarding

- **FR-13.1** The opening ~20-30 seconds of a new run are **enemy-free** and **asteroid-spawn-paused** to let a first-time player learn Newtonian controls without dying immediately. The black hole is present from t=0. Duration and exact pacing tuned in Phase 3 playtest.
- **FR-13.2** Title screen shows a compact one-line control reminder (e.g. "ARROWS ROTATE • UP THRUSTS • SPACE FIRES • SHIFT HYPERSPACE").
- **FR-13.3** No tutorial, no modal overlays, no text during play. The onboarding grace window IS the tutorial.

### Phase 2 (Enhancement, not in MVP scope)

These are cut from MVP. They are captured here so the Technical Design does not close off the path to them.

- **FR-13 (v2)** Playfield scales from single-screen to a 5x5 seamless-scroll sector (25 cells, each 1 screen large).
- **FR-14 (v2)** Screen wrap replaced with hard walls at the sector boundary (diegetic: "Delta Sector is off-limits").
- **FR-15 (v2)** Two linked black holes; entering one ejects the ship from the other (wormhole pair). Non-ship objects (projectiles, asteroids, enemies) may or may not traverse — to be decided.
- **FR-16 (v2)** 5x5 minimap HUD overlay showing ship position, black hole positions, and per-cell threat state.
- **FR-17 (v2)** Fog of war on the minimap: unvisited cells are opaque. Periodic "sensor ping" briefly reveals rough threat in a random unknown cell.
- **FR-18 (v2)** Beacon-plant cell clear mechanic: after killing all enemies in a cell, the ship initiates a ~3s vulnerable beacon-plant action to formally secure the cell.
- **FR-19 (v2)** Cleared cells remain permanently cleared for the remainder of the run.
- **FR-20 (v2)** Four additional enemy types: Scout, Gunship, Mine-layer, Capital Ship. Each with distinct AI.
- **FR-21 (v2)** Weapon modifier pickups: enemies occasionally drop a modifier that swaps the blaster's behavior for a limited duration (spread, piercing, homing).
- **FR-22 (v2)** Milestone upgrade choices: every 5 cells cleared, the player is offered a choice of 1-of-3 permanent-for-the-run upgrades.
- **FR-23 (v2)** Invasion-tempo escalation: enemy spawn rate and count-per-cell scale up as more cells are cleared.
- **FR-24 (v2)** Win condition: clearing all 25 cells ends the run as a victory.
- **FR-25 (v2)** Ko-Dan flagship capital-ship encounter as a natural difficulty peak.
- **FR-26 (v2)** Old-school synth soundtrack (Carpenter/Tangerine Dream lineage), runtime-synthesized where possible, otherwise licensed.
- **FR-27 (v2)** AI co-pilot radio banter between cells.
- **FR-28 (v2)** Named Easter eggs on unit names, pickup blurbs, and achievements.
- **FR-29 (v2)** Bonus-life awards at milestone cell counts (e.g. every 10 cells cleared).

## Non-Functional Requirements

### Performance

- **NFR-P1** Target 60 FPS on Chrome and Firefox on a 2020+ mid-range laptop (Intel i5 or Apple M1, integrated GPU).
- **NFR-P2** Maximum entity count in MVP (ship + asteroids + enemies + projectiles + particles) stays under ~150 on-screen before performance budgeting kicks in.
- **NFR-P3** Input-to-visible-response latency under 16 ms (one frame at 60 FPS).
- **NFR-P4** First meaningful paint under 2 seconds on broadband.

### Bundle & Network

- **NFR-B1** Total page weight (HTML + JS + any inlined assets) under 500 KB gzipped. Vector + runtime-synth makes this easily achievable.
- **NFR-B2** No CDN dependency required for offline capability (all code ships from the host).
- **NFR-B3** No network requests after initial page load (no analytics, no telemetry, no leaderboard calls in MVP).

### Compatibility

- **NFR-C1** Supported browsers: Chrome, Firefox, Safari, Edge — two most recent major versions each.
- **NFR-C2** Safari on macOS is a first-class target (Chris's primary browser). Known Web Audio API quirks must be handled.
- **NFR-C3** Desktop/laptop only. No mobile support in MVP (no touch input, no responsive layout).
- **NFR-C4** Minimum supported resolution: 1024x768 logical. The playfield scales to fit.

### Accessibility (MVP floor)

- **NFR-A1** Mute / unmute toggle accessible from the title screen.
- **NFR-A2** Pause functionality (bound to `Escape` or `P`).
- **NFR-A3** Colorblind-safe palette: rely on shape, line pattern, and luminance rather than hue alone to distinguish ship / enemy / asteroid / black hole / projectile. Red-green palette specifically avoided.
- **NFR-A4** No flashing lights above 3 Hz. No strobe effects. Photosensitive safety.
- **NFR-A5** Remappable controls deferred to v2+.

### Development

- **NFR-D1** Implementation language: TypeScript (type safety for physics math and entity state).
- **NFR-D2** Development pipeline includes unit tests for physics, collision, and scoring logic at minimum 80% coverage per project rules.
- **NFR-D3** All external dependencies MIT/BSD/Apache-2 licensed (no GPL viral dependencies).
- **NFR-D4** Source code versioned in a public or private git repo under the Skunkwerks organization.
- **NFR-D5** Engine: **LittleJS** (primary; ~20KB WebGL/Canvas hybrid, batteries-included minimal game framework) or **raw Canvas 2D + zero dependencies** (fallback if LittleJS's input/sound wrappers create friction). Decision finalized in Phase 2 prototyping; either path meets all constraints. Explicit rejections (per Research Brief): Phaser (too heavy/opinionated), PixiJS (renderer-only, unnecessary WebGL cost at ~35 entities), Godot HTML5 (40MB WASM kills itch.io cold-start), Kaplay/Kaboom (bitmap-first, fights vector aesthetic).
- **NFR-D6** Physics integrator: **Velocity Verlet** (symplectic, energy-conserving). Non-negotiable for the ship-near-black-hole case; plain Euler will diverge within seconds. See Research Brief § Technical Patterns.
- **NFR-D7** SFX library: **jsfxr** (MIT, canonical arcade-blip generator, npm-installable, zero audio files). Tone.js deferred to v2+ music only.
- **NFR-D8** Rendering primitive: **Canvas 2D batched-path** (one `beginPath()` per color, one `stroke()` after many shapes). WebGL deferred to v2+ only if entity counts exceed ~200 concurrent primitives.

## Boundaries

### DO NOT CHANGE

These pillars define the game. They are not up for discussion during implementation.

- **B-1** **No bitmap/raster image assets of any kind.** All visuals are procedurally-drawn vector geometry. This is a core aesthetic pillar, not an optimization.
- **B-2** **No audio files.** All audio is runtime-synthesized via Web Audio API. MP3/OGG/WAV are forbidden in MVP.
- **B-3** **No glow, bloom, or modern-retro post-processing.** The authenticity of the 1980s vector-arcade look is the point.
- **B-4** **No backend, no server, no accounts, no network calls after page load** for MVP. Pure client-side game.
- **B-5** **No mobile, no touch input** for MVP.
- **B-6** **Pure permadeath** between runs. No cross-run progression, no meta-currency, no persistent upgrades. Only the high score and run count persist.
- **B-7** **Keyboard-only** for MVP.
- **B-8** **Zero-gravity Newtonian physics for the ship.** No auto-braking, no "fly like a plane," no velocity cap that feels like a hard wall (soft cap only).
- **B-9** **Core loop single-screen only for MVP.** The 5x5 sector and all associated v2+ systems are out of scope.

### Must Ask Before Changing

Any proposed deviation from these requires explicit user sign-off before proceeding.

- **A-1** Engine/framework choice (will be decided in Phase 2 with input from the Research Brief).
- **A-2** Any addition of external assets, fonts, or libraries that ship bytes to the client.
- **A-3** Any divergence from the Phase 1 (MVP) functional requirements above.
- **A-4** Any change to the palette, typography, or overall visual register beyond the "neon vector on black" pillar.
- **A-5** Any introduction of analytics, telemetry, tracking, or third-party scripts.

## Edge Cases

- **E-1** Ship hyperspaces into the black hole event horizon. **Decision:** the ship is destroyed (one life lost). The hyperspace invulnerability window does not protect against black hole lethality. This is a learnable risk, consistent with the original Asteroids "hyperspace can kill you" design.
- **E-2** An asteroid breaks apart while inside the black hole gravity radius. **Decision:** the two resulting asteroids inherit the parent's position plus small random offsets; they are immediately subject to gravity.
- **E-3** Player holds the fire button indefinitely. **Decision:** rate-of-fire cap handles this; no auto-fire penalty, no overheat mechanic in MVP.
- **E-4** Ship is destroyed but the projectile it fired a moment before hits and destroys an enemy after death. **Decision:** the kill awards points to the current run score; player-state death does not pause projectile simulation.
- **E-5** Ship respawns at screen center just as an asteroid is passing through the center. **Decision:** respawn invulnerability window (~2s) protects the ship from immediate re-death. After the window, collision applies normally.
- **E-6** Enemy Fighter and asteroid collide mid-flight. **Decision:** both are destroyed; no score awarded to the player (no tree-falls-in-a-forest point farming).
- **E-7** Player pauses the game. **Decision:** physics simulation halts; HUD dims; `ESC` or `P` resumes.
- **E-8** Browser tab loses focus during play. **Decision:** game auto-pauses; physics halts; input buffer clears; resume on refocus (player must explicitly unpause).
- **E-9** `localStorage` quota exceeded or denied (private mode, full disk, locked browser). **Decision:** the game runs normally; score does not persist; no error is shown.
- **E-10** Player reduces window to sub-minimum resolution. **Decision:** game pauses; overlay message "Window too small — please enlarge."
- **E-11** Audio context fails to initialize. **Decision:** game runs silently; no error shown; mute button reflects state.
- **E-12** Player presses all movement keys simultaneously. **Decision:** handled by straightforward input state machine; no unexpected behavior.
- **E-13** Two projectiles from the same ship hit the same asteroid on the same frame. **Decision:** first projectile awards the kill; second is consumed without double-scoring.
- **E-14** Player fires hyperspace the same frame as taking a lethal hit. **Decision:** damage resolution takes precedence; ship is destroyed before the teleport executes.

## Success Metrics

### Ship-ability (required for MVP-complete)

- **SM-1** Deployed to itch.io and mirrored on a Skunkwerks-owned URL within 14 elapsed days of Implementation kickoff (Phase 3 start date).
- **SM-2** Sustained 60 FPS on reference hardware (Apple M1 MacBook Pro, latest Chrome and Safari).
- **SM-3** First-time player completes one full run (win or lose) without reading written instructions beyond the title screen.
- **SM-4** Zero runtime errors in a 10-minute playtest session.
- **SM-5** All core loop functional requirements (FR-1 through FR-12) pass their unit and integration tests.

### Quality (playtest-validated)

- **SM-6** Chris reaches a satisfying personal high-score improvement curve across ~5-10 consecutive runs without frustration.
- **SM-7** At least one external playtester (ideally an 80s-arcade enthusiast) confirms the aesthetic reads as "authentically 80s" rather than "retro-styled modern."
- **SM-8** Median run length falls in the 3-7 minute range under default spawn tuning.
- **SM-9** No death feels arbitrary in playtest (E-1 to E-14 edge cases resolve as specified).

### Portfolio

- **SM-10** Spec, Research Brief, Technical Design, ADRs, and commit history are all published together as a demonstration of the Cascade methodology applied end-to-end.

## Open Questions

Phase 0 Research Brief has resolved or narrowed most of these. Remaining items for Phase 2 Design and Phase 3 playtest.

- **OQ-1 (Engine)** ✅ RESOLVED — **LittleJS primary, raw Canvas 2D + zero-deps fallback.** See NFR-D5. Final choice ratified in Phase 2 prototyping.
- **OQ-2 (Physics integrator)** ✅ RESOLVED — **Velocity Verlet.** See NFR-D6.
- **OQ-3 (Audio synthesis)** ✅ RESOLVED — **jsfxr for MVP SFX; Tone.js deferred to v2+ music.** See NFR-D7.
- **OQ-4 (Gravity model)** ✅ RESOLVED — **Capped-radius inverse-square** with starter constants `G=800-1500, r_min=30, r_max_influence=400`. See FR-6.3. Exact tuning is Phase 3 playtest.
- **OQ-5 (Scoring values)** Phase 3 playtest. Starter proposal: Asteroid Large 20 / Medium 50 / Small 100; Ko-Dan Fighter 200. Tune to feel.
- **OQ-6 (Hyperspace misfortune chance)** Starter: 10% chance of destruction on exit (Asteroids precedent per Research Brief). Tune in Phase 3.
- **OQ-7 (Ship tuning values)** Starter constants from Research Brief: `rotation=4 rad/s, thrust_accel=200 px/s², max_speed=400 px/s, friction=0 (pure) or 0.01/frame (slight drag), bullet_speed=600 px/s, bullet_life=1.0s, hyperspace_cooldown=3.0s`. Tune in Phase 3.
- **OQ-8 (Black hole geometry)** Starter from Research: event horizon 30 px, influence 400 px, visible disc radius ~20 px. Tune in Phase 3.
- **OQ-9 (Vector font)** Phase 2 decision. Candidates: runtime-rendered segment glyphs (most authentic, most work) vs lightweight web font such as VT323 or Press Start 2P (cheap, small bundle). Leaning runtime-rendered for score digits + web font for menu text to hit both needs.
- **OQ-10 (Safari Web Audio unlock)** Acknowledged; handled in Phase 2 Technical Design via explicit unlock-on-first-user-gesture pattern.
- **OQ-11 (Target audience validation)** Phase 1 review gate item — confirm inferred audience in the Problem Statement (30-50yo web visitors with 80s vector-arcade nostalgia + roguelike fans) is correct.
- **OQ-12 (Luftrausers multiplier pattern)** Research Brief flagged Luftrausers' 3-second multiplier-decay as a high-leverage pattern that rewards aggression and fits our fixed-forward-blaster. Consider adding as a scoring enhancement. Decision deferred to Phase 3 after base scoring is tuned.
- **OQ-13 (Onboarding polish)** Should the opening grace window display a subtle "DRIFT TEST" label or just be silent? UX decision; Phase 3 playtest informed.

## Risks

From the Research Brief's Top-3-Risks plus operational concerns:

- **R-1 (HIGH) Gravity well feels unfair or invisible.** Gravitar's commercial failure in 1982 was exactly this pattern. Mitigation: FR-6.7 mandates a visible influence ring; Phase 3 playtests gravity in week 2 before locking scope; capped-radius model keeps force finite near the event horizon.
- **R-2 (HIGH) Newtonian controls bounce off first-session players.** Mitigation: FR-13 onboarding grace window, control hint on title screen, optional slight-drag toggle evaluated in Phase 3 accessibility pass.
- **R-3 (HIGH) Aesthetic pillars dilute under schedule pressure.** Schedule pressure at week 2 will tempt "just one bitmap" / "just one MP3" / "just a little bloom." Mitigation: Boundaries section is a hard contract; if tempted to cross a line, cut a feature instead.
- **R-4** 2 weeks is tight. Any single requirement that triggers a rabbit hole (e.g. "perfect" gravity model, hand-drawn vector font) will consume the budget. Mitigation: strict Phase 3 task-box discipline, time-box any sub-task to 1 day max, replan rather than burn.
- **R-5** Safari Web Audio quirks can silently break audio. Mitigation: explicit unlock-on-first-input pattern (OQ-10), tested cross-browser before mid-build.
- **R-6** `localStorage` availability is not guaranteed (private mode, quota). Not critical (game runs silently without persistence per E-9) but note in user-facing messaging if a session fails to save a high score.
- **R-7** Canvas 2D line performance on older integrated GPUs could disappoint at v2+ scale. Mitigation: profile in Phase 3; WebGL line rendering (via LittleJS WebGL layer or mhalber/Lines technique) is the escape hatch.

## References

- Parent methodology: [[The Cascade]]
- Session transcript: [[transcript]]
- Phase 0 Research Brief: [[research-brief]] (produced in parallel)
- Containing project folder: `Product Specs/Skunkwerks/SpaceNerds/`
