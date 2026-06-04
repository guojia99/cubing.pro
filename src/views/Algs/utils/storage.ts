import {
  clampDiagramSize,
  DEFAULT_DIAGRAM_SIZE,
} from "./diagramDisplay";

const STORAGE_KEY = 'algs_user_selection';
const FONT_SIZE_KEY = 'algs_formula_font_size';
const DEFAULT_FONT_SIZE = 14;
const DIAGRAM_SIZE_KEY = 'algs_diagram_max_size';
const HIDE_DIAGRAM_KEY = 'algs_hide_formula_diagram';

export function getFormulaFontSize(): number {
  try {
    const raw = localStorage.getItem(FONT_SIZE_KEY);
    if (!raw) return DEFAULT_FONT_SIZE;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? DEFAULT_FONT_SIZE : Math.max(8, Math.min(32, n));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

export function setFormulaFontSize(size: number): void {
  try {
    localStorage.setItem(FONT_SIZE_KEY, String(Math.max(8, Math.min(32, Math.round(size)))));
  } catch {}
}

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
): string {
  return `${cube}-${classId}-${set}-${group}-${algName}`.replace(/\s+/g, '_');
}

export function getAlgsSelection(key: string): AlgsSelectionValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: Record<string, unknown> = JSON.parse(raw);
    const val = data[key];
    if (val == null) return null;
    if (typeof val === 'number') return { source: 'library', index: val };
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj.source === 'string' && typeof obj.index === 'number') {
        return { source: obj.source === 'custom' ? 'custom' : 'library', index: obj.index };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function setAlgsSelection(key: string, value: AlgsSelectionValue): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, unknown> = raw ? JSON.parse(raw) : {};
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const USE_VC_KEY = 'algs_use_visualcube_renderer';

export function getUseVisualCubeRenderer(): boolean {
  try {
    const v = localStorage.getItem(USE_VC_KEY);
    if (v === '0' || v === 'false') return false;
    if (v === '1' || v === 'true') return true;
  } catch {}
  return true;
}

export function setUseVisualCubeRenderer(enabled: boolean): void {
  try {
    localStorage.setItem(USE_VC_KEY, enabled ? '1' : '0');
  } catch {}
}

export function getDiagramSize(): number {
  try {
    const raw = localStorage.getItem(DIAGRAM_SIZE_KEY);
    if (!raw) return DEFAULT_DIAGRAM_SIZE;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? DEFAULT_DIAGRAM_SIZE : clampDiagramSize(n);
  } catch {
    return DEFAULT_DIAGRAM_SIZE;
  }
}

export function setDiagramSize(size: number): void {
  try {
    localStorage.setItem(DIAGRAM_SIZE_KEY, String(clampDiagramSize(size)));
  } catch {}
}

export function getHideFormulaDiagram(): boolean {
  try {
    const v = localStorage.getItem(HIDE_DIAGRAM_KEY);
    return v === '1' || v === 'true';
  } catch {}
  return false;
}

export function setHideFormulaDiagram(hide: boolean): void {
  try {
    localStorage.setItem(HIDE_DIAGRAM_KEY, hide ? '1' : '0');
  } catch {}
}

const COLS_KEY = 'algs_columns_per_row_by_repo';
const DEFAULT_COLS = 4;

function repoKey(cube: string, classId: string): string {
  return `${encodeURIComponent(cube)}::${encodeURIComponent(classId)}`;
}

function clampCols(n: number): number {
  return Math.max(1, Math.min(8, Math.round(n)));
}

export function getColumnsPerRow(cube: string, classId: string): number {
  try {
    const raw = localStorage.getItem(COLS_KEY);
    if (!raw) return DEFAULT_COLS;
    const map = JSON.parse(raw) as Record<string, number>;
    const v = map[repoKey(cube, classId)];
    if (typeof v === 'number' && !Number.isNaN(v)) return clampCols(v);
  } catch {}
  return DEFAULT_COLS;
}

export function setColumnsPerRow(cube: string, classId: string, columns: number): void {
  try {
    const raw = localStorage.getItem(COLS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[repoKey(cube, classId)] = clampCols(columns);
    localStorage.setItem(COLS_KEY, JSON.stringify(map));
  } catch {}
}

const HIDE_ALT_KEY = 'algs_hide_alt_formulas_by_repo';

export function getHideAltFormulas(cube: string, classId: string): boolean {
  try {
    const raw = localStorage.getItem(HIDE_ALT_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[repoKey(cube, classId)] === true;
  } catch {}
  return false;
}

export function setHideAltFormulas(cube: string, classId: string, hide: boolean): void {
  try {
    const raw = localStorage.getItem(HIDE_ALT_KEY);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    map[repoKey(cube, classId)] = hide;
    localStorage.setItem(HIDE_ALT_KEY, JSON.stringify(map));
  } catch {}
}

const HIDDEN_KEY = 'algs_hidden_formulas_by_repo';

export function getHiddenFormulaKeys(cube: string, classId: string): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    const list = map[repoKey(cube, classId)];
    return Array.isArray(list) ? list : [];
  } catch {}
  return [];
}

export function setHiddenFormulaKeys(cube: string, classId: string, keys: string[]): void {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    map[repoKey(cube, classId)] = keys;
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(map));
  } catch {}
}
