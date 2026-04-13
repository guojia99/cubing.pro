import type { PkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import '../TeamMatch.less';

type Align = 'center' | 'left' | 'right';

type Props = {
  battlecry: string | undefined | null;
  settings: Pick<PkArenaSettings, 'teamNameFontPx'>;
  align?: Align;
};

/** 全屏对战主界面：队名下方展示队伍作战宣言（无宣言时不渲染） */
function PkArenaTeamBattlecry({ battlecry, settings, align = 'center' }: Props) {
  const t = (battlecry ?? '').trim();
  if (!t) return null;
  const fontPx = Math.max(11, Math.round(settings.teamNameFontPx * 0.42));
  return (
    <Typography.Paragraph
      className={classNames('tmPkArenaFsTeamBattlecry', `tmPkArenaFsTeamBattlecry--${align}`)}
      style={{
        fontSize: fontPx,
        marginTop: 6,
        marginBottom: 0,
        textAlign: align,
        color: 'rgba(252, 252, 252, 0.9)',
      }}
    >
      {t}
    </Typography.Paragraph>
  );
}

export default PkArenaTeamBattlecry;
