export interface HighScoreEntry {
  initials: string;
  score: number;
  dateISO: string;
}

export interface Saved {
  version: 1;
  highScores: HighScoreEntry[];
  runCount: number;
  muted: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Persist {
  load(): Saved;
  save(s: Saved): void;
  addHighScore(saved: Saved, initials: string, score: number): Saved;
  incrementRunCount(saved: Saved): Saved;
  setMuted(saved: Saved, muted: boolean): Saved;
}

export const STORAGE_KEY = 'spacenerds.v1';
export const TOP_N = 10;

function defaults(): Saved {
  return {
    version: 1,
    highScores: [],
    runCount: 0,
    muted: false,
  };
}

function validate(raw: unknown): Saved {
  const out = defaults();
  if (typeof raw !== 'object' || raw === null) return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.runCount === 'number' && Number.isFinite(r.runCount)) {
    out.runCount = Math.max(0, Math.floor(r.runCount));
  }
  if (typeof r.muted === 'boolean') out.muted = r.muted;
  if (Array.isArray(r.highScores)) {
    out.highScores = (r.highScores as unknown[])
      .filter((e): e is Record<string, unknown> => {
        if (typeof e !== 'object' || e === null) return false;
        const o = e as Record<string, unknown>;
        return typeof o.initials === 'string' && typeof o.score === 'number';
      })
      .map((e) => ({
        initials: String(e.initials).slice(0, 3).toUpperCase() || 'AAA',
        score: Math.max(0, Math.floor(Number(e.score))),
        dateISO: typeof e.dateISO === 'string' ? e.dateISO : '',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
  }
  return out;
}

function pickDefaultStorage(): StorageLike | null {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as { localStorage?: StorageLike };
    if (g.localStorage) return g.localStorage;
  }
  return null;
}

export function createPersist(storage: StorageLike | null = pickDefaultStorage()): Persist {
  return {
    load(): Saved {
      if (!storage) return defaults();
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return defaults();
        return validate(JSON.parse(raw));
      } catch {
        return defaults();
      }
    },
    save(s: Saved): void {
      if (!storage) return;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        /* quota / denied — silent per E-9 */
      }
    },
    addHighScore(saved, initials, score): Saved {
      const cleanInitials = (initials || '').slice(0, 3).toUpperCase().padEnd(3, 'A');
      const entry: HighScoreEntry = {
        initials: cleanInitials,
        score: Math.max(0, Math.floor(score)),
        dateISO: new Date().toISOString(),
      };
      const nextList = [...saved.highScores, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N);
      return { ...saved, highScores: nextList };
    },
    incrementRunCount(saved): Saved {
      return { ...saved, runCount: saved.runCount + 1 };
    },
    setMuted(saved, muted): Saved {
      return { ...saved, muted };
    },
  };
}

export function isHighScore(saved: Saved, score: number): boolean {
  if (score <= 0) return false;
  if (saved.highScores.length < TOP_N) return true;
  return score > saved.highScores[TOP_N - 1].score;
}
