import React, { useCallback, useLayoutEffect, useRef } from 'react';

export type BracketFitTeamNameTone = 'bracket' | 'elim';

/** 与 TeamMatch.less 中 .tmBracketTeamLine / compact / winner 档位一致 */
export function bracketFitTeamNameFontRange(
  tone: BracketFitTeamNameTone,
  compact?: boolean,
  winner?: boolean,
): { maxPx: number; minPx: number } {
  if (tone === 'elim') {
    return { maxPx: 15, minPx: 10 };
  }
  if (compact && winner) return { maxPx: 15, minPx: 9 };
  if (compact) return { maxPx: 14, minPx: 9 };
  if (winner) return { maxPx: 17, minPx: 10 };
  return { maxPx: 15, minPx: 10 };
}

type BracketFitTeamNameProps = {
  text: string;
  className?: string;
  compact?: boolean;
  winner?: boolean;
  tone?: BracketFitTeamNameTone;
};

/**
 * 在父级 flex 分配宽度内单行展示队名：优先用较大字号，过长则逐步缩小至 minPx，仍超出则依赖 ellipsis。
 */
const BracketFitTeamName: React.FC<BracketFitTeamNameProps> = ({
  text,
  className,
  compact,
  winner,
  tone = 'bracket',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const { maxPx, minPx } = bracketFitTeamNameFontRange(tone, compact, winner);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    let size = maxPx;
    el.style.fontSize = `${size}px`;
    while (size > minPx && el.scrollWidth > w) {
      size -= 0.25;
      el.style.fontSize = `${size}px`;
    }
  }, [text, maxPx, minPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [fit]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <span ref={ref} className={className} title={text}>
      {text}
    </span>
  );
};

export default BracketFitTeamName;
