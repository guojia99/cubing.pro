import React, { useEffect, useRef } from 'react';
import type { ExperimentalStickering, TwistyPlayer as TwistyPlayerType } from 'cubing/twisty';
import type { Cube333ViewMode, CubeBottomFaceColor, TwistyPanelTone } from '../utils/storage';
import { twistyStickeringUsesSetupAnchorEnd } from '../utils/twistyStickering';
import { wcaStickerColorSchemeForBottom } from '../utils/twistyStickerColorScheme';
import { applyTwistyFaceColorScheme } from '../utils/applyTwistyFaceColorScheme';

export type { Cube333ViewMode, TwistyPanelTone, CubeBottomFaceColor };

export interface AlgsTwisty333Props {
  /** 要演示的公式（魔方符号） */
  alg: string;
  viewMode: Cube333ViewMode;
  /** cubing.js 贴纸模式，由公式库 class/set/group 解析（如 OLL、PLL、CMLL、ZBLL） */
  experimentalStickering: ExperimentalStickering | null;
  /** 全局：演示区背景颜色（外层容器） */
  panelTone?: TwistyPanelTone;
  /** 按公式库：底面中心颜色（六面贴纸配色，见 twistyStickerColorScheme） */
  bottomFaceColor?: CubeBottomFaceColor;
  /** 卡片等小尺寸场景隐藏控制条 */
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function toneToSurfaceStyle(tone: TwistyPanelTone | undefined): React.CSSProperties {
  switch (tone) {
    case 'lightBlue':
      return {
        backgroundColor: 'rgba(227, 242, 253, 0.95)',
        borderRadius: 8,
        padding: 8,
        boxSizing: 'border-box',
      };
    case 'white':
      return {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 8,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxSizing: 'border-box',
      };
    case 'neutral':
      return {};
    case 'cream':
    default:
      return {
        backgroundColor: 'rgba(255, 248, 220, 0.95)',
        borderRadius: 8,
        padding: 8,
        boxSizing: 'border-box',
      };
  }
}

function pickAlgString(raw: string): string {
  const t = raw?.trim();
  if (t) return t;
  return "R U R' U'";
}

/**
 * 使用 cubing.js TwistyPlayer 渲染三阶 2D/3D，见 https://js.cubing.net/cubing/twisty/
 * 外层背景：TwistyPlayerConfig.background 仅支持 none/checkered 等，自定义用外层 div。
 * 六面颜色：Twisty 的 colorScheme 仅 light/dark；三阶 3D 在挂载后对 Cube3D 贴纸材质赋色（applyTwistyFaceColorScheme）。
 */
const AlgsTwisty333: React.FC<AlgsTwisty333Props> = ({
  alg,
  viewMode,
  experimentalStickering,
  panelTone = 'cream',
  bottomFaceColor = 'yellow',
  compact = false,
  className,
  style,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TwistyPlayerType | null>(null);

  const setupAnchorEnd = twistyStickeringUsesSetupAnchorEnd(experimentalStickering);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    (async () => {
      const { TwistyPlayer } = await import('cubing/twisty');
      if (cancelled || !hostRef.current) return;

      playerRef.current?.remove();
      playerRef.current = null;

      const player = new TwistyPlayer({
        puzzle: '3x3x3',
        alg: pickAlgString(alg),
        visualization: viewMode === '3d' ? '3D' : '2D',
        experimentalStickering,
        ...(setupAnchorEnd ? ({ experimentalSetupAnchor: 'end' } as const) : {}),
        background: 'none',
        hintFacelets: 'none',
        controlPanel: compact ? 'none' : 'auto',
        backView: viewMode === '3d' ? 'top-right' : 'none',
      });

      player.style.width = '100%';
      player.style.display = 'block';
      player.style.maxHeight = compact ? '200px' : 'min(50vh, 360px)';
      player.style.height = compact ? '168px' : '280px';

      host.innerHTML = '';
      host.appendChild(player);
      playerRef.current = player;

      await new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => r()));
      });
      if (cancelled) return;

      const scheme = wcaStickerColorSchemeForBottom(bottomFaceColor);
      await applyTwistyFaceColorScheme(player, scheme);
    })().catch((e) => {
      console.error('[AlgsTwisty333]', e);
    });

    return () => {
      cancelled = true;
      playerRef.current?.remove();
      playerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [alg, viewMode, experimentalStickering, setupAnchorEnd, compact, bottomFaceColor]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        ...toneToSurfaceStyle(panelTone),
        ...style,
      }}
    />
  );
};

export default AlgsTwisty333;
