let seed = Date.now() >>> 0;

export function setSeed(s: number): void {
  seed = s >>> 0;
}

export function rand(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randRange(min: number, max: number): number {
  return min + rand() * (max - min);
}
