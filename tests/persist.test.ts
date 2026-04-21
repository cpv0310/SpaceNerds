import { describe, it, expect } from 'vitest';
import {
  createPersist,
  isHighScore,
  STORAGE_KEY,
  TOP_N,
  type Saved,
  type StorageLike,
} from '../src/persist';

function mockStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
  };
}

function quotaFailStorage(): StorageLike {
  return {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {},
  };
}

describe('persist — load defaults', () => {
  it('returns defaults when storage is empty', () => {
    const p = createPersist(mockStorage());
    const s = p.load();
    expect(s.version).toBe(1);
    expect(s.highScores).toEqual([]);
    expect(s.runCount).toBe(0);
    expect(s.muted).toBe(false);
  });

  it('returns defaults when storage is null (private-mode / disabled)', () => {
    const p = createPersist(null);
    const s = p.load();
    expect(s.runCount).toBe(0);
    expect(s.highScores).toEqual([]);
  });

  it('silently resets corrupt JSON (E-9)', () => {
    const storage = mockStorage();
    storage.data.set(STORAGE_KEY, '{not valid json');
    const s = createPersist(storage).load();
    expect(s.highScores).toEqual([]);
    expect(s.runCount).toBe(0);
  });

  it('silently resets non-object payload', () => {
    const storage = mockStorage();
    storage.data.set(STORAGE_KEY, '"just a string"');
    const s = createPersist(storage).load();
    expect(s.highScores).toEqual([]);
  });

  it('drops malformed high-score entries on load', () => {
    const storage = mockStorage();
    storage.data.set(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        runCount: 5,
        muted: false,
        highScores: [
          { initials: 'ABC', score: 100, dateISO: '2026-01-01' },
          { bogus: true },
          { initials: 'XYZ', score: 'not a number' },
          { initials: 'DEF', score: 50, dateISO: '2026-01-02' },
        ],
      })
    );
    const s = createPersist(storage).load();
    expect(s.highScores).toHaveLength(2);
    expect(s.highScores[0].score).toBe(100);
  });
});

describe('persist — save + round-trip', () => {
  it('save + load preserves state', () => {
    const storage = mockStorage();
    const p = createPersist(storage);
    const s: Saved = {
      version: 1,
      highScores: [{ initials: 'AAA', score: 1000, dateISO: 'x' }],
      runCount: 42,
      muted: true,
    };
    p.save(s);
    const loaded = p.load();
    expect(loaded.runCount).toBe(42);
    expect(loaded.muted).toBe(true);
    expect(loaded.highScores[0].score).toBe(1000);
  });

  it('save is silent on quota-exceeded (E-9)', () => {
    const p = createPersist(quotaFailStorage());
    expect(() => p.save({
      version: 1, highScores: [], runCount: 0, muted: false,
    })).not.toThrow();
  });

  it('save is silent when storage is null', () => {
    const p = createPersist(null);
    expect(() => p.save({
      version: 1, highScores: [], runCount: 0, muted: false,
    })).not.toThrow();
  });
});

describe('persist — addHighScore', () => {
  it('adds a new entry', () => {
    const p = createPersist(mockStorage());
    const start = p.load();
    const next = p.addHighScore(start, 'ABC', 100);
    expect(next.highScores).toHaveLength(1);
    expect(next.highScores[0].initials).toBe('ABC');
    expect(next.highScores[0].score).toBe(100);
  });

  it('clamps initials to 3 uppercase characters', () => {
    const p = createPersist(mockStorage());
    const next = p.addHighScore(p.load(), 'abcdef', 50);
    expect(next.highScores[0].initials).toBe('ABC');
  });

  it('pads short initials with A', () => {
    const p = createPersist(mockStorage());
    const next = p.addHighScore(p.load(), 'B', 50);
    expect(next.highScores[0].initials).toBe('BAA');
  });

  it('sorts entries by score descending', () => {
    const p = createPersist(mockStorage());
    let s = p.load();
    s = p.addHighScore(s, 'LOW', 10);
    s = p.addHighScore(s, 'MID', 50);
    s = p.addHighScore(s, 'TOP', 100);
    expect(s.highScores.map((e) => e.score)).toEqual([100, 50, 10]);
  });

  it('caps at TOP_N and evicts lowest entry', () => {
    const p = createPersist(mockStorage());
    let s = p.load();
    for (let i = 0; i < TOP_N; i++) s = p.addHighScore(s, 'AAA', i * 10);
    expect(s.highScores).toHaveLength(TOP_N);
    s = p.addHighScore(s, 'WIN', 9999);
    expect(s.highScores).toHaveLength(TOP_N);
    expect(s.highScores[0].score).toBe(9999);
    expect(s.highScores.every((e) => e.score >= 10)).toBe(true);
  });

  it('is immutable (returns new object)', () => {
    const p = createPersist(mockStorage());
    const before = p.load();
    const after = p.addHighScore(before, 'ABC', 100);
    expect(before.highScores).toHaveLength(0);
    expect(after.highScores).toHaveLength(1);
    expect(after).not.toBe(before);
  });
});

describe('persist — isHighScore', () => {
  it('returns true when high-score list is not full', () => {
    const saved: Saved = {
      version: 1,
      highScores: [{ initials: 'AAA', score: 100, dateISO: '' }],
      runCount: 0,
      muted: false,
    };
    expect(isHighScore(saved, 50)).toBe(true);
  });

  it('returns true when score beats the 10th-best', () => {
    const saved: Saved = {
      version: 1,
      highScores: Array.from({ length: TOP_N }, (_, i) => ({
        initials: 'AAA',
        score: (TOP_N - i) * 10,
        dateISO: '',
      })),
      runCount: 0,
      muted: false,
    };
    expect(isHighScore(saved, 999)).toBe(true);
    expect(isHighScore(saved, saved.highScores[TOP_N - 1].score + 1)).toBe(true);
  });

  it('returns false when score does not beat the 10th-best', () => {
    const saved: Saved = {
      version: 1,
      highScores: Array.from({ length: TOP_N }, (_, i) => ({
        initials: 'AAA',
        score: (TOP_N - i) * 10,
        dateISO: '',
      })),
      runCount: 0,
      muted: false,
    };
    const tenth = saved.highScores[TOP_N - 1].score;
    expect(isHighScore(saved, tenth)).toBe(false);
    expect(isHighScore(saved, tenth - 1)).toBe(false);
  });

  it('returns false for zero / negative score', () => {
    const saved: Saved = {
      version: 1,
      highScores: [],
      runCount: 0,
      muted: false,
    };
    expect(isHighScore(saved, 0)).toBe(false);
    expect(isHighScore(saved, -10)).toBe(false);
  });
});

describe('persist — mute + run count', () => {
  it('setMuted returns a new state with muted flag', () => {
    const p = createPersist(mockStorage());
    const saved = p.setMuted(p.load(), true);
    expect(saved.muted).toBe(true);
  });

  it('incrementRunCount increments by 1', () => {
    const p = createPersist(mockStorage());
    let saved = p.load();
    saved = p.incrementRunCount(saved);
    saved = p.incrementRunCount(saved);
    expect(saved.runCount).toBe(2);
  });
});
