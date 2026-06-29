import classNames from 'classnames';
import React from 'react';

type Props = {
  enabled: boolean;
  /** 与对阵左右一致，波浪漂移方向相反更有对比 */
  direction: 'left' | 'right';
};

/** 队伍栏内底部浮动波浪（无图片，纯 CSS），受「队伍区动态波浪」开关控制 */
function PkArenaTeamWaves({ enabled, direction }: Props) {
  if (!enabled) return null;
  return (
    <div
      className={classNames('tmPkArenaFsTeamWaves', `tmPkArenaFsTeamWaves--${direction}`)}
      aria-hidden
    >
      <span className="tmPkArenaFsTeamWavesBand tmPkArenaFsTeamWavesBand--1" />
      <span className="tmPkArenaFsTeamWavesBand tmPkArenaFsTeamWavesBand--2" />
      <span className="tmPkArenaFsTeamWavesBand tmPkArenaFsTeamWavesBand--3" />
    </div>
  );
}

export default PkArenaTeamWaves;
