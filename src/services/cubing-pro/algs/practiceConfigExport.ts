/**
 * 练习配置导出/导入
 * 包含：熟练度、配置、选择、随机历史、练习历史、每日随机
 */

const PREFIX_PROFICIENCY = 'algs:formula_practice_proficiency:';
const PREFIX_CONFIG = 'algs:formula_practice_config:';
const PREFIX_SELECTION = 'algs:formula_practice_selection:';
const PREFIX_RANDOM_PICK = 'algs:formula_random_pick:';
const PREFIX_HISTORY = 'algs:formula_practice_history:';
const KEY_DAILY_PICK = 'algs:daily_random_pick';

export interface PracticeConfigExport {
  version: 1;
  exportedAt: string; // ISO string
  proficiency: Record<string, unknown>;
  config: Record<string, unknown>;
  selection: Record<string, unknown>;
  formulaRandomPick: Record<string, Array<{ setName: string; groupName: string; algName: string }>>;
  formulaPracticeHistory: Record<string, unknown>;
  dailyRandomPick?: unknown;
}

function collectByPrefix(prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const subKey = key.slice(prefix.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            result[subKey] = JSON.parse(raw);
          } catch {
            result[subKey] = raw;
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return result;
}

function collectFormulaRandomPick(): Record<string, Array<{ setName: string; groupName: string; algName: string }>> {
  const result: Record<string, Array<{ setName: string; groupName: string; algName: string }>> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX_RANDOM_PICK)) {
        const subKey = key.slice(PREFIX_RANDOM_PICK.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const arr = JSON.parse(raw) as Array<{ setName?: string; groupName?: string; algName?: string }>;
            if (Array.isArray(arr)) {
              result[subKey] = arr.map((item) => ({
                setName: item.setName ?? '',
                groupName: item.groupName ?? '',
                algName: item.algName ?? '',
              }));
            }
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return result;
}

export function exportPracticeConfig(): PracticeConfigExport {
  const proficiency = collectByPrefix(PREFIX_PROFICIENCY);
  const config = collectByPrefix(PREFIX_CONFIG);
  const selection = collectByPrefix(PREFIX_SELECTION);
  const formulaRandomPick = collectFormulaRandomPick();
  const formulaPracticeHistory = collectByPrefix(PREFIX_HISTORY);

  let dailyRandomPick: unknown = undefined;
  try {
    const raw = localStorage.getItem(KEY_DAILY_PICK);
    if (raw) {
      dailyRandomPick = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    proficiency,
    config,
    selection,
    formulaRandomPick,
    formulaPracticeHistory,
    dailyRandomPick,
  };
}

export function importPracticeConfig(jsonStr: string): { success: boolean; message?: string } {
  try {
    const data = JSON.parse(jsonStr) as Partial<PracticeConfigExport>;
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid format' };
    }
    if (data.version !== 1) {
      return { success: false, message: 'Unsupported version' };
    }

    const proficiency = data.proficiency;
    if (proficiency && typeof proficiency === 'object') {
      Object.entries(proficiency).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(`${PREFIX_PROFICIENCY}${subKey}`, JSON.stringify(val));
          } catch {
            // ignore
          }
        }
      });
    }

    const config = data.config;
    if (config && typeof config === 'object') {
      Object.entries(config).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(`${PREFIX_CONFIG}${subKey}`, JSON.stringify(val));
          } catch {
            // ignore
          }
        }
      });
    }

    const selection = data.selection;
    if (selection && typeof selection === 'object') {
      Object.entries(selection).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(`${PREFIX_SELECTION}${subKey}`, JSON.stringify(val));
          } catch {
            // ignore
          }
        }
      });
    }

    const formulaRandomPick = data.formulaRandomPick;
    if (formulaRandomPick && typeof formulaRandomPick === 'object') {
      Object.entries(formulaRandomPick).forEach(([subKey, arr]) => {
        if (Array.isArray(arr)) {
          const items = arr.map((item) => ({
            setName: item?.setName ?? '',
            groupName: item?.groupName ?? '',
            algName: item?.algName ?? '',
            image: '', // 不导入图片
          }));
          try {
            localStorage.setItem(`${PREFIX_RANDOM_PICK}${subKey}`, JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      });
    }

    const formulaPracticeHistory = data.formulaPracticeHistory;
    if (formulaPracticeHistory && typeof formulaPracticeHistory === 'object') {
      Object.entries(formulaPracticeHistory).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(`${PREFIX_HISTORY}${subKey}`, JSON.stringify(val));
          } catch {
            // ignore
          }
        }
      });
    }

    if (data.dailyRandomPick != null && typeof data.dailyRandomPick === 'object') {
      try {
        localStorage.setItem(KEY_DAILY_PICK, JSON.stringify(data.dailyRandomPick));
      } catch {
        // ignore
      }
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Import failed',
    };
  }
}
