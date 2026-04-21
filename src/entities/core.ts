export interface Point {
  x: number;
  y: number;
}

export interface CoreEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  ax_prev: number;
  ay_prev: number;
  rot: number;
  radius: number;
  alive: boolean;
  age: number;
}

export function initCore(x: number, y: number, radius: number): CoreEntity {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    ax_prev: 0,
    ay_prev: 0,
    rot: 0,
    radius,
    alive: true,
    age: 0,
  };
}
