import { ONE_SHOT_PRESETS } from './presets';

export type SfxName =
  | 'shoot'
  | 'fighter_shot'
  | 'bang_large'
  | 'bang_medium'
  | 'bang_small'
  | 'fighter_bang'
  | 'ship_bang'
  | 'hyperspace_in'
  | 'hyperspace_out';

export interface Sfx {
  init(): Promise<void>;
  play(name: SfxName): void;
  startThrust(): void;
  stopThrust(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  isInitialized(): boolean;
  dispose(): void;
}

export type AudioContextFactory = () => AudioContext;

const MASTER_GAIN = 0.5;
const THRUST_GAIN = 0.18;
const THRUST_ATTACK = 0.05;
const THRUST_RELEASE = 0.08;
const THRUST_FREQ = 85;

export function createSfx(
  audioCtxFactory: AudioContextFactory = defaultCtxFactory
): Sfx {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let initialized = false;
  let muted = false;
  let thrustOsc: OscillatorNode | null = null;
  let thrustGain: GainNode | null = null;

  async function init(): Promise<void> {
    if (initialized) return;
    try {
      ctx = audioCtxFactory();
      if (!ctx) return;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_GAIN;
      master.connect(ctx.destination);
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      initialized = true;
    } catch {
      ctx = null;
      master = null;
      initialized = false;
    }
  }

  function play(name: SfxName): void {
    if (!initialized || muted || !ctx || !master) return;
    const preset = ONE_SHOT_PRESETS[name];
    if (!preset) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = preset.waveform;
    osc.frequency.setValueAtTime(preset.startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(preset.endFreq, 1),
      now + preset.duration
    );
    gain.gain.setValueAtTime(preset.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + preset.duration + 0.02);
  }

  function startThrust(): void {
    if (!initialized || muted || !ctx || !master) return;
    if (thrustOsc) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = THRUST_FREQ;
    gain.gain.value = 0;
    osc.connect(gain).connect(master);
    osc.start();
    gain.gain.linearRampToValueAtTime(THRUST_GAIN, ctx.currentTime + THRUST_ATTACK);
    thrustOsc = osc;
    thrustGain = gain;
  }

  function stopThrust(): void {
    if (!ctx || !thrustOsc || !thrustGain) return;
    const now = ctx.currentTime;
    thrustGain.gain.cancelScheduledValues(now);
    thrustGain.gain.setValueAtTime(thrustGain.gain.value, now);
    thrustGain.gain.linearRampToValueAtTime(0, now + THRUST_RELEASE);
    const osc = thrustOsc;
    setTimeout(() => {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    }, Math.ceil(THRUST_RELEASE * 1000) + 20);
    thrustOsc = null;
    thrustGain = null;
  }

  function setMuted(m: boolean): void {
    muted = m;
    if (master && ctx) {
      master.gain.setValueAtTime(m ? 0 : MASTER_GAIN, ctx.currentTime);
    }
    if (m) stopThrust();
  }

  function dispose(): void {
    stopThrust();
    if (ctx) {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }
    ctx = null;
    master = null;
    initialized = false;
  }

  return {
    init,
    play,
    startThrust,
    stopThrust,
    setMuted,
    isMuted: () => muted,
    isInitialized: () => initialized,
    dispose,
  };
}

function defaultCtxFactory(): AudioContext {
  const AC =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;
  if (!AC) throw new Error('AudioContext not available');
  return new AC();
}
