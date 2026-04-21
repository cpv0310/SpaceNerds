import type { CoreEntity } from '../entities/core';
import { PLAYFIELD_W, PLAYFIELD_H } from '../config';

export type AccelFn = (e: CoreEntity) => readonly [number, number];

export function integrate(
  entities: readonly CoreEntity[],
  dt: number,
  accelFn: AccelFn
): void {
  for (const e of entities) {
    if (!e.alive) continue;

    const [ax0, ay0] = accelFn(e);
    e.vx += 0.5 * ax0 * dt;
    e.vy += 0.5 * ay0 * dt;

    e.x += e.vx * dt;
    e.y += e.vy * dt;

    const [ax1, ay1] = accelFn(e);
    e.ax_prev = ax0;
    e.ay_prev = ay0;
    e.ax = ax1;
    e.ay = ay1;

    e.vx += 0.5 * ax1 * dt;
    e.vy += 0.5 * ay1 * dt;
  }
}

export function wrapPlayfield(
  e: CoreEntity,
  w: number = PLAYFIELD_W,
  h: number = PLAYFIELD_H
): void {
  if (e.x < 0) e.x += w;
  else if (e.x >= w) e.x -= w;
  if (e.y < 0) e.y += h;
  else if (e.y >= h) e.y -= h;
}

export function clampMaxSpeed(e: CoreEntity, maxSpeed: number): void {
  const v2 = e.vx * e.vx + e.vy * e.vy;
  const max2 = maxSpeed * maxSpeed;
  if (v2 > max2) {
    const scale = maxSpeed / Math.sqrt(v2);
    e.vx *= scale;
    e.vy *= scale;
  }
}

export function postStep(entities: readonly CoreEntity[], dt: number): void {
  for (const e of entities) {
    if (!e.alive) continue;
    wrapPlayfield(e);
    e.age += dt;
  }
}
