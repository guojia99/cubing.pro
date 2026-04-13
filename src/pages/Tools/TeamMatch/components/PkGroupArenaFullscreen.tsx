import PkArenaCarouselProgress from '@/pages/Tools/TeamMatch/components/PkArenaCarouselProgress';
import PkArenaHeroSlideOver, { type PkArenaHeroDetail } from '@/pages/Tools/TeamMatch/components/PkArenaHeroSlideOver';
import PkArenaTeamBattlecry from '@/pages/Tools/TeamMatch/components/PkArenaTeamBattlecry';
import PkArenaTeamCarouselBtn from '@/pages/Tools/TeamMatch/components/PkArenaTeamCarouselBtn';
import PkArenaTeamWaves from '@/pages/Tools/TeamMatch/components/PkArenaTeamWaves';
import LiveSettingsButton from '@/pages/Tools/TeamMatch/components/LiveSettingsButton';
import { buildPkArenaHeroDetail } from '@/pages/Tools/TeamMatch/pkArenaHeroBuild';
import type { PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import type { PkPlayerResult, Team } from '@/pages/Tools/TeamMatch/types';
import { Button, Space, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../TeamMatch.less';

export type PkGroupArenaPlayerLite = {
  id: string;
  name: string;
  avatarDataUrl: string | null;
  schoolName: string;
  scoresLine: string;
  playerBattlecry: string;
  wcaId: string | null;
};

export type PkGroupArenaColumn = {
  team: Team;
  players: PkGroupArenaPlayerLite[];
  dim: boolean;
};

type CarouselState = { colIdx: number; idx: number };

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenLiveSettings: () => void;
  settings: PkArenaSettings;
  columns: PkGroupArenaColumn[];
  /** 本场已录入的 PK 行，用于英雄详情「本场成绩」 */
  currentResults: PkPlayerResult[];
  onOpenScoreEntry: () => void;
};

function toHeroInput(p: PkGroupArenaPlayerLite) {
  return {
    id: p.id,
    name: p.name,
    avatarDataUrl: p.avatarDataUrl,
    schoolName: p.schoolName,
    scoresLine: p.scoresLine,
    playerBattlecry: p.playerBattlecry,
    wcaId: p.wcaId,
  };
}

function PkGroupArenaFullscreen({
  open,
  onClose,
  onOpenLiveSettings,
  settings,
  columns,
  currentResults,
  onOpenScoreEntry,
}: Props) {
  const [heroOpen, setHeroOpen] = useState(false);
  const [heroAnchor, setHeroAnchor] = useState<'left' | 'right'>('left');
  const [heroData, setHeroData] = useState<PkArenaHeroDetail | null>(null);
  const [carousel, setCarousel] = useState<CarouselState | null>(null);
  const [progressTick, setProgressTick] = useState(0);

  const closeHero = useCallback(() => {
    setHeroOpen(false);
    setHeroData(null);
    setCarousel(null);
  }, []);

  useEffect(() => {
    if (!open) {
      closeHero();
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (heroOpen) {
        e.preventDefault();
        closeHero();
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, heroOpen, closeHero]);

  useEffect(() => {
    if (!heroOpen || !carousel) return;
    const intervalMs = Math.max(500, settings.heroCarouselIntervalMs);
    const col = columns[carousel.colIdx];
    if (!col || col.players.length === 0) {
      setCarousel(null);
      return;
    }

    const tid = window.setTimeout(() => {
      setCarousel((c) => {
        if (!c) return null;
        const col2 = columns[c.colIdx];
        if (!col2 || col2.players.length === 0) return null;
        const nextIdx = c.idx + 1;
        if (nextIdx >= col2.players.length) {
          setHeroOpen(false);
          setHeroData(null);
          return null;
        }
        const p = col2.players[nextIdx];
        setHeroData(buildPkArenaHeroDetail(toHeroInput(p), col2.team, currentResults));
        setProgressTick((x) => x + 1);
        return { ...c, idx: nextIdx };
      });
    }, intervalMs);
    return () => window.clearTimeout(tid);
  }, [heroOpen, carousel?.colIdx, carousel?.idx, settings.heroCarouselIntervalMs, columns, currentResults]);

  const openHero = useCallback(
    (colIdx: number, col: PkGroupArenaColumn, p: PkGroupArenaPlayerLite) => {
      const anchor: 'left' | 'right' = colIdx % 2 === 0 ? 'left' : 'right';
      setCarousel(null);
      setHeroAnchor(anchor);
      setHeroData(buildPkArenaHeroDetail(toHeroInput(p), col.team, currentResults));
      setHeroOpen(true);
    },
    [currentResults],
  );

  const toggleCarousel = useCallback(
    (colIdx: number) => {
      const col = columns[colIdx];
      if (!col || col.players.length === 0) return;
      if (carousel?.colIdx === colIdx) {
        closeHero();
        return;
      }
      const anchor: 'left' | 'right' = colIdx % 2 === 0 ? 'left' : 'right';
      setCarousel({ colIdx, idx: 0 });
      setHeroAnchor(anchor);
      setHeroData(buildPkArenaHeroDetail(toHeroInput(col.players[0]), col.team, currentResults));
      setHeroOpen(true);
      setProgressTick((n) => n + 1);
    },
    [columns, carousel?.colIdx, closeHero],
  );

  const bgStyle = useMemo(
    () => ({
      background: `radial-gradient(ellipse at 15% 45%, ${settings.glowLeft}, transparent 56%),
        radial-gradient(ellipse at 85% 45%, ${settings.glowRight}, transparent 56%),
        linear-gradient(180deg, ${settings.backgroundColor}, ${settings.backgroundColorEnd})`,
    }),
    [settings],
  );

  if (!open || columns.length === 0) return null;

  const step = settings.diagonalStepPx;
  const av = settings.avatarSizePx;
  const metaFont = Math.max(11, Math.round(settings.playerNameFontPx * 0.52));
  const metaColor = 'rgba(245, 245, 245, 0.78)';
  const carouselInterval = Math.max(500, settings.heroCarouselIntervalMs);

  return (
    <div className="tmPkArenaFs tmPkArenaFsGroup">
      <div className="tmPkArenaFsBg" style={bgStyle} aria-hidden />
      <div
        className="tmPkArenaFsTopBar tmPkArenaFsGroupTopBar"
        style={{ background: settings.barBg }}
      >
        <Typography.Text strong style={{ color: 'rgba(255,255,255,0.92)', fontSize: settings.buttonFontPx }}>
          预选赛 · 小组全屏
        </Typography.Text>
        <Space wrap>
          <Button type="primary" danger ghost onClick={onClose}>
            关闭对战
          </Button>
          <LiveSettingsButton type="default" ghost onClick={onOpenLiveSettings} style={{ fontSize: settings.buttonFontPx }} />
        </Space>
      </div>
      <div className="tmPkArenaFsBody">
        <div
          className="tmPkArenaFsScale"
          style={{
            transform: `scale(${settings.scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="tmPkArenaFsRow tmPkArenaFsGroupRow">
            {columns.map((col, colIdx) => {
              const midCol = col.players.length > 0 ? (col.players.length - 1) / 2 : 0;
              return (
                <React.Fragment key={col.team.id}>
                  {colIdx > 0 && (
                    <div className="tmPkArenaFsGroupSep" aria-hidden>
                      <span className="tmPkArenaFsGroupSepText">·</span>
                    </div>
                  )}
                  <div
                    className={classNames('tmPkArenaFsSide', 'tmPkArenaFsGroupSide', { tmPkArenaFsDim: col.dim })}
                    style={{
                      background: `linear-gradient(180deg, ${
                        colIdx % 2 === 0 ? settings.stripLeft : settings.stripRight
                      }, transparent)`,
                    }}
                  >
                    <PkArenaTeamWaves
                      enabled={settings.flagBackgroundEnabled}
                      direction={colIdx % 2 === 0 ? 'left' : 'right'}
                    />
                    <div className="tmPkArenaFsSideContent tmPkArenaFsSideContent--group">
                      <Typography.Text
                        strong
                        className="tmPkArenaFsTeamName"
                        style={{ color: settings.teamNameColor, fontSize: settings.teamNameFontPx }}
                      >
                        {col.team.name}
                      </Typography.Text>
                      <PkArenaTeamBattlecry battlecry={col.team.battlecry} settings={settings} align="center" />
                      <div className="tmPkDiagCol tmPkDiagColGroup">
                        {col.players.map((p, i) => (
                          <div
                            key={p.id}
                            role="button"
                            tabIndex={0}
                            className="tmPkDiagCell tmPkArenaFsGroupCell tmPkDiagCellClickable"
                            style={{ marginLeft: (i - midCol) * step }}
                            onClick={() => openHero(colIdx, col, p)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openHero(colIdx, col, p);
                              }
                            }}
                          >
                            {p.avatarDataUrl ? (
                              <img
                                alt=""
                                src={p.avatarDataUrl}
                                className="tmPkArenaFsAvatar"
                                style={{ width: av, height: av }}
                              />
                            ) : (
                              <div
                                className="tmPkArenaFsAvatar tmPkArenaFsAvatarPh"
                                style={{ width: av, height: av, fontSize: av * 0.38 }}
                              >
                                {p.name.slice(0, 1)}
                              </div>
                            )}
                            <span
                              className="tmPkArenaFsPlayerName"
                              style={{
                                color: settings.playerNameColor,
                                fontSize: settings.playerNameFontPx,
                                maxWidth: av + step * 4,
                              }}
                            >
                              {p.name}
                            </span>
                            <span
                              className="tmPkArenaFsPlayerMeta"
                              style={{
                                color: metaColor,
                                fontSize: metaFont,
                                maxWidth: av + step * 5,
                                lineHeight: 1.3,
                              }}
                            >
                              {p.scoresLine}
                            </span>
                            <span
                              className="tmPkArenaFsPlayerMeta tmPkArenaFsPlayerSchool"
                              style={{
                                color: metaColor,
                                fontSize: Math.max(10, metaFont - 1),
                                maxWidth: av + step * 5,
                                lineHeight: 1.3,
                              }}
                            >
                              {p.schoolName}
                            </span>
                          </div>
                        ))}
                      </div>
                      <PkArenaTeamCarouselBtn
                        corner="bottom-center"
                        running={carousel?.colIdx === colIdx}
                        disabled={col.players.length === 0}
                        onClick={() => toggleCarousel(colIdx)}
                      />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      <PkArenaCarouselProgress
        active={!!carousel && heroOpen}
        intervalMs={carouselInterval}
        tick={progressTick}
      />
      <div className="tmPkArenaFsBottomBar" style={{ background: settings.barBg }}>
        <Button type="primary" size="large" onClick={onOpenScoreEntry} style={{ fontSize: settings.buttonFontPx }}>
          录入成绩
        </Button>
      </div>
      <PkArenaHeroSlideOver
        open={heroOpen}
        anchor={heroAnchor}
        onClose={closeHero}
        settings={settings}
        data={heroData}
      />
    </div>
  );
}

export default PkGroupArenaFullscreen;
