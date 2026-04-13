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

type PlayerLite = {
  id: string;
  name: string;
  avatarDataUrl: string | null;
  schoolName: string;
  scoresLine: string;
  playerBattlecry: string;
  wcaId: string | null;
};

type CarouselState = { side: 'A' | 'B'; idx: number };

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenLiveSettings: () => void;
  settings: PkArenaSettings;
  teamA: Team | undefined;
  teamB: Team | undefined;
  playersA: PlayerLite[];
  playersB: PlayerLite[];
  dimA: boolean;
  dimB: boolean;
  currentResults: PkPlayerResult[];
  onOpenScoreEntry: () => void;
};

function toHeroInput(p: PlayerLite) {
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

function PkArenaFullscreen({
  open,
  onClose,
  onOpenLiveSettings,
  settings,
  teamA,
  teamB,
  playersA,
  playersB,
  dimA,
  dimB,
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
    const list = carousel.side === 'A' ? playersA : playersB;
    const team = carousel.side === 'A' ? teamA : teamB;
    if (!team || list.length === 0) {
      setCarousel(null);
      return;
    }

    const tid = window.setTimeout(() => {
      setCarousel((c) => {
        if (!c) return null;
        const L = c.side === 'A' ? playersA : playersB;
        const T = c.side === 'A' ? teamA : teamB;
        if (!T || L.length === 0) return null;
        const nextIdx = c.idx + 1;
        if (nextIdx >= L.length) {
          setHeroOpen(false);
          setHeroData(null);
          return null;
        }
        const p = L[nextIdx];
        setHeroData(buildPkArenaHeroDetail(toHeroInput(p), T, currentResults));
        setProgressTick((x) => x + 1);
        return { ...c, idx: nextIdx };
      });
    }, intervalMs);
    return () => window.clearTimeout(tid);
  }, [
    heroOpen,
    carousel?.side,
    carousel?.idx,
    settings.heroCarouselIntervalMs,
    playersA,
    playersB,
    teamA,
    teamB,
    currentResults,
  ]);

  const openHeroA = useCallback(
    (p: PlayerLite) => {
      if (!teamA) return;
      setCarousel(null);
      setHeroAnchor('left');
      setHeroData(buildPkArenaHeroDetail(toHeroInput(p), teamA, currentResults));
      setHeroOpen(true);
    },
    [teamA, currentResults],
  );

  const openHeroB = useCallback(
    (p: PlayerLite) => {
      if (!teamB) return;
      setCarousel(null);
      setHeroAnchor('right');
      setHeroData(buildPkArenaHeroDetail(toHeroInput(p), teamB, currentResults));
      setHeroOpen(true);
    },
    [teamB, currentResults],
  );

  const toggleCarouselA = useCallback(() => {
    if (!teamA || playersA.length === 0) return;
    if (carousel?.side === 'A') {
      closeHero();
      return;
    }
    setCarousel({ side: 'A', idx: 0 });
    setHeroAnchor('left');
    setHeroData(buildPkArenaHeroDetail(toHeroInput(playersA[0]), teamA, currentResults));
    setHeroOpen(true);
    setProgressTick((n) => n + 1);
  }, [teamA, playersA, carousel?.side, currentResults, closeHero]);

  const toggleCarouselB = useCallback(() => {
    if (!teamB || playersB.length === 0) return;
    if (carousel?.side === 'B') {
      closeHero();
      return;
    }
    setCarousel({ side: 'B', idx: 0 });
    setHeroAnchor('right');
    setHeroData(buildPkArenaHeroDetail(toHeroInput(playersB[0]), teamB, currentResults));
    setHeroOpen(true);
    setProgressTick((n) => n + 1);
  }, [teamB, playersB, carousel?.side, currentResults, closeHero]);

  const bgStyle = useMemo(
    () => ({
      background: `radial-gradient(ellipse at 15% 45%, ${settings.glowLeft}, transparent 56%),
        radial-gradient(ellipse at 85% 45%, ${settings.glowRight}, transparent 56%),
        linear-gradient(180deg, ${settings.backgroundColor}, ${settings.backgroundColorEnd})`,
    }),
    [settings],
  );

  if (!open) return null;

  const step = settings.diagonalStepPx;
  const av = settings.avatarSizePx;
  const metaFont = Math.max(11, Math.round(settings.playerNameFontPx * 0.52));
  const metaColor = 'rgba(245, 245, 245, 0.78)';
  const carouselInterval = Math.max(500, settings.heroCarouselIntervalMs);

  return (
    <div className="tmPkArenaFs">
      <div className="tmPkArenaFsBg" style={bgStyle} aria-hidden />
      <div className="tmPkArenaFsTopBar" style={{ background: settings.barBg }}>
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
          <div className="tmPkArenaFsRow">
            <div
              className={classNames('tmPkArenaFsSide', 'tmPkArenaFsSideLeft', { tmPkArenaFsDim: dimA })}
              style={{ background: `linear-gradient(180deg, ${settings.stripLeft}, transparent)` }}
            >
              <PkArenaTeamWaves enabled={settings.flagBackgroundEnabled} direction="left" />
              <div className="tmPkArenaFsSideContent tmPkArenaFsSideContent--left">
                <Typography.Text
                  strong
                  className="tmPkArenaFsTeamName"
                  style={{ color: settings.teamNameColor, fontSize: settings.teamNameFontPx }}
                >
                  {teamA?.name ?? '待定'}
                </Typography.Text>
                <PkArenaTeamBattlecry battlecry={teamA?.battlecry} settings={settings} align="left" />
                <div className="tmPkDiagCol tmPkDiagColLeft">
                  {playersA.slice(0, 3).map((p, i) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      className="tmPkDiagCell tmPkDiagCellClickable"
                      style={{ marginLeft: i * step }}
                      onClick={() => openHeroA(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openHeroA(p);
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
                        <div className="tmPkArenaFsAvatar tmPkArenaFsAvatarPh" style={{ width: av, height: av, fontSize: av * 0.38 }}>
                          {p.name.slice(0, 1)}
                        </div>
                      )}
                      <span
                        className="tmPkArenaFsPlayerName"
                        style={{ color: settings.playerNameColor, fontSize: settings.playerNameFontPx, maxWidth: av + step * 4 }}
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
                  corner="bottom-left"
                  running={carousel?.side === 'A'}
                  disabled={!teamA || playersA.length === 0}
                  onClick={toggleCarouselA}
                />
              </div>
            </div>

            <div className="tmPkArenaFsCenter">
              <Typography.Title
                level={1}
                className="tmPkArenaFsPkTitle"
                style={{ color: settings.pkTitleColor, fontSize: settings.pkTitleFontPx, margin: 0 }}
              >
                PK
              </Typography.Title>
            </div>

            <div
              className={classNames('tmPkArenaFsSide', 'tmPkArenaFsSideRight', { tmPkArenaFsDim: dimB })}
              style={{ background: `linear-gradient(180deg, ${settings.stripRight}, transparent)` }}
            >
              <PkArenaTeamWaves enabled={settings.flagBackgroundEnabled} direction="right" />
              <div className="tmPkArenaFsSideContent tmPkArenaFsSideContent--right">
                <Typography.Text
                  strong
                  className="tmPkArenaFsTeamName"
                  style={{ color: settings.teamNameColor, fontSize: settings.teamNameFontPx }}
                >
                  {teamB?.name ?? '待定'}
                </Typography.Text>
                <PkArenaTeamBattlecry battlecry={teamB?.battlecry} settings={settings} align="right" />
                <div className="tmPkDiagCol tmPkDiagColRight">
                  {playersB.slice(0, 3).map((p, i) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      className="tmPkDiagCell tmPkDiagCellClickable"
                      style={{ marginRight: i * step }}
                      onClick={() => openHeroB(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openHeroB(p);
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
                        <div className="tmPkArenaFsAvatar tmPkArenaFsAvatarPh" style={{ width: av, height: av, fontSize: av * 0.38 }}>
                          {p.name.slice(0, 1)}
                        </div>
                      )}
                      <span
                        className="tmPkArenaFsPlayerName"
                        style={{ color: settings.playerNameColor, fontSize: settings.playerNameFontPx, maxWidth: av + step * 4 }}
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
                  corner="bottom-right"
                  running={carousel?.side === 'B'}
                  disabled={!teamB || playersB.length === 0}
                  onClick={toggleCarouselB}
                />
              </div>
            </div>
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
      <PkArenaHeroSlideOver open={heroOpen} anchor={heroAnchor} onClose={closeHero} settings={settings} data={heroData} />
    </div>
  );
}

export default PkArenaFullscreen;
