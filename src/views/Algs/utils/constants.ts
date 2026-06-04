/** Chakra 语义 token 路径，随深浅色自动切换 */
export const ALGS_COLORS = {
  primary: "rgba(34, 168, 203, 0.55)",
  primaryHover: "rgba(34, 168, 203, 0.75)",
  cardBg: "algs.card.bg",
  cardBorder: "algs.card.border",
  cardDiagramBg: "algs.card.diagram",
  cardHoverBorder: "algs.card.hoverBorder",
  sectionBg: "algs.section.bg",
  buttonBg: "rgba(34, 168, 203, 0.55)",
  watermark: "rgba(34, 168, 203, 0.15)",
} as const;

export const SET_CARD_COLORS = [
  { bg: 'rgba(34, 168, 203, 0.12)', border: 'rgba(34, 168, 203, 0.55)', accent: '#22a8cb' },
  { bg: 'rgba(45, 148, 176, 0.12)', border: 'rgba(45, 148, 176, 0.55)', accent: '#2d94b0' },
  { bg: 'rgba(74, 175, 201, 0.12)', border: 'rgba(74, 175, 201, 0.55)', accent: '#4aafc9' },
  { bg: 'rgba(122, 201, 220, 0.12)', border: 'rgba(122, 201, 220, 0.55)', accent: '#7ac9dc' },
  { bg: 'rgba(169, 224, 235, 0.12)', border: 'rgba(169, 224, 235, 0.55)', accent: '#a9e0eb' },
  { bg: 'rgba(29, 95, 117, 0.12)', border: 'rgba(29, 95, 117, 0.55)', accent: '#1d5f75' },
] as const;

export const PRACTICE_COLORS = {
  random: { bg: 'rgba(34, 168, 203, 0.08)', border: 'rgba(34, 168, 203, 0.45)' },
  practice: { bg: 'rgba(0, 185, 204, 0.08)', border: 'rgba(0, 185, 204, 0.45)' },
  proficiency: { bg: 'rgba(45, 148, 176, 0.08)', border: 'rgba(45, 148, 176, 0.45)' },
  history: { bg: 'rgba(250, 173, 20, 0.08)', border: 'rgba(250, 173, 20, 0.45)' },
  batch: { bg: 'rgba(114, 46, 209, 0.08)', border: 'rgba(114, 46, 209, 0.45)' },
} as const;
