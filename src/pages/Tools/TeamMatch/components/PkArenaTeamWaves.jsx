import classNames from 'classnames';
import React from 'react';
/** 队伍栏内底部浮动波浪（无图片，纯 CSS），受「队伍区动态波浪」开关控制 */
function PkArenaTeamWaves({ enabled, direction }) {
    if (!enabled)
        return null;
    return (<div className={classNames('tmPkArenaFsTeamWaves', `tmPkArenaFsTeamWaves--${direction}`)} aria-hidden>
      <span className="tmPkArenaFsTeamWavesBand tmPkArenaFsTeamWavesBand--1"/>
      <span className="tmPkArenaFsTeamWavesBand tmPkArenaFsTeamWavesBand--2"/>
      <span className="tmPkArenaFsTeamWavesBand tmPkArenaFsTeamWavesBand--3"/>
    </div>);
}
export default PkArenaTeamWaves;
//# sourceMappingURL=PkArenaTeamWaves.jsx.map