---
type: adr
date: 2026-04-20
status: accepted
prompt: "ADR-004 for SpaceNerds: lock the audio library strategy for MVP SFX (no audio files per Boundary B-2)."
---

# ADR-004: Audio — jsfxr for SFX, music deferred to v2+

## Context

Boundary B-2: no audio files ship in MVP. All audio must be runtime-synthesized via the Web Audio API. Old-school synth register (Carpenter / Tangerine Dream / early Vangelis lineage, NOT modern synthwave).

Options:

- **jsfxr** — JS port of DrPetter's sfxr. Produces canonical arcade SFX (laserShoot, explosion, pickupCoin, powerUp, hitHurt, jump, blipSelect, synth). npm-installable, MIT, ~8KB. Ludum Dare / JS13K staple.
- **Raw `AudioContext` + `OscillatorNode`** — zero dep, full control. Hand-build every SFX from oscillators, filters, envelopes.
- **Tone.js** — high-level Web Audio framework with transport, scheduling, pre-built synths, effects. ~200KB minified.
- **faust-webaudio / WebChucK** — audio DSL languages. Significant learning curve.

We have ~8 SFX needs for MVP: player shoot, player thrust (continuous), asteroid-large-bang, asteroid-med-bang, asteroid-small-bang, fighter-shoot, fighter-bang, ship-bang, hyperspace-in, hyperspace-out. That's 10 distinct sounds. No music.

## Decision

**jsfxr for all MVP SFX.**

Every SFX is defined as a preset parameter set, generated at load time into an `AudioBuffer`, and played via `BufferSourceNode` on demand. One `AudioContext`, one set of buffers, small code surface.

Music deferred to v2+. If a title-screen drone is cheap to squeeze in (< 1 hour of work) in Week 2, we can do it with raw `AudioContext` oscillators. Otherwise it ships silent.

## Consequences

**Easier:**
- Each SFX is 10-20 parameters in a JSON-ish file. Tunable by hand in the sfxr.me web UI, exported, pasted into `audio/presets.ts`.
- Claude writes jsfxr integration fluently (well-known library).
- Zero audio files ship. Aesthetic pillar preserved.
- Tiny bundle cost (~8KB for the lib + ~200 bytes per preset).

**Harder:**
- Thrust needs a continuous loop, not a one-shot. jsfxr outputs a single buffer — we either (a) loop the buffer while thrust key is held, (b) trigger short repeating instances, or (c) fall back to a custom `OscillatorNode + GainNode` setup just for thrust. Plan: start with looped buffer; if it sounds chopped, switch the thrust sound to raw oscillator. Budget half a day.
- Carpenter-era arpeggiated pads are NOT jsfxr's strength. Music is deferred anyway.
- Safari's Web Audio unlock quirk (OQ-10) must be handled: create `AudioContext` on first user gesture, not at page load.

**Trade-offs accepted:**
- We lose the polish of hand-crafted oscillator synths in exchange for speed-to-MVP.
- We accept that the SFX will sound more "Ludum Dare arcade" than "1982 Gravitar" at a fine-grained level. That's acceptable because the overall register — short, percussive, synthesized — matches the era.

## Alternatives rejected

| Option | Reason rejected |
|---|---|
| Raw AudioContext + oscillators only | Takes 3-5x longer to tune 10 distinct SFX; the same end quality is available from jsfxr presets with 10 mins of iteration each. |
| Tone.js | Overkill for SFX; the ~200KB cost is most of our bundle budget for MVP; its real value (scheduling, transport, pre-built synths) matters for v2+ music. |
| faust-webaudio / WebChucK | Learning curve blows the 2-week budget. |
| Licensed / commissioned audio files | Violates Boundary B-2. |

## References

- [jsfxr on GitHub](https://github.com/chr15m/jsfxr)
- [sfxr.me web editor](https://sfxr.me/)
- [Tone.js](https://tonejs.github.io/)
- Research Brief § Technical Patterns / Audio
