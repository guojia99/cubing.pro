import type { CubeBottomFaceColor } from './storage';

/** 与 cubing.js Cube3D 中 face 下标一致：U=0,L=1,F=2,R=3,B=4,D=5 */
export const TWISTY_FACE_ORDER = ['U', 'L', 'F', 'R', 'B', 'D'] as const;
export type TwistyStickerFaceKey = (typeof TWISTY_FACE_ORDER)[number];

/**
 * 六面贴纸颜色（与 Twisty 空间朝向 U/D/F/B/L/R 对应）。
 * 标准魔方关系：白↔黄、绿↔蓝、红↔橙 为三对对面。
 */
export type TwistyStickerFaceColorScheme = Record<TwistyStickerFaceKey, string>;

/** 常用 WCA 观感 HEX（可与 cubing 默认 Cube3D 配色对齐） */
export const WCA_HEX = {
  white: '#ffffff',
  yellow: '#fde800',
  red: '#ff0036',
  orange: '#ff5600',
  green: '#00ff77',
  blue: '#0067ff',
} as const;

/**
 * 根据「底面中心为哪种颜色」生成完整六面配色，保持对面关系正确。
 * 参考：底为黄时采用常见 Western：U 白 D 黄 F 绿 B 蓝 R 红 L 橙。
 */
export function wcaStickerColorSchemeForBottom(bottom: CubeBottomFaceColor): TwistyStickerFaceColorScheme {
  const H = WCA_HEX;
  switch (bottom) {
    case 'yellow':
      return { U: H.white, D: H.yellow, F: H.green, B: H.blue, R: H.red, L: H.orange };
    case 'white':
      return { U: H.yellow, D: H.white, F: H.green, B: H.blue, R: H.red, L: H.orange };
    case 'red':
      return { U: H.orange, D: H.red, F: H.green, B: H.blue, R: H.white, L: H.yellow };
    case 'orange':
      return { U: H.red, D: H.orange, F: H.green, B: H.blue, R: H.white, L: H.yellow };
    case 'green':
      return { U: H.blue, D: H.green, F: H.white, B: H.yellow, R: H.red, L: H.orange };
    case 'blue':
      return { U: H.green, D: H.blue, F: H.white, B: H.yellow, R: H.red, L: H.orange };
    default:
      return wcaStickerColorSchemeForBottom('yellow');
  }
}
