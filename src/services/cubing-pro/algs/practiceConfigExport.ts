import { exportHistory, importHistory, normalizeHistory } from './formulaPracticeHistoryDb';

const PREFIX_PROFICIENCY = 'algs:formula_practice_proficiency:';
const PREFIX_CONFIG = 'algs:formula_practice_config:';
const PREFIX_SELECTION = 'algs:formula_practice_selection:';
const PREFIX_RANDOM_PICK = 'algs:formula_random_pick:';
const PREFIX_CUSTOM = 'algs_custom_';
const KEY_DAILY_PICK = 'algs:daily_random_pick';
const KEY_CUSTOM_FORMULAS = 'algs_custom_formulas';

export interface PracticeConfigExport {
  version: 1 | 2;
  exportedAt: string;
  proficiency: Record<string, unknown>;
  config: Record<string, unknown>;
  selection: Record<string, unknown>;
  formulaRandomPick: Record<string, Array<{ setName: string; groupName: string; algName: string }>>;
  formulaPracticeHistory: Record<string, unknown>;
  dailyRandomPick?: unknown;
  /** Compatibility with the old single-key backup. */
  customFormulas?: Record<string, string[]>;
  /** Values keyed by the suffix of the actual algs_custom_ localStorage keys. */
  customAlgs?: Record<string, unknown>;
}

function parseValue(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return raw; }
}

function collectByPrefix(prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const raw = localStorage.getItem(key);
      if (raw !== null) result[key.slice(prefix.length)] = parseValue(raw);
    }
  }
  return result;
}

/** Rejects if either storage backend cannot be read; never emits an incomplete backup. */
export async function exportPracticeConfig(): Promise<PracticeConfigExport> {
  const formulaPracticeHistory = await exportHistory();
  const daily = localStorage.getItem(KEY_DAILY_PICK);
  const custom = localStorage.getItem(KEY_CUSTOM_FORMULAS);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    proficiency: collectByPrefix(PREFIX_PROFICIENCY),
    config: collectByPrefix(PREFIX_CONFIG),
    selection: collectByPrefix(PREFIX_SELECTION),
    formulaRandomPick: collectByPrefix(PREFIX_RANDOM_PICK) as PracticeConfigExport['formulaRandomPick'],
    formulaPracticeHistory,
    dailyRandomPick: daily === null ? undefined : parseValue(daily),
    customFormulas: custom === null ? undefined : parseValue(custom) as Record<string, string[]>,
    customAlgs: collectByPrefix(PREFIX_CUSTOM),
  };
}

function entries(value: unknown): [string, unknown][] {
  if (value === undefined) return [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid backup section');
  return Object.entries(value);
}

export async function importPracticeConfig(jsonStr: string): Promise<{ success: boolean; message?: string }> {
  const previous = new Map<string, string | null>();
  try {
    const data = JSON.parse(jsonStr) as Partial<PracticeConfigExport>;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid format');
    if (data.version !== 1 && data.version !== 2) throw new Error('Unsupported version');

    const writes = new Map<string, string>();
    for (const [prefix, section] of [
      [PREFIX_PROFICIENCY, data.proficiency], [PREFIX_CONFIG, data.config],
      [PREFIX_SELECTION, data.selection], [PREFIX_RANDOM_PICK, data.formulaRandomPick],
      [PREFIX_CUSTOM, data.customAlgs],
    ] as const) {
      for (const [suffix, value] of entries(section)) {
        writes.set(`${prefix}${suffix}`, JSON.stringify(value));
      }
    }
    if (data.dailyRandomPick !== undefined) writes.set(KEY_DAILY_PICK, JSON.stringify(data.dailyRandomPick));
    if (data.customFormulas !== undefined) {
      entries(data.customFormulas);
      if (!writes.has(KEY_CUSTOM_FORMULAS)) writes.set(KEY_CUSTOM_FORMULAS, JSON.stringify(data.customFormulas));
      // Version 1 used a single formula map; restore entries to the keys customAlgs.ts reads.
      if (data.version === 1) {
        for (const [key, formulas] of entries(data.customFormulas)) {
          if (!Array.isArray(formulas) || formulas.some((formula) => typeof formula !== 'string')) {
            throw new Error('Invalid custom formulas');
          }
          writes.set(`${PREFIX_CUSTOM}${key}`, JSON.stringify(formulas));
        }
      }
    }

    const histories = Object.fromEntries(entries(data.formulaPracticeHistory));
    // Validate every history before touching either backend.
    for (const value of Object.values(histories)) normalizeHistory(value);
    for (const [key, value] of writes) {
      previous.set(key, localStorage.getItem(key));
      localStorage.setItem(key, value);
      if (localStorage.getItem(key) !== value) throw new Error(`Storage verification failed: ${key}`);
    }
    // importHistory resolves at DB commit; legacy-key cleanup is best-effort after that boundary.
    if (Object.keys(histories).length) await importHistory(histories);
    return { success: true };
  } catch (error) {
    // localStorage and IndexedDB cannot share a transaction. Restore settings if the DB fails.
    let rollbackFailed = false;
    for (const [key, value] of previous) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch { rollbackFailed = true; }
    }
    return {
      success: false,
      message: `${error instanceof Error ? error.message : 'Import failed'}${rollbackFailed ? '; settings rollback failed' : ''}`,
    };
  }
}
