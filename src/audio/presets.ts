export interface OneShotPreset {
  waveform: OscillatorType;
  startFreq: number;
  endFreq: number;
  volume: number;
  duration: number;
}

export const ONE_SHOT_PRESETS: Record<string, OneShotPreset> = {
  shoot: {
    waveform: 'square',
    startFreq: 900,
    endFreq: 360,
    volume: 0.3,
    duration: 0.09,
  },
  fighter_shot: {
    waveform: 'sawtooth',
    startFreq: 620,
    endFreq: 240,
    volume: 0.28,
    duration: 0.12,
  },
  bang_large: {
    waveform: 'sawtooth',
    startFreq: 110,
    endFreq: 35,
    volume: 0.5,
    duration: 0.45,
  },
  bang_medium: {
    waveform: 'sawtooth',
    startFreq: 180,
    endFreq: 60,
    volume: 0.4,
    duration: 0.3,
  },
  bang_small: {
    waveform: 'square',
    startFreq: 260,
    endFreq: 90,
    volume: 0.32,
    duration: 0.18,
  },
  fighter_bang: {
    waveform: 'square',
    startFreq: 320,
    endFreq: 70,
    volume: 0.35,
    duration: 0.28,
  },
  ship_bang: {
    waveform: 'sawtooth',
    startFreq: 220,
    endFreq: 40,
    volume: 0.55,
    duration: 0.6,
  },
  hyperspace_in: {
    waveform: 'square',
    startFreq: 150,
    endFreq: 1200,
    volume: 0.3,
    duration: 0.25,
  },
  hyperspace_out: {
    waveform: 'square',
    startFreq: 1200,
    endFreq: 80,
    volume: 0.3,
    duration: 0.3,
  },
};
