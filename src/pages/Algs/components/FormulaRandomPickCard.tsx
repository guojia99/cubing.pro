import React, { useMemo } from 'react';
import { Button, Card } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import { getFormulaPickHistory } from '@/services/cubing-pro/algs/formulaRandomPick';
import SvgRenderer from './SvgRenderer';
import { ALGS_COLORS } from '../constants';

const RANDOM_PICK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="44" fill="rgba(230,240,255,0.8)" stroke="rgba(100,149,237,0.5)" stroke-width="3"/>
  <path d="M50 50 L50 10 L54 50 Z" fill="rgba(100,149,237,0.7)"/>
  <path d="M50 50 L77 27 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L77 73 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L50 90 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L23 73 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L23 27 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <circle cx="50" cy="50" r="10" fill="rgba(100,149,237,0.9)"/>
</svg>`;

export interface FormulaItem {
  alg: Algorithm;
  setName: string;
  groupName: string;
}

interface FormulaRandomPickCardProps {
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  onOpenRandom: () => void;
  onOpenHistory: () => void;
  onPickFormula: (index: number) => void;
}

const FormulaRandomPickCard: React.FC<FormulaRandomPickCardProps> = ({
  cube,
  classId,
  flatAlgs,
  onOpenRandom,
  onOpenHistory,
  onPickFormula,
}) => {
  const intl = useIntl();
  const history = useMemo(() => getFormulaPickHistory(cube, classId), [cube, classId]);
  const latestPick = history[0];

  const findIndex = (setName: string, groupName: string, algName: string) =>
    flatAlgs.findIndex(
      (f) =>
        f.setName === setName &&
        f.groupName === groupName &&
        f.alg.name === algName,
    );

  const handleLatestClick = () => {
    if (!latestPick) return;
    const idx = findIndex(latestPick.setName, latestPick.groupName, latestPick.algName);
    if (idx >= 0) {
      onPickFormula(idx);
    }
  };

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        backgroundColor: ALGS_COLORS.cardBg,
        borderColor: ALGS_COLORS.cardBorder,
      }}
      bodyStyle={{ padding: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 1,
            minWidth: 200,
          }}
        >
          {latestPick ? (
            <div
              onClick={handleLatestClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                flex: 1,
                padding: 8,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.5)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100,149,237,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
              }}
            >
              <SvgRenderer
                svg={latestPick.image}
                maxWidth={48}
                maxHeight={64}
                style={{ flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                  {latestPick.algName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
                  {latestPick.setName} · {latestPick.groupName}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                color: 'rgba(0,0,0,0.45)',
                fontSize: 14,
              }}
            >
              <SvgRenderer
                svg={RANDOM_PICK_ICON_SVG}
                maxWidth={48}
                maxHeight={48}
                style={{ opacity: 0.6 }}
              />
              <span>{intl.formatMessage({ id: 'algs.formulaRandom.noPickYet' })}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button type="primary" onClick={onOpenRandom}>
            {intl.formatMessage({ id: 'algs.formulaRandom.random' })}
          </Button>
          <Button icon={<HistoryOutlined />} onClick={onOpenHistory}>
            {intl.formatMessage({ id: 'algs.formulaRandom.history' })}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FormulaRandomPickCard;
