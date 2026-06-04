const STORAGE_KEY = "cubing_pro_websize_ui_config";

export type WebsiteUiNavPreference = "light" | "realDark" | "system";

export type WebsiteUiConfig = {
  navTheme?: WebsiteUiNavPreference;
  fontSizeBase?: number;
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
}
