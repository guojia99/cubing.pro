import React from 'react';
import '../TeamMatch.less';
/** 全屏底部细进度条（无数字，仅视觉倒计时） */
function PkArenaCarouselProgress({ active, intervalMs, tick }) {
    if (!active)
        return null;
    return (<div className="tmPkArenaFsCarouselTrack" aria-hidden>
      <div key={tick} className="tmPkArenaFsCarouselFill" style={{ animationDuration: `${Math.max(500, intervalMs)}ms` }}/>
    </div>);
}
export default PkArenaCarouselProgress;
//# sourceMappingURL=PkArenaCarouselProgress.jsx.map