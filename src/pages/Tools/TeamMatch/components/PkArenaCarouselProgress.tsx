import React from 'react';
import '../TeamMatch.less';

type Props = {
  /** 是否显示进度条（轮播进行中） */
  active: boolean;
  /** 与轮播间隔一致，控制条走完速度 (ms) */
  intervalMs: number;
  /** 每换一人 +1，用于重置 CSS 动画 */
  tick: number;
};

/** 全屏底部细进度条（无数字，仅视觉倒计时） */
function PkArenaCarouselProgress({ active, intervalMs, tick }: Props) {
  if (!active) return null;
  return (
    <div className="tmPkArenaFsCarouselTrack" aria-hidden>
      <div
        key={tick}
        className="tmPkArenaFsCarouselFill"
        style={{ animationDuration: `${Math.max(500, intervalMs)}ms` }}
      />
    </div>
  );
}

export default PkArenaCarouselProgress;
