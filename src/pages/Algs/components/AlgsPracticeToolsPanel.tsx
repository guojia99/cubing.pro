import React from 'react';
import { Card } from 'antd';
import { useIntl } from '@@/plugin-locale';
import FormulaRandomPickCard from './FormulaRandomPickCard';
import FormulaPracticeStartCard from './FormulaPracticeStartCard';
import BatchCustomFormulaStartCard from './BatchCustomFormulaStartCard';
import FormulaProficiencyCard from './FormulaProficiencyCard';
import PracticeHistoryStatsCard from './PracticeHistoryStatsCard';
import type { FormulaItem } from './FormulaRandomPickCard';
import '../index.less';

export interface AlgsPracticeToolsPanelProps {
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  showRandomPick: boolean;
  formulaRandomRefreshKey: number;
  unskilledRefreshKey: number;
  onOpenRandom: () => void;
  onOpenHistory: () => void;
  onPickFormula: (index: number) => void;
  onOpenFormulaPractice: () => void;
  onOpenBatchCustom?: () => void;
}

const AlgsPracticeToolsPanel: React.FC<AlgsPracticeToolsPanelProps> = ({
  cube,
  classId,
  flatAlgs,
  showRandomPick,
  formulaRandomRefreshKey,
  unskilledRefreshKey,
  onOpenRandom,
  onOpenHistory,
  onPickFormula,
  onOpenFormulaPractice,
  onOpenBatchCustom,
}) => {
  const intl = useIntl();

  return (
    <Card
      size="small"
      className="algs-practice-tools-panel"
      title={intl.formatMessage({ id: 'algs.detail.practiceTools' })}
      style={{ marginBottom: 16 }}
    >
      <div
        className={`algs-practice-tools-grid${showRandomPick ? '' : ' algs-practice-tools-grid--no-random'}`}
      >
        {showRandomPick && (
          <FormulaRandomPickCard
            key={formulaRandomRefreshKey}
            embedded
            cube={cube}
            classId={classId}
            flatAlgs={flatAlgs}
            onOpenRandom={onOpenRandom}
            onOpenHistory={onOpenHistory}
            onPickFormula={onPickFormula}
          />
        )}
        <FormulaPracticeStartCard embedded onStart={onOpenFormulaPractice} />
        {onOpenBatchCustom && (
          <BatchCustomFormulaStartCard embedded onStart={onOpenBatchCustom} />
        )}
        <FormulaProficiencyCard
          key={unskilledRefreshKey}
          embedded
          cube={cube}
          classId={classId}
          flatAlgs={flatAlgs}
          onOpenFormulaPractice={onOpenFormulaPractice}
          refreshKey={unskilledRefreshKey}
        />
        <PracticeHistoryStatsCard
          key={unskilledRefreshKey}
          embedded
          cube={cube}
          classId={classId}
          refreshKey={unskilledRefreshKey}
        />
      </div>
    </Card>
  );
};

export default AlgsPracticeToolsPanel;
