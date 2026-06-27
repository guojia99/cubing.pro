/** 全屏对战动画可配置项（由 liveUiSettings 统一持久化） */
export type PkArenaSettings = {
  /** 全屏对战：各队伍栏内底部动态波浪装饰 */
  flagBackgroundEnabled: boolean;
  scale: number;
  backgroundColor: string;
  backgroundColorEnd: string;
  glowLeft: string;
  glowRight: string;
  stripLeft: string;
  stripRight: string;
  teamNameColor: string;
  teamNameFontPx: number;
  playerNameColor: string;
  playerNameFontPx: number;
  pkTitleColor: string;
  pkTitleFontPx: number;
  avatarSizePx: number;
  diagonalStepPx: number;
  buttonFontPx: number;
  barBg: string;
  /** 点击队员展开详情：头像边长 (px) */
  heroDetailAvatarPx: number;
  /** 点击队员展开详情：姓名字号 (px) */
  heroDetailNameFontPx: number;
  /** 点击队员展开详情：本场成绩字号 (px) */
  heroDetailPkScoreFontPx: number;
  /** 点击队员展开详情：种子成绩行字号 (px) */
  heroDetailSeedFontPx: number;
  /** 点击队员展开详情：顶部队名字号 (px) */
  heroDetailTeamFontPx: number;
  /** 点击队员展开详情：学校等副标题字号 (px) */
  heroDetailSchoolFontPx: number;
  /** 点击队员展开详情：宣言/标签字号 (px) */
  heroDetailCryFontPx: number;
  /** 队员轮播：每人展示时长 (ms)，默认 3000 */
  heroCarouselIntervalMs: number;
};

export function getDefaultPkArenaSettings(): PkArenaSettings {
  return {
    flagBackgroundEnabled: true,
    scale: 1,
    backgroundColor: '#06060c',
    backgroundColorEnd: '#10101c',
    glowLeft: 'rgba(255, 77, 79, 0.42)',
    glowRight: 'rgba(22, 119, 255, 0.45)',
    stripLeft: 'rgba(255, 77, 79, 0.22)',
    stripRight: 'rgba(22, 119, 255, 0.22)',
    teamNameColor: '#ffffff',
    teamNameFontPx: 30,
    playerNameColor: '#f5f5f5',
    playerNameFontPx: 20,
    pkTitleColor: '#ffffff',
    pkTitleFontPx: 52,
    avatarSizePx: 80,
    diagonalStepPx: 36,
    buttonFontPx: 16,
    barBg: 'rgba(0, 0, 0, 0.35)',
    heroDetailAvatarPx: 300,
    heroDetailNameFontPx: 56,
    heroDetailPkScoreFontPx: 48,
    heroDetailSeedFontPx: 28,
    heroDetailTeamFontPx: 24,
    heroDetailSchoolFontPx: 20,
    heroDetailCryFontPx: 22,
    heroCarouselIntervalMs: 3000,
  };
}
