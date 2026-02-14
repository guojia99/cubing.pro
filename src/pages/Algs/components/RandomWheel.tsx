import React, { useEffect, useRef } from 'react';
import { SET_CARD_COLORS } from '../constants';
import './RandomWheel.less';

export interface WheelSegment {
  label: string;
  key: string;
}

interface RandomWheelProps {
  segments: WheelSegment[];
  spinParams: { duration: number; rotation: number } | null;
  onSpinStart?: () => void;
  placeholder?: React.ReactNode;
  className?: string;
}

const RandomWheel: React.FC<RandomWheelProps> = ({
  segments,
  spinParams,
  onSpinStart,
  placeholder,
  className = '',
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (segments.length === 0 || !spinParams || !wheelRef.current) return;
    const { duration, rotation } = spinParams;
    const el = wheelRef.current;
    onSpinStart?.();

    el.style.transform = 'rotate(0deg)';
    (el as HTMLElement).offsetHeight;

    el.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: `rotate(${rotation}deg)` },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.17, 0.67, 0.12, 1)',
        fill: 'forwards',
      },
    );
  }, [segments.length, spinParams, onSpinStart]);

  const wheelSvg =
    segments.length > 0 ? (
      <WheelSvg segments={segments} />
    ) : (
      <div className="random-wheel-placeholder-inner">{placeholder ?? '?'}</div>
    );

  return (
    <div className={`random-wheel-wrap ${className}`}>
      <div
        ref={wheelRef}
        className={`random-wheel ${segments.length === 0 ? 'random-wheel-placeholder' : ''}`}
      >
        {wheelSvg}
      </div>
      <div className="random-wheel-pointer" />
    </div>
  );
};

function WheelSvg({ segments }: { segments: WheelSegment[] }) {
  const n = segments.length;
  const cx = 100;
  const cy = 100;
  const r = 95;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pointAt = (angleDeg: number) => {
    const rad = toRad(angleDeg - 90);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };
  const pathForSlice = (startDeg: number, endDeg: number) => {
    const p1 = pointAt(startDeg);
    const p2 = pointAt(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
  };

  return (
    <svg viewBox="0 0 200 200" className="random-wheel-svg">
      <g className="random-wheel-rotatable">
        {segments.map((seg, i) => {
          const startDeg = (i * 360) / n;
          const endDeg = ((i + 1) * 360) / n;
          const midDeg = (startDeg + endDeg) / 2;
          const textR = r * 0.65;
          const textX = cx + textR * Math.cos(toRad(midDeg - 90));
          const textY = cy + textR * Math.sin(toRad(midDeg - 90));
          const color = SET_CARD_COLORS[i % SET_CARD_COLORS.length];
          return (
            <g key={seg.key}>
              <path
                d={pathForSlice(startDeg, endDeg)}
                fill={color.bg}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="random-wheel-label"
                transform={`rotate(${midDeg + 90}, ${textX}, ${textY})`}
              >
                {seg.label.length > 12 ? seg.label.slice(0, 11) + '…' : seg.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default RandomWheel;
