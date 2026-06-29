/**
 * Domain-fixed colors — intentionally NOT tied to theme/palette switches.
 * Used for cube sticker colors, PK team colors, drawing tool palettes, etc.
 */

/** Standard WCA-style cube face colors */
export const CUBE_FACE_COLORS = {
  white: "#ffffff",
  yellow: "#ffd500",
  red: "#b71234",
  orange: "#ff5800",
  blue: "#0046ad",
  green: "#009b48",
} as const;

/** PK / team match default team colors */
export const PK_TEAM_COLORS = {
  teamA: "#22a8cb",
  teamB: "#e05c5c",
  teamC: "#5aac7e",
  teamD: "#d4a259",
} as const;

/** Bracket wing accent borders (domain-fixed, not skin tokens) */
export const PK_BRACKET_WING = {
  left: PK_TEAM_COLORS.teamA,
  right: "#fa8c16",
} as const;

/** Draw tool: transparent / eraser */
export const DRAW_TRANSPARENT = "#00000000";

/** Draw tool: neutral unstickered face gray */
export const DRAW_NEUTRAL_STICKER = "#777777";

/** Draw tool default font color — structural; resolved via theme at runtime */
export const DRAW_FONT_COLOR = "var(--foreground)";

/** Draw tool default sticker palette (generic) */
export const DRAW_STICKER_PALETTE = [
  "#ffffff",
  "#ffd500",
  "#b71234",
  "#ff5800",
  "#0046ad",
  "#009b48",
  "#888888",
  "#333333",
] as const;

/** Skewb / Pyraminx sticker palette */
export const SKEWB_STICKER_PALETTE = [
  DRAW_TRANSPARENT,
  "#033fff",
  "#f3ff00",
  "#d10707",
  "#ff8806",
  "#206606",
  "#3d3d3d",
  "#f5f3db",
  DRAW_NEUTRAL_STICKER,
] as const;

export const PYRAMINX_STICKER_PALETTE = SKEWB_STICKER_PALETTE;

/** SQ1 sticker palette */
export const SQ1_STICKER_PALETTE = [
  DRAW_TRANSPARENT,
  "#033fff",
  "#f3ff00",
  "#d10707",
  "#206606",
  "#ff8806",
  "#3d3d3d",
  "#f5f3db",
  DRAW_NEUTRAL_STICKER,
] as const;

/** Megaminx sticker palette */
export const MEGAMINX_STICKER_PALETTE = [
  DRAW_TRANSPARENT,
  "#033fff",
  "#f3ff00",
  "#d10707",
  "#b112d8",
  "#206606",
  "#ebf076",
  "#4dd800",
  "#ff8806",
  "#f18886",
  "#60a8f1",
  "#3d3d3d",
  "#f5f3db",
  DRAW_NEUTRAL_STICKER,
] as const;

/** Admin antd pages — legacy palette whitelist */
export const ADMIN_LEGACY = {
  linkBlue: "#1677ff",
  successGreen: "#52c41a",
  warningGold: "#faad14",
  errorRed: "#ff4d4f",
  /** Organizers comp row action buttons */
  actionCyan: "#13c2c2",
  actionBlue: "#4ba3f6",
  actionPink: "#ff3bac",
  actionLime: "#a0d911",
  pendingGold: "#F4D95B",
  tooltipGold: "#d5ad62",
  buttonTextOnColor: "#ffc",
  dangerText: "#cf1322",
  pureRed: "#ff0000",
} as const;

/** Olympic podium medal colors — fixed, not theme-dependent */
export const MEDAL_COLORS = {
  gold: "#ffd700",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
} as const;

export const MEDAL_RGB: Record<number, readonly [number, number, number]> = {
  1: [255, 215, 0],
  2: [192, 192, 192],
  3: [205, 127, 50],
};
