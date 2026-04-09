import LiveSettingsButton from '@/pages/Tools/TeamMatch/components/LiveSettingsButton';
import type { PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import type { Team } from '@/pages/Tools/TeamMatch/types';
import { Button, Space, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import '../TeamMatch.less';

export type PkGroupArenaPlayerLite = {
  id: string;
  name: string;
  avatarDataUrl: string | null;
  schoolName: string;
  scoresLine: string;
};

export type PkGroupArenaColumn = {
  team: Team;
  players: PkGroupArenaPlayerLite[];
  dim: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenLiveSettings: () => void;
  settings: PkArenaSettings;
  columns: PkGroupArenaColumn[];
  onOpenScoreEntry: () => void;
};

function PkGroupArenaFullscreen({
  open,
  onClose,
  onOpenLiveSettings,
  settings,
  columns,
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

  if (!open || columns.length === 0) return null;

  const step = settings.diagonalStepPx;
  const av = settings.avatarSizePx;
  const metaFont = Math.max(11, Math.round(settings.playerNameFontPx * 0.52));
  const metaColor = 'rgba(245, 245, 245, 0.78)';

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
                  <Typography.Text
                    strong
                    className="tmPkArenaFsTeamName"
                    style={{ color: settings.teamNameColor, fontSize: settings.teamNameFontPx }}
                  >
                    {col.team.name}
                  </Typography.Text>
                  <div className="tmPkDiagCol tmPkDiagColGroup">
                    {col.players.map((p, i) => (
                      <div
                        key={p.id}
                        className="tmPkDiagCell tmPkArenaFsGroupCell"
                        style={{ marginLeft: (i - midCol) * step }}
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
                </div>
              </React.Fragment>
              );
            })}
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

export default PkGroupArenaFullscreen;
