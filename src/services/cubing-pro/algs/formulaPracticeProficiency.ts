const KEY_PREFIX = "algs:formula_practice_proficiency:";

export type ProficiencyLevel = "mastered" | "skilled" | "average" | "unskilled" | "unknown";

export const PROFICIENCY_WEIGHTS: Record<ProficiencyLevel, number> = {
  mastered: 1,
  skilled: 2,
  average: 3,
  unskilled: 4,
  unknown: 5,
};

export const DEFAULT_PROFICIENCY: ProficiencyLevel = "average";

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  mastered: "精通",
  skilled: "熟练",
  average: "一般",
  unskilled: "生疏",
  unknown: "未知",
};

type ProficiencyMap = Record<string, ProficiencyLevel>;

function storageKey(cube: string, classId: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}

export function getFormulaProficiency(cube: string, classId: string): ProficiencyMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(cube, classId));
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, string>;
    const valid: ProficiencyLevel[] = ["mastered", "skilled", "average", "unskilled", "unknown"];
    const result: ProficiencyMap = {};
    Object.entries(data).forEach(([key, val]) => {
      if (valid.includes(val as ProficiencyLevel)) {
        result[key] = val as ProficiencyLevel;
      }
    });
    return result;
  } catch {
    return {};
  }
}

export function setFormulaProficiency(
  cube: string,
  classId: string,
  formulaKey: string,
  level: ProficiencyLevel,
): void {
  if (!cube || !classId) return;
  const map = getFormulaProficiency(cube, classId);
  map[formulaKey] = level;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(cube, classId), JSON.stringify(map));
  } catch {}
}

export function getProficiencyLevel(
  cube: string,
  classId: string,
  formulaKey: string,
): ProficiencyLevel {
  return getFormulaProficiency(cube, classId)[formulaKey] ?? DEFAULT_PROFICIENCY;
}

export function getUnskilledFormulaKeys(cube: string, classId: string): string[] {
  const map = getFormulaProficiency(cube, classId);
  return Object.entries(map)
    .filter(([, level]) => level === "unskilled" || level === "unknown")
    .map(([key]) => key);
}
