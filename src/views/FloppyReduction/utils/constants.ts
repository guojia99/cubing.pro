/**
 * Floppy Reduction — semantic color tokens (see docs/color.md).
 * Use Chakra token paths / CSS var mixes; never raw palette names (purple, green, blue…).
 */
export const FR_COLORS = {
  /** Primary Button / Badge colorPalette → maps to --accent via theme brand recipe */
  palette: "brand",
  accent: "accent",
  accentFg: "accent.fg",
  accentSoft: "accent.soft",
  border: "border",
  fg: "fg",
  fgMuted: "fg.muted",
  bgSubtle: "bg.subtle",
  success: "signal.success",
  warning: "signal.warning",
  destructive: "signal.destructive",
  destructiveFg: "signal.destructiveFg",
  successSoft: "color-mix(in srgb, var(--signal-success) 14%, transparent)",
  warningSoft: "color-mix(in srgb, var(--signal-warning) 14%, transparent)",
  destructiveSoft: "color-mix(in srgb, var(--signal-destructive) 14%, transparent)",
} as const;
