import { getDefaultPkArenaSettings, type PkArenaSettings } from '@/views/TeamMatch/pkArenaSettings';
import { PK_BRACKET_WING } from '@/theme/domainColors';
import type { CSSProperties } from 'react';

/** 正赛对阵图区域可配置项 */
export type BracketPageSettings = {
  pageBg: string;
  /** 对阵图整体缩放 */
  scale: number;
  hintFontPx: number;
  hintColor: string;
  wingTitleFontPx: number;
  wingTitleColor: string;
  blockTitleFontPx: number;
  blockTitleColor: string;
  teamLineFontPx: number;
  teamLineColor: string;
  vsFontPx: number;
  vsColor: string;
  matchIdFontPx: number;
  matchIdColor: string;
  cardBg: string;
  cardBorderColor: string;
  clickableBorderColor: string;
  leftWingBorder: string;
  rightWingBorder: string;
  leftWingFill: string;
  rightWingFill: string;
  centerColumnBg: string;
  centerColumnBorder: string;
  bronzeHintFontPx: number;
  bronzeHintColor: string;
};

export type LiveUISettings = {
  bracket: BracketPageSettings;
  arena: PkArenaSettings;
};

const V2_KEY = 'cubing-pro:team-match:live-ui-settings';
const LEGACY_ARENA_KEY = 'cubing-pro:team-match:pk-arena-settings';

export function getDefaultBracketPageSettings(): BracketPageSettings {
  return {
    pageBg: 'transparent',
    scale: 1,
    hintFontPx: 12,
    hintColor: 'color-mix(in srgb, var(--foreground) 72%, transparent)',
    wingTitleFontPx: 11,
    wingTitleColor: 'color-mix(in srgb, var(--foreground) 68%, transparent)',
    blockTitleFontPx: 13,
    blockTitleColor: 'color-mix(in srgb, var(--foreground) 88%, transparent)',
    teamLineFontPx: 15,
    teamLineColor: 'color-mix(in srgb, var(--foreground) 92%, transparent)',
    vsFontPx: 13,
    vsColor: 'color-mix(in srgb, var(--foreground) 55%, transparent)',
    matchIdFontPx: 13,
    matchIdColor: 'color-mix(in srgb, var(--foreground) 68%, transparent)',
    cardBg: 'color-mix(in srgb, var(--foreground) 6%, transparent)',
    cardBorderColor: 'color-mix(in srgb, var(--foreground) 14%, transparent)',
    clickableBorderColor: 'color-mix(in srgb, var(--foreground) 88%, transparent)',
    leftWingBorder: PK_BRACKET_WING.left,
    rightWingBorder: PK_BRACKET_WING.right,
    leftWingFill: `linear-gradient(90deg, color-mix(in srgb, ${PK_BRACKET_WING.left} 12%, transparent) 0%, transparent 70%)`,
    rightWingFill: `linear-gradient(270deg, color-mix(in srgb, ${PK_BRACKET_WING.right} 12%, transparent) 0%, transparent 70%)`,
    centerColumnBg: 'color-mix(in srgb, var(--foreground) 3%, transparent)',
    centerColumnBorder: 'color-mix(in srgb, var(--foreground) 12%, transparent)',
    bronzeHintFontPx: 11,
    bronzeHintColor: 'color-mix(in srgb, var(--foreground) 62%, transparent)',
  };
}

export function getDefaultLiveUISettings(): LiveUISettings {
  return {
    bracket: getDefaultBracketPageSettings(),
    arena: getDefaultPkArenaSettings(),
  };
}

export function loadLiveUISettings(): LiveUISettings {
  try {
    const v2 = localStorage.getItem(V2_KEY);
    if (v2) {
      const p = JSON.parse(v2) as Partial<LiveUISettings>;
      return {
        bracket: { ...getDefaultBracketPageSettings(), ...p.bracket },
        arena: { ...getDefaultPkArenaSettings(), ...p.arena },
      };
    }
    const legacy = localStorage.getItem(LEGACY_ARENA_KEY);
    if (legacy) {
      const arena = { ...getDefaultPkArenaSettings(), ...JSON.parse(legacy) };
      return { bracket: getDefaultBracketPageSettings(), arena };
    }
  } catch {
    /* ignore */
  }
  return getDefaultLiveUISettings();
}

export function saveLiveUISettings(s: LiveUISettings): void {
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** 供对阵根节点 inline style 绑定 CSS 变量 */
export function bracketSettingsToCssVars(b: BracketPageSettings): CSSProperties {
  return {
    '--tm-br-page-bg': b.pageBg,
    '--tm-br-hint-font': `${b.hintFontPx}px`,
    '--tm-br-hint-color': b.hintColor,
    '--tm-br-wing-title-font': `${b.wingTitleFontPx}px`,
    '--tm-br-wing-title-color': b.wingTitleColor,
    '--tm-br-block-title-font': `${b.blockTitleFontPx}px`,
    '--tm-br-block-title-color': b.blockTitleColor,
    '--tm-br-team-line-font': `${b.teamLineFontPx}px`,
    '--tm-br-team-line-color': b.teamLineColor,
    '--tm-br-vs-font': `${b.vsFontPx}px`,
    '--tm-br-vs-color': b.vsColor,
    '--tm-br-match-id-font': `${b.matchIdFontPx}px`,
    '--tm-br-match-id-color': b.matchIdColor,
    '--tm-br-card-bg': b.cardBg,
    '--tm-br-card-border': b.cardBorderColor,
    '--tm-br-click-border': b.clickableBorderColor,
    '--tm-br-wing-left-border': b.leftWingBorder,
    '--tm-br-wing-right-border': b.rightWingBorder,
    '--tm-br-wing-left-fill': b.leftWingFill,
    '--tm-br-wing-right-fill': b.rightWingFill,
    '--tm-br-center-bg': b.centerColumnBg,
    '--tm-br-center-border': b.centerColumnBorder,
    '--tm-br-bronze-hint-font': `${b.bronzeHintFontPx}px`,
    '--tm-br-bronze-hint-color': b.bronzeHintColor,
    '--tm-br-toolbar-label-color': b.blockTitleColor,
  } as CSSProperties;
}
