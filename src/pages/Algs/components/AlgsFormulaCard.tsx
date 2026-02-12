import React from 'react';
import { Card, Tag } from 'antd';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import { getAlgsSelection, buildAlgsKey } from '../utils/storage';
import SvgRenderer from './SvgRenderer';
import { SET_CARD_COLORS } from '../constants';

const CARD_MIN_HEIGHT = 180;

export interface AlgsFormulaCardProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  alg: Algorithm;
  setColorIndex?: number;
  formulaFontSize?: number;
  onClick: () => void;
}

const AlgsFormulaCard: React.FC<AlgsFormulaCardProps> = ({
  cube,
  classId,
  setName,
  groupName,
  alg,
  setColorIndex = 0,
  formulaFontSize = 12,
  onClick,
}) => {
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const savedIndex = getAlgsSelection(storageKey);
  const showIndex = savedIndex ?? 0;
  const displayAlg = alg.algs[showIndex] ?? alg.algs[0] ?? '';
  const colors = SET_CARD_COLORS[setColorIndex % SET_CARD_COLORS.length];

  return (
    <Card
      hoverable
      onClick={onClick}
      size="small"
      style={{
        borderRadius: 10,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        animation: 'algsFloat 10s ease-in-out infinite',
        minHeight: CARD_MIN_HEIGHT,
      }}
      bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}
    >
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SvgRenderer
          svg={alg.image}
          maxWidth={180}
          maxHeight={320}
          style={{ marginTop: 12, marginBottom: 16 }}
        />
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{alg.name}</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <Tag
            style={{
              fontFamily: 'monospace',
              fontSize: formulaFontSize,
              maxWidth: '100%',
              lineHeight: 1.4,
              overflow: 'hidden',
              wordBreak: 'break-all',
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical' as const,
            }}
          >
            {displayAlg}
          </Tag>
        </div>
      </div>
    </Card>
  );
};

export default AlgsFormulaCard;
