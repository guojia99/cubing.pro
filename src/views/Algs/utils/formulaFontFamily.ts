const STORAGE_KEY = 'algs_formula_font_family';

export type FormulaFontFamilyId =
  | 'system'
  | 'monospace'
  | 'heiti'
  | 'yahei'
  | 'songti'
  | 'kaiti'
  | 'fangsong'
  | 'pingfang'
  | 'notoSansSc'
  | 'sourceHanSans'
  | 'arial'
  | 'helvetica'
  | 'timesNewRoman'
  | 'georgia'
  | 'courierNew';

export const FORMULA_FONT_FAMILY_IDS: FormulaFontFamilyId[] = [
  'system',
  'monospace',
  'heiti',
  'yahei',
  'songti',
  'kaiti',
  'fangsong',
  'pingfang',
  'notoSansSc',
  'sourceHanSans',
  'arial',
  'helvetica',
  'timesNewRoman',
  'georgia',
  'courierNew',
];

const DEFAULT_FONT_FAMILY: FormulaFontFamilyId = 'monospace';

const FONT_FAMILY_CSS: Record<FormulaFontFamilyId, string> = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  monospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  heiti: '"Heiti SC", "SimHei", "PingFang SC", sans-serif',
  yahei: '"Microsoft YaHei", "PingFang SC", sans-serif',
  songti: '"Songti SC", "SimSun", serif',
  kaiti: '"KaiTi", "STKaiti", serif',
  fangsong: '"FangSong", "STFangsong", serif',
  pingfang: '"PingFang SC", "Hiragino Sans GB", sans-serif',
  notoSansSc: '"Noto Sans SC", "Source Han Sans SC", sans-serif',
  sourceHanSans: '"Source Han Sans SC", "Noto Sans SC", sans-serif',
  arial: 'Arial, "Helvetica Neue", sans-serif',
  helvetica: 'Helvetica, Arial, sans-serif',
  timesNewRoman: '"Times New Roman", Times, serif',
  georgia: 'Georgia, Times, serif',
  courierNew: '"Courier New", Courier, monospace',
};

function isValidId(value: string): value is FormulaFontFamilyId {
  return (FORMULA_FONT_FAMILY_IDS as string[]).includes(value);
}

export function getFormulaFontFamily(): FormulaFontFamilyId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isValidId(raw)) return raw;
  } catch {}
  return DEFAULT_FONT_FAMILY;
}

export function setFormulaFontFamily(id: FormulaFontFamilyId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

export function getFormulaFontFamilyCSSValue(id?: FormulaFontFamilyId): string {
  const resolved = id ?? getFormulaFontFamily();
  return FONT_FAMILY_CSS[resolved] ?? FONT_FAMILY_CSS[DEFAULT_FONT_FAMILY];
}
