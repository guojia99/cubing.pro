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

export type AlgsSelectionValue = {
  source: 'library' | 'custom';
  index: number;
};

export function buildAlgsKey(
  cube: string,
  classId: string,
  set: string,
  group: string,
  algName: string,
): AlgsSelectionKey {
  return `${cube}-${classId}-${set}-${group}-${algName}`.replace(/\s+/g, '_');
}

export function getAlgsSelection(key: AlgsSelectionKey): AlgsSelectionValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: Record<string, unknown> = JSON.parse(raw);
    const val = data[key];
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return { source: 'library', index: val };
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj.source === 'string' && typeof obj.index === 'number') {
        return {
          source: obj.source === 'custom' ? 'custom' : 'library',
          index: obj.index,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function setAlgsSelection(key: AlgsSelectionKey, value: AlgsSelectionValue): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, unknown> = raw ? JSON.parse(raw) : {};
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const USE_VISUAL_CUBE_RENDERER_KEY = 'algs_use_visualcube_renderer';

/** 333 / 222 / 333oh 是否用 VisualCube 渲染公式图（开发者可切回后端 SVG） */
export function getUseVisualCubeRenderer(): boolean {
  try {
    const v = localStorage.getItem(USE_VISUAL_CUBE_RENDERER_KEY);
    if (v === '0' || v === 'false') return false;
    if (v === '1' || v === 'true') return true;
  } catch {
    // ignore
  }
  return true;
}

export function setUseVisualCubeRenderer(enabled: boolean): void {
  try {
    localStorage.setItem(USE_VISUAL_CUBE_RENDERER_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

const COLUMNS_PER_ROW_BY_REPO_KEY = 'algs_columns_per_row_by_repo';
const DEFAULT_COLUMNS_PER_ROW = 4;
const MIN_COLUMNS_PER_ROW = 1;
const MAX_COLUMNS_PER_ROW = 8;

function repoLayoutKey(cube: string, classId: string): string {
  return `${encodeURIComponent(cube)}::${encodeURIComponent(classId)}`;
}

function clampColumnsPerRow(n: number): number {
  return Math.max(MIN_COLUMNS_PER_ROW, Math.min(MAX_COLUMNS_PER_ROW, Math.round(n)));
}

/** 按公式库（cube + classId）保存：详情页每行展示的公式卡片数量 */
export function getColumnsPerRow(cube: string, classId: string): number {
  try {
    const raw = localStorage.getItem(COLUMNS_PER_ROW_BY_REPO_KEY);
    if (!raw) return DEFAULT_COLUMNS_PER_ROW;
    const map = JSON.parse(raw) as Record<string, number>;
    const v = map[repoLayoutKey(cube, classId)];
    if (typeof v === 'number' && !Number.isNaN(v)) {
      return clampColumnsPerRow(v);
    }
  } catch {
    // ignore
  }
  return DEFAULT_COLUMNS_PER_ROW;
}

export function setColumnsPerRow(cube: string, classId: string, columns: number): void {
  try {
    const raw = localStorage.getItem(COLUMNS_PER_ROW_BY_REPO_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[repoLayoutKey(cube, classId)] = clampColumnsPerRow(columns);
    localStorage.setItem(COLUMNS_PER_ROW_BY_REPO_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const HIDE_ALT_FORMULAS_BY_REPO_KEY = 'algs_hide_alt_formulas_by_repo';

/** 单行布局时是否隐藏备选公式（按公式库） */
export function getHideAltFormulas(cube: string, classId: string): boolean {
  try {
    const raw = localStorage.getItem(HIDE_ALT_FORMULAS_BY_REPO_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[repoLayoutKey(cube, classId)] === true;
  } catch {
    // ignore
  }
  return false;
}

export function setHideAltFormulas(cube: string, classId: string, hide: boolean): void {
  try {
    const raw = localStorage.getItem(HIDE_ALT_FORMULAS_BY_REPO_KEY);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    map[repoLayoutKey(cube, classId)] = hide;
    localStorage.setItem(HIDE_ALT_FORMULAS_BY_REPO_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const HIDDEN_FORMULAS_BY_REPO_KEY = 'algs_hidden_formulas_by_repo';

/** 按公式库保存已隐藏的公式 key（set:group:name），未在列表中的公式默认显示 */
export function getHiddenFormulaKeys(cube: string, classId: string): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_FORMULAS_BY_REPO_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    const list = map[repoLayoutKey(cube, classId)];
    return Array.isArray(list) ? list : [];
  } catch {
    // ignore
  }
  return [];
}

export function setHiddenFormulaKeys(cube: string, classId: string, keys: string[]): void {
  try {
    const raw = localStorage.getItem(HIDDEN_FORMULAS_BY_REPO_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    map[repoLayoutKey(cube, classId)] = keys;
    localStorage.setItem(HIDDEN_FORMULAS_BY_REPO_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
