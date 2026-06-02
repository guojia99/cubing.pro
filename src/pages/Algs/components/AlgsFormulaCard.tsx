import React from 'react';
import { Card, Tag } from 'antd';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import { getAlgsSelection, buildAlgsKey } from '../utils/storage';
import { getCustomAlgs } from '@/services/cubing-pro/algs/customAlgs';
import AlgsCubeDiagram from './AlgsCubeDiagram';
import { SET_CARD_COLORS } from '../constants';
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from '../utils/formulaFontFamily';

const CARD_MIN_HEIGHT = 180;

export interface AlgsFormulaCardProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  alg: Algorithm;
  setColorIndex?: number;
  formulaFontSize?: number;
  formulaFontFamily?: FormulaFontFamilyId;
  useVisualCube?: boolean;
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
  formulaFontFamily,
  useVisualCube = true,
  onClick,
}) => {
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const selection = getAlgsSelection(storageKey);
  let displayAlg = '';
  if (selection?.source === 'custom') {
    const customs = getCustomAlgs(storageKey);
    displayAlg = customs[selection.index] ?? customs[0] ?? '';
  } else {
    const idx = selection?.index ?? 0;
    displayAlg = alg.algs[idx] ?? alg.algs[0] ?? '';
  }
  const scrambleIdx = selection?.source === 'custom' ? 0 : (selection?.index ?? 0);
  const displayScramble =
    selection?.source === 'custom' ? '' : (alg.scrambles?.[scrambleIdx] ?? alg.scrambles?.[0] ?? '');
  const colors = SET_CARD_COLORS[setColorIndex % SET_CARD_COLORS.length];
  const formulaFontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

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
      bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minWidth: 0 }}
    >
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="algs-formula-card-diagram" style={{ marginTop: 12, marginBottom: 16 }}>
          <AlgsCubeDiagram
            cube={cube}
            classId={classId}
            setName={setName}
            groupName={groupName}
            imageSvg={alg.image}
            scramble={displayScramble}
            formula={displayAlg}
            useVisualCube={useVisualCube}
            maxWidth={180}
            maxHeight={180}
          />
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--ant-color-text)' }}>
          {alg.name}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <Tag
            style={{
              fontFamily: formulaFontCss,
              fontSize: formulaFontSize,
              maxWidth: '100%',
              lineHeight: 1.4,
              overflow: 'hidden',
              wordBreak: 'break-all',
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical' as const,
              color: 'var(--ant-color-text)',
              borderColor: 'var(--ant-color-border-secondary)',
              background: 'var(--ant-color-fill-quaternary)',
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
