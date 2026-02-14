/**
 * 公式熟练度 - 用于权重随机模式
 * 存储 key: algs:formula_practice_proficiency:{cube}-{classId}
 */

const LS_KEY_PREFIX = 'algs:formula_practice_proficiency:';

/** 熟练度等级：完全熟练=权重最低，完全不会=权重最高 */
export type ProficiencyLevel = 'mastered' | 'skilled' | 'average' | 'unskilled' | 'unknown';

/** 熟练度对应的权重（用于随机抽取，权重越高越容易被抽到） */
export const PROFICIENCY_WEIGHTS: Record<ProficiencyLevel, number> = {
  mastered: 1,
  skilled: 2,
  average: 3,
  unskilled: 4,
  unknown: 5,
};

/** 默认熟练度（未标记时） */
export const DEFAULT_PROFICIENCY: ProficiencyLevel = 'average';

function getStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}

export type ProficiencyMap = Record<string, ProficiencyLevel>;

export function getFormulaProficiency(
  cube: string,
  classId: string,
): ProficiencyMap {
  try {
    const raw = localStorage.getItem(getStorageKey(cube, classId));
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, string>;
    const valid: ProficiencyLevel[] = ['mastered', 'skilled', 'average', 'unskilled', 'unknown'];
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
  try {
    const map = getFormulaProficiency(cube, classId);
    map[formulaKey] = level;
    localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getProficiencyLevel(
  cube: string,
  classId: string,
  formulaKey: string,
): ProficiencyLevel {
  const map = getFormulaProficiency(cube, classId);
  return map[formulaKey] ?? DEFAULT_PROFICIENCY;
}

/** 获取不熟练的公式 key 列表（unskilled 或 unknown） */
export function getUnskilledFormulaKeys(
  cube: string,
  classId: string,
): string[] {
  const map = getFormulaProficiency(cube, classId);
  return Object.entries(map)
    .filter(([, level]) => level === 'unskilled' || level === 'unknown')
    .map(([key]) => key);
}
