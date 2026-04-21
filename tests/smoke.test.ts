import { describe, it, expect } from 'vitest';

describe('vitest pipeline smoke', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('compiles ES2022 syntax', () => {
    const arr = [1, 2, 3];
    expect(arr.at(-1)).toBe(3);
  });

  it('supports async/await', async () => {
    const v = await Promise.resolve(42);
    expect(v).toBe(42);
  });
});
