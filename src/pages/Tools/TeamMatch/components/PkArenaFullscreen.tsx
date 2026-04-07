import LiveSettingsButton from '@/pages/Tools/TeamMatch/components/LiveSettingsButton';
import type { PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import type { Team } from '@/pages/Tools/TeamMatch/types';
import { Button, Space, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import '../TeamMatch.less';

type PlayerLite = {
  id: string;
  name: string;
  avatarDataUrl: string | null;
  schoolName: string;
  scoresLine: string;
};

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
  onOpenScoreEntry: () => void;
};

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
  onOpenScoreEntry,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
              <Typography.Text
                strong
                className="tmPkArenaFsTeamName"
                style={{ color: settings.teamNameColor, fontSize: settings.teamNameFontPx }}
              >
                {teamA?.name ?? '待定'}
              </Typography.Text>
              <div className="tmPkDiagCol tmPkDiagColLeft">
                {playersA.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="tmPkDiagCell" style={{ marginLeft: i * step }}>
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
              <Typography.Text
                strong
                className="tmPkArenaFsTeamName"
                style={{ color: settings.teamNameColor, fontSize: settings.teamNameFontPx }}
              >
                {teamB?.name ?? '待定'}
              </Typography.Text>
              <div className="tmPkDiagCol tmPkDiagColRight">
                {playersB.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="tmPkDiagCell" style={{ marginRight: i * step }}>
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
            </div>
          </div>
        </div>
      </div>
      <div className="tmPkArenaFsBottomBar" style={{ background: settings.barBg }}>
        <Button type="primary" size="large" onClick={onOpenScoreEntry} style={{ fontSize: settings.buttonFontPx }}>
          录入成绩
        </Button>
      </div>
    </div>
  );
}

export default PkArenaFullscreen;
