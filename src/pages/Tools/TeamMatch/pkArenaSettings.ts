/** 全屏对战动画可配置项（由 liveUiSettings 统一持久化） */
export type PkArenaSettings = {
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
};

export function getDefaultPkArenaSettings(): PkArenaSettings {
  return {
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
  };
}
