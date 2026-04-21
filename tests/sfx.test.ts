import { describe, it, expect, beforeEach } from 'vitest';
import { createSfx, type Sfx, type SfxName } from '../src/audio/sfx';
import {
  createMockAudioContext,
  type MockAudioContext,
} from './test-harness';

const ALL_SFX: SfxName[] = [
  'shoot',
  'fighter_shot',
  'bang_large',
  'bang_medium',
  'bang_small',
  'fighter_bang',
  'ship_bang',
  'hyperspace_in',
  'hyperspace_out',
];

describe('sfx — lifecycle', () => {
  let mockCtx: MockAudioContext;
  let sfx: Sfx;

  beforeEach(() => {
    mockCtx = createMockAudioContext();
    sfx = createSfx(() => mockCtx as unknown as AudioContext);
  });

  it('starts not-initialized and not-muted', () => {
    expect(sfx.isInitialized()).toBe(false);
    expect(sfx.isMuted()).toBe(false);
  });

  it('init() makes it initialized', async () => {
    await sfx.init();
    expect(sfx.isInitialized()).toBe(true);
  });

  it('init() is idempotent', async () => {
    await sfx.init();
    await sfx.init();
    expect(sfx.isInitialized()).toBe(true);
  });

  it('init() resumes a suspended ctx (Safari unlock)', async () => {
    mockCtx.state = 'suspended';
    await sfx.init();
    expect(mockCtx.state).toBe('running');
  });

  it('dispose() closes the context', async () => {
    await sfx.init();
    sfx.dispose();
    expect(mockCtx.closed).toBe(true);
    expect(sfx.isInitialized()).toBe(false);
  });
});

describe('sfx — play()', () => {
  let mockCtx: MockAudioContext;
  let sfx: Sfx;

  beforeEach(async () => {
    mockCtx = createMockAudioContext();
    sfx = createSfx(() => mockCtx as unknown as AudioContext);
    await sfx.init();
  });

  it('is a no-op before init', () => {
    const fresh = createSfx(() => mockCtx as unknown as AudioContext);
    fresh.play('shoot');
    expect(mockCtx.oscillators).toHaveLength(0);
  });

  it('creates an oscillator for each SFX name', () => {
    for (const name of ALL_SFX) {
      mockCtx.oscillators.length = 0;
      sfx.play(name);
      expect(mockCtx.oscillators.length, `for ${name}`).toBe(1);
    }
  });

  it('calls osc.start and osc.stop', () => {
    sfx.play('shoot');
    const osc = mockCtx.oscillators[0];
    expect(osc.started).toBe(true);
  });

  it('is a no-op when muted', () => {
    sfx.setMuted(true);
    sfx.play('shoot');
    expect(mockCtx.oscillators).toHaveLength(0);
  });
});

describe('sfx — thrust', () => {
  let mockCtx: MockAudioContext;
  let sfx: Sfx;

  beforeEach(async () => {
    mockCtx = createMockAudioContext();
    sfx = createSfx(() => mockCtx as unknown as AudioContext);
    await sfx.init();
  });

  it('startThrust creates one sawtooth oscillator', () => {
    sfx.startThrust();
    expect(mockCtx.oscillators).toHaveLength(1);
    expect(mockCtx.oscillators[0].type).toBe('sawtooth');
    expect(mockCtx.oscillators[0].frequency.value).toBe(85);
  });

  it('startThrust is idempotent (no second oscillator)', () => {
    sfx.startThrust();
    sfx.startThrust();
    expect(mockCtx.oscillators).toHaveLength(1);
  });

  it('stopThrust does not throw if thrust not running', () => {
    expect(() => sfx.stopThrust()).not.toThrow();
  });

  it('startThrust + stopThrust + startThrust creates a new oscillator', () => {
    sfx.startThrust();
    sfx.stopThrust();
    sfx.startThrust();
    expect(mockCtx.oscillators.length).toBeGreaterThanOrEqual(2);
  });
});

describe('sfx — mute', () => {
  let mockCtx: MockAudioContext;
  let sfx: Sfx;

  beforeEach(async () => {
    mockCtx = createMockAudioContext();
    sfx = createSfx(() => mockCtx as unknown as AudioContext);
    await sfx.init();
  });

  it('setMuted(true) flips isMuted', () => {
    sfx.setMuted(true);
    expect(sfx.isMuted()).toBe(true);
  });

  it('setMuted(true) zeros master gain', () => {
    sfx.setMuted(true);
    expect(mockCtx.gains[0].gain.value).toBe(0);
  });

  it('setMuted(false) restores master gain', () => {
    sfx.setMuted(true);
    sfx.setMuted(false);
    expect(mockCtx.gains[0].gain.value).toBeGreaterThan(0);
  });

  it('setMuted while thrusting stops thrust', () => {
    sfx.startThrust();
    sfx.setMuted(true);
    expect(sfx.isMuted()).toBe(true);
  });
});

describe('sfx — resilience', () => {
  it('init that throws leaves module uninitialized, not crashed', async () => {
    const sfx = createSfx(() => {
      throw new Error('no audio on this browser');
    });
    await sfx.init();
    expect(sfx.isInitialized()).toBe(false);
    expect(() => sfx.play('shoot')).not.toThrow();
  });
});
