import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'antd';
import { useIntl } from '@@/plugin-locale';
import { useNavigate } from '@@/exports';
import type { OutputClass } from '@/services/cubing-pro/algs/typings';
import type { PickedOption } from '@/services/cubing-pro/algs/dailyRandomPick';
import {
  clearDailyPick,
  getDailyPickState,
  getRemainingPicks,
  saveDailyPick,
} from '@/services/cubing-pro/algs/dailyRandomPick';
import { isLocal } from '@/services/cubing-pro/request';
import SvgRenderer from './SvgRenderer';
import { SET_CARD_COLORS } from '../constants';
import './RandomPickModal.less';

const WHEEL_SEGMENT_COUNT = 12;
const SPIN_DURATION_MIN = 5000;
const SPIN_DURATION_MAX = 8000;

interface RandomPickModalProps {
  open: boolean;
  onClose: () => void;
  classMap: Record<string, OutputClass[]>;
  cubeKeys: string[];
}

function collectOptions(
  classMap: Record<string, OutputClass[]>,
  cubeKeys: string[],
  exclude?: PickedOption[],
): PickedOption[] {
  const all: PickedOption[] = [];
  cubeKeys.forEach((cube) => {
    (classMap[cube] ?? []).forEach((cls) => {
      if (
        !exclude?.some((e) => e.cube === cube && e.className === cls.name)
      ) {
        all.push({
          cube,
          className: cls.name,
          image: cls.image,
        });
      }
    });
  });
  return all;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const RandomPickModal: React.FC<RandomPickModalProps> = ({
  open,
  onClose,
  classMap,
  cubeKeys,
}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [picks, setPicks] = useState<PickedOption[]>([]);
  const [remaining, setRemaining] = useState(2);
  const [spinning, setSpinning] = useState(false);
  const [wheelSegments, setWheelSegments] = useState<PickedOption[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinParamsRef = useRef<{ duration: number; rotation: number } | null>(null);

  const loadState = useCallback(async () => {
    const state = await getDailyPickState();
    const rem = getRemainingPicks(state);
    setRemaining(rem);
    if (state?.picks?.length) {
      setPicks(state.picks);
      setPhase('result');
      setCountdown(null);
    } else {
      setPicks([]);
      setPhase('idle');
      const opts = collectOptions(classMap, cubeKeys, []);
      if (opts.length > 0 && rem > 0) {
        setCountdown(3);
      }
    }
  }, [classMap, cubeKeys]);

  useEffect(() => {
    if (open) {
      loadState();
    }
  }, [open, loadState]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null);
        doSpin();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, doSpin]);

  useEffect(() => {
    if (
      phase === 'spinning' &&
      wheelSegments.length > 0 &&
      wheelRef.current &&
      spinParamsRef.current
    ) {
      const { duration, rotation } = spinParamsRef.current;
      const el = wheelRef.current;
      spinParamsRef.current = null;

      el.style.transform = 'rotate(0deg)';
      el.offsetHeight;

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
    }
  }, [phase, wheelSegments]);

  const allOptions = useMemo(
    () => collectOptions(classMap, cubeKeys, picks),
    [classMap, cubeKeys, picks],
  );
  const totalOptions = allOptions.length;
  const canSpin = totalOptions > 0 && remaining > 0;

  const doSpin = useCallback(() => {
    if (spinning || remaining <= 0 || allOptions.length === 0) return;

    const count = Math.min(WHEEL_SEGMENT_COUNT, allOptions.length);
    const shuffled = shuffle(allOptions);
    const segments = shuffled.slice(0, count);

    const landIdx = Math.floor(Math.random() * count);
    const winner = segments[landIdx];

    setWheelSegments(segments);
    setSpinning(true);
    setPhase('spinning');

    const newPicks = [...picks, winner];
    setPicks(newPicks);
    setRemaining(remaining - 1);

    const duration =
      SPIN_DURATION_MIN +
      Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN);
    const degPerSeg = 360 / count;
    const segmentCenterAngle = (landIdx + 0.5) * degPerSeg;
    const fullSpins = 360 * 8;
    // 转盘顺时针旋转 R 度时，原本在角度 θ 的扇形会移到 θ+R；要使指针（顶部 0°）指向 segmentCenterAngle，需 360-R=segmentCenterAngle
    const finalRotation = fullSpins + (360 - segmentCenterAngle);

    spinParamsRef.current = { duration, rotation: finalRotation };

    setTimeout(() => {
      setSpinning(false);
      setPhase('result');
      saveDailyPick(newPicks);
    }, duration);
  }, [classMap, cubeKeys, picks, remaining, spinning, allOptions]);

  const handleOptionClick = (opt: PickedOption) => {
    navigate(
      `/algs/${encodeURIComponent(opt.cube)}/${encodeURIComponent(opt.className)}`,
    );
    onClose();
  };

  const handleClose = () => {
    setPhase('idle');
    setPicks([]);
    setSpinning(false);
    setWheelSegments([]);
    setCountdown(null);
    spinParamsRef.current = null;
    onClose();
  };

  const handleClear = useCallback(async () => {
    await clearDailyPick();
    setPicks([]);
    setRemaining(2);
    setPhase('idle');
    setWheelSegments([]);
    setCountdown(null);
    spinParamsRef.current = null;
  }, []);

  const wheelSvg = useMemo(() => {
    const n = wheelSegments.length;
    if (n === 0) return null;

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
      <svg viewBox="0 0 200 200" className="random-pick-wheel-svg">
        <g className="random-pick-wheel-rotatable">
          {wheelSegments.map((seg, i) => {
            const startDeg = (i * 360) / n;
            const endDeg = ((i + 1) * 360) / n;
            const midDeg = (startDeg + endDeg) / 2;
            const textR = r * 0.65;
            const textX = cx + textR * Math.cos(toRad(midDeg - 90));
            const textY = cy + textR * Math.sin(toRad(midDeg - 90));
            const color = SET_CARD_COLORS[i % SET_CARD_COLORS.length];
            return (
              <g key={`${seg.cube}-${seg.className}-${i}`}>
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
                  className="random-pick-wheel-label"
                  transform={`rotate(${midDeg + 90}, ${textX}, ${textY})`}
                >
                  {seg.className.length > 8
                    ? seg.className.slice(0, 7) + '…'
                    : seg.className}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  }, [wheelSegments]);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={460}
      centered
      destroyOnClose
      className="random-pick-modal"
    >
      <div className="random-pick-content">
        {phase === 'idle' && (
          <>
            <div className="random-pick-wheel-wrap">
              <div className="random-pick-wheel random-pick-wheel-placeholder">
                <span
                  className={`random-pick-wheel-placeholder-text ${
                    countdown !== null ? 'random-pick-countdown' : ''
                  }`}
                >
                  {countdown !== null ? String(countdown) : '?'}
                </span>
              </div>
              <div className="random-pick-pointer" />
            </div>
            <p className="random-pick-hint">
              {countdown !== null
                ? intl.formatMessage(
                    { id: 'algs.randomPick.countdown' },
                    { count: countdown },
                  )
                : intl.formatMessage({ id: 'algs.randomPick.hintStart' })}
            </p>
            {countdown === null && (
              <Button
                type="primary"
                size="large"
                onClick={doSpin}
                disabled={spinning || !canSpin}
                className="random-pick-btn"
              >
                {intl.formatMessage({ id: 'algs.randomPick.start' })}
              </Button>
            )}
          </>
        )}

        {(phase === 'spinning' || phase === 'result') && wheelSegments.length > 0 && (
          <>
            <div className="random-pick-wheel-wrap">
              <div ref={wheelRef} className="random-pick-wheel">
                {wheelSvg}
              </div>
              <div className="random-pick-pointer" />
            </div>
            {phase === 'spinning' && (
              <p className="random-pick-hint">
                {intl.formatMessage({ id: 'algs.randomPick.spinning' })}
              </p>
            )}
          </>
        )}

        {phase === 'result' && (
          <>
            <p className="random-pick-result-title">
              {intl.formatMessage({ id: 'algs.randomPick.resultTitle' })}
            </p>
            <div
              className={`random-pick-options ${
                picks.length === 1 ? 'single' : 'double'
              }`}
            >
              {picks.map((opt) => (
                <div
                  key={`${opt.cube}-${opt.className}`}
                  className="random-pick-option-card"
                  onClick={() => handleOptionClick(opt)}
                >
                  <SvgRenderer
                    svg={opt.image}
                    maxWidth={120}
                    maxHeight={160}
                    style={{ marginBottom: 8 }}
                  />
                  <div className="random-pick-option-name">{opt.className}</div>
                  <div className="random-pick-option-cube">{opt.cube}</div>
                </div>
              ))}
            </div>
            <p className="random-pick-click-hint">
              {intl.formatMessage({ id: 'algs.randomPick.clickHint' })}
            </p>
            {remaining > 0 && (
              <Button
                type="default"
                size="middle"
                onClick={doSpin}
                disabled={spinning}
                className="random-pick-again-btn"
              >
                {intl.formatMessage({ id: 'algs.randomPick.again' })}
              </Button>
            )}
            {remaining <= 0 && (
              <p className="random-pick-limit-hint">
                {intl.formatMessage({ id: 'algs.randomPick.limitReached' })}
              </p>
            )}
            {isLocal() && (
              <Button
                type="link"
                size="small"
                danger
                onClick={handleClear}
                className="random-pick-clear-btn"
              >
                {intl.formatMessage({ id: 'algs.randomPick.clear' })}
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default RandomPickModal;
