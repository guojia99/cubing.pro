/** Chakra semantic token paths — follow theme / palette automatically */
export const ALGS_COLORS = {
  primary: "accent",
  primaryHover: "accent.emphasis",
  cardBg: "algs.card.bg",
  cardBorder: "algs.card.border",
  cardDiagramBg: "algs.card.diagram",
  cardHoverBorder: "algs.card.hoverBorder",
  sectionBg: "algs.section.bg",
  buttonBg: "accent.soft",
  watermark: "accent.soft",
} as const;

/** Formula set group cards — accent-derived mixes (inline style safe) */
export const SET_CARD_COLORS = [
  {
    bg: "color-mix(in srgb, var(--accent) 12%, transparent)",
    border: "color-mix(in srgb, var(--accent) 55%, transparent)",
    accent: "var(--accent)",
  },
  {
    bg: "color-mix(in srgb, var(--accent) 10%, var(--card))",
    border: "color-mix(in srgb, var(--accent) 45%, transparent)",
    accent: "color-mix(in srgb, var(--accent) 88%, var(--foreground))",
  },
  {
    bg: "color-mix(in srgb, var(--accent) 8%, var(--muted))",
    border: "color-mix(in srgb, var(--accent) 40%, transparent)",
    accent: "color-mix(in srgb, var(--accent) 70%, white)",
  },
  {
    bg: "color-mix(in srgb, var(--foreground) 4%, var(--card))",
    border: "color-mix(in srgb, var(--accent) 35%, transparent)",
    accent: "var(--muted-foreground)",
  },
  {
    bg: "color-mix(in srgb, var(--accent) 6%, var(--background))",
    border: "color-mix(in srgb, var(--accent) 30%, transparent)",
    accent: "var(--faint-foreground)",
  },
  {
    bg: "color-mix(in srgb, var(--foreground) 6%, var(--card))",
    border: "color-mix(in srgb, var(--foreground) 18%, transparent)",
    accent: "var(--foreground)",
  },
] as const;

/** Practice tool panel accents — semantic signals + accent */
export const PRACTICE_COLORS = {
  random: {
    bg: "color-mix(in srgb, var(--accent) 8%, transparent)",
    border: "color-mix(in srgb, var(--accent) 45%, transparent)",
  },
  practice: {
    bg: "color-mix(in srgb, var(--signal-info) 8%, transparent)",
    border: "color-mix(in srgb, var(--signal-info) 45%, transparent)",
  },
  proficiency: {
    bg: "color-mix(in srgb, var(--accent) 6%, transparent)",
    border: "color-mix(in srgb, var(--accent) 40%, transparent)",
  },
  history: {
    bg: "color-mix(in srgb, var(--signal-warning) 8%, transparent)",
    border: "color-mix(in srgb, var(--signal-warning) 45%, transparent)",
  },
  batch: {
    bg: "color-mix(in srgb, var(--accent) 10%, var(--muted))",
    border: "color-mix(in srgb, var(--accent) 50%, transparent)",
  },
} as const;
