import type { MessageKey } from "@/i18n/messages/zh-CN";

const STORAGE_KEY = "cubing_pro_websize_ui_config";
export const PALETTE_STORAGE_KEY = "cubing-pro-palette";

export type WebsiteUiNavPreference = "light" | "realDark" | "system";

export type Palette =
  | "haitian"
  | "qingdai"
  | "zheshi"
  | "zhulu"
  | "xiangye"
  | "qinglian"
  | "rulin"
  | "doukou";

export type PaletteMeta = {
  id: Palette;
  labelKey: MessageKey;
  /** Preview swatches: accent, muted-foreground, foreground (light mode) */
  preview: { accent: string; muted: string; foreground: string };
  /** Optional link to source palette on 中国色 */
  sourceUrl?: string;
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "haitian",
    labelKey: "settings.palette.haitian",
    preview: { accent: "#1a8aad", muted: "#156d8c", foreground: "#0c3a4d" },
  },
  {
    id: "qingdai",
    labelKey: "settings.palette.qingdai",
    preview: { accent: "#1e5fa8", muted: "#3a4d7a", foreground: "#16223f" },
  },
  {
    id: "zheshi",
    labelKey: "settings.palette.zheshi",
    preview: { accent: "#b8553a", muted: "#7a5040", foreground: "#3a2018" },
  },
  {
    id: "zhulu",
    labelKey: "settings.palette.zhulu",
    preview: { accent: "#3f7d57", muted: "#3f6b4f", foreground: "#16321f" },
  },
  {
    id: "xiangye",
    labelKey: "settings.palette.xiangye",
    preview: { accent: "#a8761a", muted: "#6f5d22", foreground: "#352c12" },
  },
  {
    id: "qinglian",
    labelKey: "settings.palette.qinglian",
    preview: { accent: "#6b4a9c", muted: "#54407a", foreground: "#261540" },
  },
  {
    id: "rulin",
    labelKey: "settings.palette.rulin",
    preview: { accent: "#bc1b00", muted: "#8c0000", foreground: "#390000" },
    sourceUrl: "https://zhongguose.com/ai/users/clf9a9c11d4547461fb1ab3",
  },
  {
    id: "doukou",
    labelKey: "settings.palette.doukou",
    preview: { accent: "#854072", muted: "#5e1c4e", foreground: "#1e0015" },
    sourceUrl: "https://zhongguose.com/ai/users/cl242dbdf8bb6d452dbaa84",
  },
];

const PALETTE_IDS = new Set<string>(PALETTES.map((p) => p.id));

export function isPalette(value: string): value is Palette {
  return PALETTE_IDS.has(value);
}

export type WebsiteUiConfig = {
  navTheme?: WebsiteUiNavPreference;
  fontSizeBase?: number;
  palette?: Palette;
};

export function resolveEffectiveNavTheme(
  cfg: WebsiteUiConfig,
): "light" | "realDark" {
  const t = cfg.navTheme;
  if (t === "realDark") return "realDark";
  if (t === "light") return "light";
  if (t === "system" && typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "realDark"
      : "light";
  }
  return "light";
}

export function readPaletteFromStorage(): Palette {
  if (typeof window === "undefined") return "haitian";
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (raw && isPalette(raw)) return raw;
    const cfg = readWebsiteUiFromStorage();
    if (cfg.palette && isPalette(cfg.palette)) return cfg.palette;
  } catch {
    // ignore
  }
  return "haitian";
}

export function writePaletteToStorage(palette: Palette): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  } catch {
    // ignore quota
  }
}

export function applyPaletteToDocument(palette: Palette): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.palette = palette;
}

export function readWebsiteUiFromStorage(): WebsiteUiConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw) as WebsiteUiConfig;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function writeWebsiteUiToStorage(cfg: WebsiteUiConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    if (cfg.palette) {
      writePaletteToStorage(cfg.palette);
    }
  } catch {
    // ignore quota
  }
}

export function applyWebsiteUiToDocument(cfg: WebsiteUiConfig): void {
  if (typeof document === "undefined") return;
  const px = cfg.fontSizeBase;
  if (typeof px === "number" && px >= 12 && px <= 22) {
    document.documentElement.style.fontSize = `${px}px`;
  } else {
    document.documentElement.style.fontSize = "";
  }
  applyPaletteToDocument(cfg.palette ?? readPaletteFromStorage());
}

/** Persist palette immediately (header quick-switch) and merge into UI config. */
export function persistPalette(palette: Palette): WebsiteUiConfig {
  const cfg = { ...readWebsiteUiFromStorage(), palette };
  writeWebsiteUiToStorage(cfg);
  applyPaletteToDocument(palette);
  return cfg;
}
