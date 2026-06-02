const STORAGE_KEY = 'algs_formula_font_family';

export type FormulaFontFamilyId =
  | 'system'
  | 'monospace'
  | 'heiti'
  | 'yahei'
  | 'songti'
  | 'kaiti'
  | 'fangsong'
  | 'dengxian'
  | 'pingfang'
  | 'hiragino'
  | 'notoSansSc'
  | 'sourceHanSans'
  | 'arial'
  | 'timesNewRoman'
  | 'georgia'
  | 'courierNew'
  | 'helvetica';

export const FORMULA_FONT_FAMILY_IDS: FormulaFontFamilyId[] = [
  'system',
  'monospace',
  'heiti',
  'yahei',
  'songti',
  'kaiti',
  'fangsong',
  'dengxian',
  'pingfang',
  'hiragino',
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
  system:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  heiti: '"Heiti SC", "SimHei", "STHeiti", "PingFang SC", sans-serif',
  yahei: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif',
  songti: '"Songti SC", "SimSun", "STSong", serif',
  kaiti: '"KaiTi", "STKaiti", "PingFang SC", serif',
  fangsong: '"FangSong", "STFangsong", "PingFang SC", serif',
  dengxian: '"DengXian", "等线", "Microsoft YaHei", sans-serif',
  pingfang: '"PingFang SC", "PingFang TC", "Hiragino Sans GB", sans-serif',
  hiragino: '"Hiragino Sans GB", "PingFang SC", "Microsoft YaHei", sans-serif',
  notoSansSc: '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif',
  sourceHanSans:
    '"Source Han Sans SC", "Source Han Sans CN", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  helvetica: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  timesNewRoman: '"Times New Roman", Times, "Songti SC", serif',
  georgia: 'Georgia, "Times New Roman", Times, serif',
  courierNew: '"Courier New", Courier, ui-monospace, monospace',
};

/** 用于检测是否已安装；null 表示不检测（系统/通用回退栈） */
const PRIMARY_CHECK_FONT: Partial<Record<FormulaFontFamilyId, string>> = {
  heiti: 'SimHei',
  yahei: 'Microsoft YaHei',
  songti: 'SimSun',
  kaiti: 'KaiTi',
  fangsong: 'FangSong',
  dengxian: 'DengXian',
  pingfang: 'PingFang SC',
  hiragino: 'Hiragino Sans GB',
  notoSansSc: 'Noto Sans SC',
  sourceHanSans: 'Source Han Sans SC',
  arial: 'Arial',
  helvetica: 'Helvetica',
  timesNewRoman: 'Times New Roman',
  georgia: 'Georgia',
  courierNew: 'Courier New',
};

/** 开源或官方可下载字体链接 */
export const FORMULA_FONT_DOWNLOAD_URL: Partial<Record<FormulaFontFamilyId, string>> = {
  notoSansSc: 'https://fonts.google.com/noto/specimen/Noto+Sans+SC',
  sourceHanSans: 'https://github.com/adobe-fonts/source-han-sans/releases',
};

function isFormulaFontFamilyId(value: string): value is FormulaFontFamilyId {
  return (FORMULA_FONT_FAMILY_IDS as string[]).includes(value);
}

export function getFormulaFontFamily(): FormulaFontFamilyId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isFormulaFontFamilyId(raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_FONT_FAMILY;
}

export function setFormulaFontFamily(id: FormulaFontFamilyId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function getFormulaFontFamilyCSSValue(id?: FormulaFontFamilyId): string {
  const resolved = id ?? getFormulaFontFamily();
  return FONT_FAMILY_CSS[resolved] ?? FONT_FAMILY_CSS[DEFAULT_FONT_FAMILY];
}

export function getFormulaFontPrimaryCheckName(id: FormulaFontFamilyId): string | null {
  return PRIMARY_CHECK_FONT[id] ?? null;
}

export function getFormulaFontDownloadUrl(id: FormulaFontFamilyId): string | undefined {
  return FORMULA_FONT_DOWNLOAD_URL[id];
}

function quoteFontFamily(name: string): string {
  return name.includes(' ') ? `"${name}"` : name;
}

/** Canvas 测量：目标字体与 monospace 回退宽度不同则认为已安装 */
function isFontAvailableByCanvas(fontName: string): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const sample = 'mmmmmmmmmmlli';
    const size = 72;
    ctx.font = `${size}px monospace`;
    const fallbackWidth = ctx.measureText(sample).width;
    ctx.font = `${size}px ${quoteFontFamily(fontName)}, monospace`;
    return ctx.measureText(sample).width !== fallbackWidth;
  } catch {
    return true;
  }
}

/** 检测本机是否已安装该字体选项的主字体 */
export function isFormulaFontInstalled(id: FormulaFontFamilyId): boolean {
  const primary = getFormulaFontPrimaryCheckName(id);
  if (!primary) return true;

  if (typeof document !== 'undefined' && document.fonts?.check) {
    try {
      const quoted = quoteFontFamily(primary);
      if (document.fonts.check(`16px ${quoted}`)) {
        return true;
      }
    } catch {
      // fall through to canvas
    }
  }

  return isFontAvailableByCanvas(primary);
}
