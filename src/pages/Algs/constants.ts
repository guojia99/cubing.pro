export const ALGS_COLORS = {
  primary: 'rgba(100, 149, 237, 0.55)',      // 淡蓝色 55% 透明度
  primaryHover: 'rgba(100, 149, 237, 0.75)',
  cardBg: 'rgba(230, 240, 255, 0.55)',
  cardBorder: 'rgba(100, 149, 237, 0.35)',
  buttonBg: 'rgba(100, 149, 237, 0.55)',
  watermark: 'rgba(100, 149, 237, 0.15)',
} as const;

export const SET_CARD_COLORS = [
  { bg: 'rgba(100, 149, 237, 0.55)', border: 'rgba(100, 149, 237, 0.55)' },
  { bg: 'rgba(82, 196, 26, 0.55)', border: 'rgba(82, 196, 26, 0.55)' },
  { bg: 'rgba(250, 173, 20, 0.55)', border: 'rgba(250, 173, 20, 0.55)' },
  { bg: 'rgba(250, 84, 28, 0.55)', border: 'rgba(250, 84, 28, 0.55)' },
  { bg: 'rgba(114, 46, 209, 0.55)', border: 'rgba(114, 46, 209, 0.55)' },
  { bg: 'rgba(0, 185, 204, 0.55)', border: 'rgba(0, 185, 204, 0.55)' },
];

export const CARD_ANIMATION = {
  float: {
    animation: 'algsFloat 3s ease-in-out infinite',
  },
};
