/**
 * 练习配置导出/导入（localStorage 全量）
 */

const PREFIX_PROFICIENCY = "algs:formula_practice_proficiency:";
const PREFIX_CONFIG = "algs:formula_practice_config:";
const PREFIX_SELECTION = "algs:formula_practice_selection:";
const PREFIX_RANDOM_PICK = "algs:formula_random_pick:";
const PREFIX_HISTORY = "algs:formula_practice_history:";
const KEY_DAILY_PICK = "algs:daily_random_pick";
const KEY_CUSTOM_FORMULAS = "algs_custom_formulas";

export interface PracticeConfigExport {
  version: 1;
  exportedAt: string;
  proficiency: Record<string, unknown>;
  config: Record<string, unknown>;
  selection: Record<string, unknown>;
  formulaRandomPick: Record<
    string,
    Array<{ setName: string; groupName: string; algName: string }>
  >;
  formulaPracticeHistory: Record<string, unknown>;
  dailyRandomPick?: unknown;
  customFormulas?: Record<string, string[]>;
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

function collectFormulaRandomPick(): Record<
  string,
  Array<{ setName: string; groupName: string; algName: string }>
> {
  const result: Record<
    string,
    Array<{ setName: string; groupName: string; algName: string }>
  > = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX_RANDOM_PICK)) {
        const subKey = key.slice(PREFIX_RANDOM_PICK.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const arr = JSON.parse(raw) as Array<{
              setName?: string;
              groupName?: string;
              algName?: string;
            }>;
            if (Array.isArray(arr)) {
              result[subKey] = arr.map((item) => ({
                setName: item.setName ?? "",
                groupName: item.groupName ?? "",
                algName: item.algName ?? "",
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

  let dailyRandomPick: unknown;
  try {
    const raw = localStorage.getItem(KEY_DAILY_PICK);
    if (raw) dailyRandomPick = JSON.parse(raw);
  } catch {
    // ignore
  }

  let customFormulas: Record<string, string[]> | undefined;
  try {
    const raw = localStorage.getItem(KEY_CUSTOM_FORMULAS);
    if (raw) customFormulas = JSON.parse(raw) as Record<string, string[]>;
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
    customFormulas,
  };
}

export function importPracticeConfig(
  jsonStr: string,
): { success: boolean; message?: string } {
  try {
    const data = JSON.parse(jsonStr) as Partial<PracticeConfigExport>;
    if (!data || typeof data !== "object") {
      return { success: false, message: "Invalid format" };
    }
    if (data.version !== 1) {
      return { success: false, message: "Unsupported version" };
    }

    if (data.proficiency && typeof data.proficiency === "object") {
      Object.entries(data.proficiency).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(
              `${PREFIX_PROFICIENCY}${subKey}`,
              JSON.stringify(val),
            );
          } catch {
            // ignore
          }
        }
      });
    }

    if (data.config && typeof data.config === "object") {
      Object.entries(data.config).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(
              `${PREFIX_CONFIG}${subKey}`,
              JSON.stringify(val),
            );
          } catch {
            // ignore
          }
        }
      });
    }

    if (data.selection && typeof data.selection === "object") {
      Object.entries(data.selection).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(
              `${PREFIX_SELECTION}${subKey}`,
              JSON.stringify(val),
            );
          } catch {
            // ignore
          }
        }
      });
    }

    if (data.formulaRandomPick && typeof data.formulaRandomPick === "object") {
      Object.entries(data.formulaRandomPick).forEach(([subKey, arr]) => {
        if (Array.isArray(arr)) {
          const items = arr.map((item) => ({
            setName: item?.setName ?? "",
            groupName: item?.groupName ?? "",
            algName: item?.algName ?? "",
            image: "",
          }));
          try {
            localStorage.setItem(
              `${PREFIX_RANDOM_PICK}${subKey}`,
              JSON.stringify(items),
            );
          } catch {
            // ignore
          }
        }
      });
    }

    if (
      data.formulaPracticeHistory &&
      typeof data.formulaPracticeHistory === "object"
    ) {
      Object.entries(data.formulaPracticeHistory).forEach(([subKey, val]) => {
        if (val != null) {
          try {
            localStorage.setItem(
              `${PREFIX_HISTORY}${subKey}`,
              JSON.stringify(val),
            );
          } catch {
            // ignore
          }
        }
      });
    }

    if (data.dailyRandomPick != null && typeof data.dailyRandomPick === "object") {
      try {
        localStorage.setItem(KEY_DAILY_PICK, JSON.stringify(data.dailyRandomPick));
      } catch {
        // ignore
      }
    }

    if (
      data.customFormulas != null &&
      typeof data.customFormulas === "object" &&
      !Array.isArray(data.customFormulas)
    ) {
      try {
        localStorage.setItem(
          KEY_CUSTOM_FORMULAS,
          JSON.stringify(data.customFormulas),
        );
      } catch {
        // ignore
      }
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Import failed",
    };
  }
}
