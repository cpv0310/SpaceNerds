export const PLAYFIELD_W = 1280;
export const PLAYFIELD_H = 720;

export const SHIP_RADIUS = 10;
export const BULLET_RADIUS = 2;
export const FIGHTER_RADIUS = 12;
export const ASTEROID_R_LARGE = 40;
export const ASTEROID_R_MEDIUM = 24;
export const ASTEROID_R_SMALL = 12;

export const SHIP_STARTING_LIVES = 3;
export const SHIP_ROTATION_SPEED = 4.0;
export const SHIP_THRUST_ACCEL = 200;
export const SHIP_MAX_SPEED = 400;
export const SHIP_FIRE_COOLDOWN = 0.2;
export const HYPERSPACE_COOLDOWN = 3.0;
export const HYPERSPACE_DEATH_RISK = 0.10;
export const HYPERSPACE_INVULN = 2.0;
export const RESPAWN_INVULN = 2.0;
export const BULLET_LIFE = 1.0;
export const BULLET_SPEED = 600;

export const BH_R_MIN = 30;
export const BH_R_MAX_INFLUENCE = 400;
export const BH_G = 1000;

export const ASTEROID_INITIAL_COUNT = 4;
export const ASTEROID_MAX = 12;
export const ASTEROID_SPAWN_INTERVAL = 4.0;
export const ASTEROID_MIN_SHIP_DIST = 300;
export const ASTEROID_INIT_SPEED_MIN = 20;
export const ASTEROID_INIT_SPEED_MAX = 60;
export const ASTEROID_SPLIT_SPEED_BOOST = 40;
export const ASTEROID_HULL_JITTER = 0.3;

export const FIGHTER_MAX = 3;
export const FIGHTER_SPAWN_INTERVAL = 8.0;
export const FIGHTER_THRUST_ACCEL = 150;
export const FIGHTER_MAX_SPEED = 280;
export const FIGHTER_FIRE_COOLDOWN = 1.5;
export const FIGHTER_BULLET_SPEED = 500;
export const FIGHTER_APPROACH_DIST = 400;
export const FIGHTER_RETREAT_DIST = 150;

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
