/** Read a CSS custom property from :root (client-side). */
export function readCssVar(name: string, fallback = ""): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

/** Read a CSS custom property from a specific element (e.g. LightMode export subtree). */
export function readCssVarFrom(el: HTMLElement, name: string, fallback = ""): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

/** Mix two CSS color values via color-mix (browser-side). */
export function mixCssColors(
  base: string,
  mix: string,
  percent: number,
): string {
  return `color-mix(in srgb, ${base} ${percent}%, ${mix})`;
}

const FALLBACK = {
  accent: "#1a8aad",
  foreground: "#0c3a4d",
  background: "#f7fafb",
  card: "#ffffff",
  signalSuccess: "#5aac7e",
  signalWarning: "#d4a259",
  signalInfo: "#4a9eff",
  destructive: "#e05c5c",
};

/** Resolve semantic tokens for ECharts / canvas (client only). */
export function getThemeColors() {
  return {
    accent: readCssVar("--accent", FALLBACK.accent),
    foreground: readCssVar("--foreground", FALLBACK.foreground),
    background: readCssVar("--background", FALLBACK.background),
    card: readCssVar("--card", FALLBACK.card),
    mutedForeground: readCssVar("--muted-foreground", FALLBACK.foreground),
    faintForeground: readCssVar("--faint-foreground", FALLBACK.foreground),
    border: readCssVar("--border-default", FALLBACK.foreground),
    signalSuccess: readCssVar("--signal-success", FALLBACK.signalSuccess),
    signalWarning: readCssVar("--signal-warning", FALLBACK.signalWarning),
    signalInfo: readCssVar("--signal-info", FALLBACK.signalInfo),
    destructive: readCssVar("--destructive", FALLBACK.destructive),
  };
}

/** Chart series palette derived from theme accent + signals. */
export function getChartSeriesColors(count = 8): string[] {
  const c = getThemeColors();
  const base = [
    c.accent,
    c.signalSuccess,
    c.signalWarning,
    c.signalInfo,
    mixCssColors(c.accent, c.foreground, 70),
    mixCssColors(c.signalSuccess, c.foreground, 60),
    mixCssColors(c.signalWarning, c.foreground, 60),
    c.destructive,
  ];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(base[i % base.length]!);
  }
  return out;
}

export function getHeatmapScale(): string[] {
  const c = getThemeColors();
  return [
    mixCssColors(c.accent, c.background, 8),
    mixCssColors(c.accent, c.background, 25),
    mixCssColors(c.accent, c.background, 45),
    mixCssColors(c.accent, c.background, 65),
    c.accent,
  ];
}

export function getChartAxisStyle() {
  const c = getThemeColors();
  return {
    axisLine: { lineStyle: { color: c.border } },
    axisLabel: { color: c.mutedForeground },
    splitLine: { lineStyle: { color: mixCssColors(c.foreground, "transparent", 8) } },
  };
}

export function getChartTooltipStyle() {
  const c = getThemeColors();
  return {
    backgroundColor: c.card,
    borderColor: c.border,
    textStyle: { color: c.foreground },
  };
}
