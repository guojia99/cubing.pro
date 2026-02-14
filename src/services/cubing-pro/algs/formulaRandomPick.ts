const LS_KEY_PREFIX = 'algs:formula_random_pick:';
const MAX_HISTORY = 10;

export interface FormulaPickItem {
  setName: string;
  groupName: string;
  algName: string;
  image: string;
}

function getStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
}

export function getFormulaPickHistory(cube: string, classId: string): FormulaPickItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(cube, classId));
    if (!raw) return [];
    const data = JSON.parse(raw) as FormulaPickItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveFormulaPick(
  cube: string,
  classId: string,
  item: FormulaPickItem,
): void {
  const history = getFormulaPickHistory(cube, classId);
  const next = [item, ...history.filter((h) => !isSamePick(h, item))].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

function isSamePick(a: FormulaPickItem, b: FormulaPickItem): boolean {
  return a.setName === b.setName && a.groupName === b.groupName && a.algName === b.algName;
}
