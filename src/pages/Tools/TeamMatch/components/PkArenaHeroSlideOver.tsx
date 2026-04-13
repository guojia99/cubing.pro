import type { PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import { Button, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import '../TeamMatch.less';

export type PkArenaHeroDetail = {
  name: string;
  avatarDataUrl: string | null;
  schoolName: string;
  teamName: string;
  /** WCA ID，无则 null */
  wcaId: string | null;
  /** 种子成绩一行 */
  seedScoresLine: string;
  /** 本场 PK 成绩一行，无录入时为 null */
  pkResultLine: string | null;
  playerBattlecry: string;
  teamBattlecry: string;
};

type Props = {
  open: boolean;
  anchor: 'left' | 'right';
  onClose: () => void;
  settings: PkArenaSettings;
  data: PkArenaHeroDetail | null;
};

function PkArenaHeroSlideOver({ open, anchor, onClose, settings, data }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open || !data) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 16);
    return () => window.clearTimeout(t);
  }, [open, data]);

  if (!open || !data) return null;

  const av = settings.heroDetailAvatarPx;
  const namePx = settings.heroDetailNameFontPx;
  const scorePkPx = settings.heroDetailPkScoreFontPx;
  const seedPx = settings.heroDetailSeedFontPx;
  const cryPx = settings.heroDetailCryFontPx;
  const teamPx = settings.heroDetailTeamFontPx;
  const schoolPx = settings.heroDetailSchoolFontPx;

  return (
    <div className="tmPkArenaHeroRoot" role="dialog" aria-modal="true" aria-label="队员详情">
      <button type="button" className="tmPkArenaHeroBackdrop" onClick={onClose} aria-label="关闭" />
      <div
        className={classNames('tmPkArenaHeroPanel', `tmPkArenaHeroPanel--${anchor}`, {
          tmPkArenaHeroPanelVisible: visible,
        })}
        style={{
          background: `linear-gradient(200deg, ${settings.backgroundColorEnd}f2 0%, ${settings.backgroundColor} 55%, rgba(0,0,0,0.92) 100%)`,
          borderColor: anchor === 'left' ? settings.stripLeft : settings.stripRight,
        }}
      >
        <div className="tmPkArenaHeroPanelInner">
          <div className="tmPkArenaHeroHeader">
            <Typography.Text style={{ color: settings.teamNameColor, fontSize: teamPx }} strong>
              {data.teamName}
            </Typography.Text>
            <Button type="text" size="small" onClick={onClose} style={{ color: 'rgba(255,255,255,0.85)' }}>
              关闭
            </Button>
          </div>

          <div className="tmPkArenaHeroAvatarBlock">
            {data.avatarDataUrl ? (
              <img
                alt=""
                src={data.avatarDataUrl}
                className="tmPkArenaHeroAvatar"
                style={{ width: av, height: av, borderColor: settings.playerNameColor }}
              />
            ) : (
              <div
                className="tmPkArenaHeroAvatar tmPkArenaHeroAvatarPh"
                style={{
                  width: av,
                  height: av,
                  fontSize: av * 0.38,
                  borderColor: settings.playerNameColor,
                }}
              >
                {data.name.slice(0, 1)}
              </div>
            )}
          </div>

          <Typography.Title
            level={2}
            className="tmPkArenaHeroName"
            style={{ color: settings.playerNameColor, fontSize: namePx, margin: 0 }}
          >
            {data.name}
          </Typography.Title>

          <Typography.Text type="secondary" className="tmPkArenaHeroSchool" style={{ fontSize: schoolPx }}>
            {data.schoolName}
          </Typography.Text>

          <Typography.Text className="tmPkArenaHeroWca" style={{ fontSize: Math.max(12, schoolPx - 2), color: 'rgba(230,230,235,0.88)' }}>
            WCA ID：{data.wcaId?.trim() ? data.wcaId.trim() : '—'}
          </Typography.Text>

          {data.pkResultLine ? (
            <div className="tmPkArenaHeroScorePk">
              <Typography.Text style={{ color: '#ffd666', fontSize: scorePkPx, fontWeight: 800 }}>
                {data.pkResultLine}
              </Typography.Text>
            </div>
          ) : null}

          <div className="tmPkArenaHeroSeed">
            <Typography.Text style={{ color: 'rgba(245,245,245,0.88)', fontSize: seedPx }}>种子：{data.seedScoresLine}</Typography.Text>
          </div>

          {(data.teamBattlecry || '').trim() ? (
            <div className="tmPkArenaHeroCryBlock">
              <Typography.Text className="tmPkArenaHeroCryLabel" style={{ fontSize: cryPx }}>
                队伍宣言
              </Typography.Text>
              <Typography.Paragraph className="tmPkArenaHeroCryText" style={{ fontSize: cryPx, color: 'rgba(255,255,255,0.9)' }}>
                {data.teamBattlecry.trim()}
              </Typography.Paragraph>
            </div>
          ) : null}

          {(data.playerBattlecry || '').trim() ? (
            <div className="tmPkArenaHeroCryBlock">
              <Typography.Text className="tmPkArenaHeroCryLabel" style={{ fontSize: cryPx }}>
                个人宣言
              </Typography.Text>
              <Typography.Paragraph className="tmPkArenaHeroCryText" style={{ fontSize: cryPx, color: 'rgba(255,255,255,0.9)' }}>
                {data.playerBattlecry.trim()}
              </Typography.Paragraph>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PkArenaHeroSlideOver;
