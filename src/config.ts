export const PLAYFIELD_W = 1280;
export const PLAYFIELD_H = 720;

export const SHIP_RADIUS = 10;
export const BULLET_RADIUS = 2;
export const FIGHTER_RADIUS = 12;
export const ASTEROID_R_LARGE = 40;
export const ASTEROID_R_MEDIUM = 24;
export const ASTEROID_R_SMALL = 12;

export const SHIP_STARTING_LIVES = 3;
export const RESPAWN_INVULN = 2.0;
export const BULLET_LIFE = 1.0;

export const BH_R_MIN = 30;
export const BH_R_MAX_INFLUENCE = 400;
export const BH_G = 1000;

export const PALETTE = {
  ship: '#ff2fcf',
  bullet: '#fffbe6',
  asteroid: '#65ffe0',
  fighter: '#ffb347',
  blackhole: '#a661ff',
  ring: '#6d3fb3',
  particle: '#fffbe6',
  hud: '#65ffe0',
  bg: '#000000',
} as const;
