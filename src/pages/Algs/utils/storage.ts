const STORAGE_KEY = 'algs_user_selection';
const FONT_SIZE_KEY = 'algs_formula_font_size';
const DEFAULT_FONT_SIZE = 12;

export function getFormulaFontSize(): number {
  try {
    const raw = localStorage.getItem(FONT_SIZE_KEY);
    if (!raw) return DEFAULT_FONT_SIZE;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? DEFAULT_FONT_SIZE : Math.max(8, Math.min(24, n));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

export function setFormulaFontSize(size: number): void {
  try {
    const n = Math.max(8, Math.min(24, Math.round(size)));
    localStorage.setItem(FONT_SIZE_KEY, String(n));
  } catch {
    // ignore
  }
}

export type AlgsSelectionKey = string;

export function buildAlgsKey(
  cube: string,
  classId: string,
  set: string,
  group: string,
  algName: string,
): AlgsSelectionKey {
  return `${cube}-${classId}-${set}-${group}-${algName}`.replace(/\s+/g, '_');
}

export function getAlgsSelection(key: AlgsSelectionKey): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: Record<string, number> = JSON.parse(raw);
    const val = data[key];
    return typeof val === 'number' ? val : null;
  } catch {
    return null;
  }
}

export function setAlgsSelection(key: AlgsSelectionKey, index: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    data[key] = index;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
