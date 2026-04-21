import type { Entity, EntityKind } from './entities';

export interface Collision {
  readonly a: Entity;
  readonly b: Entity;
}

const KIND_ORDER: Record<EntityKind, number> = {
  asteroid: 0,
  blackhole: 1,
  bullet: 2,
  fighter: 3,
  particle: 4,
  ship: 5,
};

export function detect(entities: readonly Entity[]): Collision[] {
  const result: Collision[] = [];
  const n = entities.length;
  for (let i = 0; i < n; i++) {
    const a = entities[i];
    if (!a.alive || a.kind === 'particle') continue;
    for (let j = i + 1; j < n; j++) {
      const b = entities[j];
      if (!b.alive || b.kind === 'particle') continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const rSum = a.radius + b.radius;
      if (dx * dx + dy * dy > rSum * rSum) continue;
      if (KIND_ORDER[a.kind] <= KIND_ORDER[b.kind]) {
        result.push({ a, b });
      } else {
        result.push({ a: b, b: a });
      }
    }
  }
  return result;
}
