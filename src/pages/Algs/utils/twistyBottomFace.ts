import type { CubeBottomFaceColor } from './storage';

/**
 * 将指定中心色转到 D 面（底面）的整魔方转动（experimentalSetupAlg）。
 * 与 cubing.js 默认 3×3 贴纸配色一致：U 白、D 黄、F 绿、B 蓝、R 红、L 橙（常见 WCA 观感）。
 */
export function bottomFaceToWholeCubeSetup(color: CubeBottomFaceColor): string {
  switch (color) {
    case 'yellow':
      return '';
    case 'white':
      return 'x2';
    case 'green':
      return 'x';
    case 'blue':
      return "x'";
    case 'red':
      return 'z';
    case 'orange':
      return "z'";
    default:
      return '';
  }
}
