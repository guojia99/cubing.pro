import { PK_BRACKET_WING, PK_TEAM_COLORS } from '@/theme/domainColors';

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
    backgroundColor: 'var(--background)',
    backgroundColorEnd: 'var(--card)',
    glowLeft: `color-mix(in srgb, ${PK_TEAM_COLORS.teamB} 42%, transparent)`,
    glowRight: `color-mix(in srgb, ${PK_TEAM_COLORS.teamA} 45%, transparent)`,
    stripLeft: `color-mix(in srgb, ${PK_TEAM_COLORS.teamB} 22%, transparent)`,
    stripRight: `color-mix(in srgb, ${PK_TEAM_COLORS.teamA} 22%, transparent)`,
    teamNameColor: 'var(--foreground)',
    teamNameFontPx: 30,
    playerNameColor: 'var(--foreground)',
    playerNameFontPx: 20,
    pkTitleColor: 'var(--foreground)',
    pkTitleFontPx: 52,
    avatarSizePx: 80,
    diagonalStepPx: 36,
    buttonFontPx: 16,
    barBg: 'color-mix(in srgb, var(--background) 35%, transparent)',
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
