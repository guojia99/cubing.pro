import { getDefaultPkArenaSettings, type PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
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
    hintColor: 'rgba(255, 255, 255, 0.72)',
    wingTitleFontPx: 11,
    wingTitleColor: 'rgba(255, 255, 255, 0.68)',
    blockTitleFontPx: 13,
    blockTitleColor: 'rgba(255, 255, 255, 0.88)',
    teamLineFontPx: 15,
    teamLineColor: 'rgba(255, 255, 255, 0.92)',
    vsFontPx: 13,
    vsColor: 'rgba(255, 255, 255, 0.55)',
    matchIdFontPx: 13,
    matchIdColor: 'rgba(255, 255, 255, 0.68)',
    cardBg: 'rgba(255, 255, 255, 0.06)',
    cardBorderColor: 'rgba(255, 255, 255, 0.14)',
    clickableBorderColor: 'rgba(255, 255, 255, 0.88)',
    leftWingBorder: '#1677ff',
    rightWingBorder: '#fa8c16',
    leftWingFill: 'linear-gradient(90deg, rgba(22, 119, 255, 0.12) 0%, transparent 70%)',
    rightWingFill: 'linear-gradient(270deg, rgba(250, 140, 22, 0.12) 0%, transparent 70%)',
    centerColumnBg: 'rgba(255, 255, 255, 0.03)',
    centerColumnBorder: 'rgba(255, 255, 255, 0.12)',
    bronzeHintFontPx: 11,
    bronzeHintColor: 'rgba(255, 255, 255, 0.62)',
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
