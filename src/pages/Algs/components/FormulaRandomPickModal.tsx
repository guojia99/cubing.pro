import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'antd';
import { useIntl } from '@@/plugin-locale';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import type { FormulaPickItem } from '@/services/cubing-pro/algs/formulaRandomPick';
import {
  getFormulaPickHistory,
  saveFormulaPick,
} from '@/services/cubing-pro/algs/formulaRandomPick';
import SvgRenderer from './SvgRenderer';
import RandomWheel, { type WheelSegment } from './RandomWheel';
import './FormulaRandomPickModal.less';

const WHEEL_SEGMENT_COUNT = 12;
const SPIN_DURATION_MIN = 5000;
const SPIN_DURATION_MAX = 8000;

export interface FormulaItem {
  alg: Algorithm;
  setName: string;
  groupName: string;
}

interface FormulaRandomPickModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'random' | 'history';
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  onPickFormula: (index: number) => void;
  onPickSuccess?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FormulaRandomPickModal: React.FC<FormulaRandomPickModalProps> = ({
  open,
  onClose,
  mode,
  cube,
  classId,
  flatAlgs,
  onPickFormula,
  onPickSuccess,
}) => {
  const intl = useIntl();
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [spinning, setSpinning] = useState(false);
  const [wheelSegments, setWheelSegments] = useState<FormulaItem[]>([]);
  const [winner, setWinner] = useState<FormulaItem | null>(null);
  const [history, setHistory] = useState<FormulaPickItem[]>([]);
  const [spinParams, setSpinParams] = useState<{
    duration: number;
    rotation: number;
  } | null>(null);

  const loadHistory = useCallback(() => {
    setHistory(getFormulaPickHistory(cube, classId));
  }, [cube, classId]);

  useEffect(() => {
    if (open) {
      loadHistory();
      if (mode === 'random') {
        setPhase('idle');
        setWinner(null);
        setWheelSegments([]);
        setSpinParams(null);
        if (flatAlgs.length >= 8) {
          doSpin();
        }
      }
    }
  }, [open, mode, loadHistory, flatAlgs.length, doSpin]);

  const doSpin = useCallback(() => {
    if (spinning || flatAlgs.length < 8) return;

    const count = Math.min(WHEEL_SEGMENT_COUNT, flatAlgs.length);
    const shuffled = shuffle(flatAlgs);
    const segments = shuffled.slice(0, count);

    const landIdx = Math.floor(Math.random() * count);
    const winnerItem = segments[landIdx];

    setWheelSegments(segments);
    setSpinning(true);
    setPhase('spinning');
    setWinner(winnerItem);

    const duration =
      SPIN_DURATION_MIN +
      Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN);
    const degPerSeg = 360 / count;
    const segmentCenterAngle = (landIdx + 0.5) * degPerSeg;
    const fullSpins = 360 * 8;
    const finalRotation = fullSpins + (360 - segmentCenterAngle);

    setSpinParams({ duration, rotation: finalRotation });

    setTimeout(() => {
      setSpinning(false);
      setPhase('result');
      saveFormulaPick(cube, classId, {
        setName: winnerItem.setName,
        groupName: winnerItem.groupName,
        algName: winnerItem.alg.name,
        image: winnerItem.alg.image,
      });
      loadHistory();
      onPickSuccess?.();
    }, duration);
  }, [flatAlgs, spinning, cube, classId, loadHistory, onPickSuccess]);

  const wheelSegmentsForWheel: WheelSegment[] = useMemo(
    () =>
      wheelSegments.map((s) => ({
        label: `${s.groupName} - ${s.alg.name}`,
        key: `${s.setName}-${s.groupName}-${s.alg.name}`,
      })),
    [wheelSegments],
  );

  const handlePickClick = (item: FormulaItem) => {
    const idx = flatAlgs.findIndex(
      (f) =>
        f.setName === item.setName &&
        f.groupName === item.groupName &&
        f.alg.name === item.alg.name,
    );
    if (idx >= 0) {
      onPickFormula(idx);
      onClose();
    }
  };

  const handleHistoryItemClick = (item: FormulaPickItem) => {
    const idx = flatAlgs.findIndex(
      (f) =>
        f.setName === item.setName &&
        f.groupName === item.groupName &&
        f.alg.name === item.algName,
    );
    if (idx >= 0) {
      onPickFormula(idx);
      onClose();
    }
  };

  const handleClose = () => {
    setPhase('idle');
    setSpinning(false);
    setWheelSegments([]);
    setWinner(null);
    setSpinParams(null);
    onClose();
  };

  if (mode === 'history') {
    return (
      <Modal
        open={open}
        onCancel={handleClose}
        title={intl.formatMessage({ id: 'algs.formulaRandom.historyTitle' })}
        footer={null}
        width={400}
        className="formula-random-pick-modal formula-random-history-modal"
      >
        <div className="formula-random-history-list">
          {history.length === 0 ? (
            <p className="formula-random-history-empty">
              {intl.formatMessage({ id: 'algs.formulaRandom.historyEmpty' })}
            </p>
          ) : (
            history.map((item, i) => (
              <div
                key={`${item.setName}-${item.groupName}-${item.algName}-${i}`}
                className="formula-random-history-item"
                onClick={() => handleHistoryItemClick(item)}
              >
                <SvgRenderer
                  svg={item.image}
                  maxWidth={60}
                  maxHeight={80}
                  style={{ flexShrink: 0 }}
                />
                <div className="formula-random-history-item-info">
                  <div className="formula-random-history-item-name">{item.algName}</div>
                  <div className="formula-random-history-item-meta">
                    {item.setName} · {item.groupName}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={460}
      centered
      destroyOnClose
      className="formula-random-pick-modal random-pick-modal"
    >
      <div className="random-pick-content">
        {phase === 'idle' && (
          <>
            <RandomWheel
              segments={[]}
              spinParams={null}
              placeholder="?"
              className="formula-random-wheel"
            />
            <p className="random-pick-hint">
              {intl.formatMessage({ id: 'algs.formulaRandom.hintStart' })}
            </p>
            <Button
              type="primary"
              size="large"
              onClick={doSpin}
              disabled={spinning}
              className="random-pick-btn"
            >
              {intl.formatMessage({ id: 'algs.formulaRandom.start' })}
            </Button>
          </>
        )}

        {(phase === 'spinning' || phase === 'result') && wheelSegments.length > 0 && (
          <>
            <RandomWheel
              segments={wheelSegmentsForWheel}
              spinParams={phase === 'spinning' ? spinParams : null}
              onSpinStart={() => setSpinParams(null)}
              className="formula-random-wheel"
            />
            {phase === 'spinning' && (
              <p className="random-pick-hint">
                {intl.formatMessage({ id: 'algs.randomPick.spinning' })}
              </p>
            )}
          </>
        )}

        {phase === 'result' && winner && (
          <>
            <p className="random-pick-result-title">
              {intl.formatMessage({ id: 'algs.formulaRandom.resultTitle' })}
            </p>
            <div
              className="formula-random-result-card formula-random-option-card"
              onClick={() => handlePickClick(winner)}
            >
              <SvgRenderer
                svg={winner.alg.image}
                maxWidth={120}
                maxHeight={160}
                style={{ marginBottom: 8 }}
              />
              <div className="random-pick-option-name">{winner.alg.name}</div>
              <div className="formula-random-option-meta">
                {winner.setName} · {winner.groupName}
              </div>
            </div>
            <p className="random-pick-click-hint">
              {intl.formatMessage({ id: 'algs.randomPick.clickHint' })}
            </p>
            <Button
              type="default"
              size="middle"
              onClick={doSpin}
              disabled={spinning}
              className="random-pick-again-btn"
            >
              {intl.formatMessage({ id: 'algs.formulaRandom.again' })}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default FormulaRandomPickModal;
