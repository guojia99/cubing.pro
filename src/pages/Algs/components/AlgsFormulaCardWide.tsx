import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from 'antd';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import {
  getAlgsSelection,
  setAlgsSelection,
  buildAlgsKey,
  type AlgsSelectionValue,
} from '../utils/storage';
import { getCustomAlgs } from '@/services/cubing-pro/algs/customAlgs';
import AlgsCubeDiagram from './AlgsCubeDiagram';
import { SET_CARD_COLORS } from '../constants';
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from '../utils/formulaFontFamily';
import '../index.less';

const MAX_ALT_FORMULAS = 3;

export interface AlgsFormulaCardWideProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  alg: Algorithm;
  setColorIndex?: number;
  formulaFontSize?: number;
  formulaFontFamily?: FormulaFontFamilyId;
  useVisualCube?: boolean;
  hideAltFormulas?: boolean;
  onOpenModal: () => void;
}

const AlgsFormulaCardWide: React.FC<AlgsFormulaCardWideProps> = ({
  cube,
  classId,
  setName,
  groupName,
  alg,
  setColorIndex = 0,
  formulaFontSize = 12,
  formulaFontFamily,
  useVisualCube = true,
  hideAltFormulas = false,
  onOpenModal,
}) => {
  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);
  const [selection, setSelectionState] = useState<AlgsSelectionValue | null>(() =>
    getAlgsSelection(storageKey),
  );

  useEffect(() => {
    setSelectionState(getAlgsSelection(storageKey));
  }, [storageKey]);

  const activeSource = selection?.source ?? 'library';
  const selectedIndex = selection?.index ?? 0;
  const libraryFormulas = alg.algs;
  const customFormulas = getCustomAlgs(storageKey);
  const formulas = activeSource === 'custom' ? customFormulas : libraryFormulas;

  const displayScramble = useMemo(() => {
    if (activeSource === 'custom') return '';
    return alg.scrambles?.[selectedIndex] ?? alg.scrambles?.[0] ?? '';
  }, [activeSource, alg.scrambles, selectedIndex]);

  const displayFormula = formulas[selectedIndex] ?? formulas[0] ?? '';

  const formulaRows = useMemo(() => {
    if (formulas.length === 0) return [];
    const safeIndex = Math.min(selectedIndex, formulas.length - 1);
    const selected = { text: formulas[safeIndex] ?? '', index: safeIndex, selected: true };
    if (hideAltFormulas || formulas.length <= 1) {
      return [selected];
    }
    const alts = formulas
      .map((text, index) => ({ text, index }))
      .filter((row) => row.index !== safeIndex)
      .slice(0, MAX_ALT_FORMULAS)
      .map((row) => ({ ...row, selected: false }));
    return [selected, ...alts];
  }, [formulas, selectedIndex, hideAltFormulas]);

  const updateSelection = useCallback(
    (source: 'library' | 'custom', index: number) => {
      const val: AlgsSelectionValue = { source, index };
      setAlgsSelection(storageKey, val);
      setSelectionState(val);
    },
    [storageKey],
  );

  const colors = SET_CARD_COLORS[setColorIndex % SET_CARD_COLORS.length];
  const formulaFontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

  return (
    <Card
      size="small"
      className="algs-formula-card-wide"
      style={{
        borderRadius: 10,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      bodyStyle={{ padding: 16, boxSizing: 'border-box' }}
    >
      <div className="algs-formula-card-wide-body">
        <button
          type="button"
          className="algs-formula-card-wide-left"
          onClick={onOpenModal}
        >
          <div className="algs-formula-card-diagram" style={{ maxWidth: 200 }}>
            <AlgsCubeDiagram
              cube={cube}
              classId={classId}
              setName={setName}
              groupName={groupName}
              imageSvg={alg.image}
              scramble={displayScramble}
              formula={displayFormula}
              useVisualCube={useVisualCube}
              maxWidth={200}
              maxHeight={220}
            />
          </div>
          <div className="algs-formula-card-wide-name">{alg.name}</div>
        </button>

        <div className="algs-formula-card-wide-right">
          <div className="algs-formula-card-wide-formulas">
            {formulaRows.map((row) => (
              <button
                key={`${activeSource}-${row.index}`}
                type="button"
                className={`algs-formula-card-wide-formula${
                  row.selected ? ' is-selected' : ' is-alt'
                }`}
                style={{ fontSize: formulaFontSize, fontFamily: formulaFontCss }}
                onClick={() => updateSelection(activeSource, row.index)}
              >
                {row.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AlgsFormulaCardWide;
