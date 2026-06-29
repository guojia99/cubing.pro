"use client";

import { Card } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import type { FormulaItem } from "../types";
import FormulaRandomPickCard from "./FormulaRandomPickCard";
import FormulaPracticeStartCard from "./FormulaPracticeStartCard";
import BatchCustomFormulaStartCard from "./BatchCustomFormulaStartCard";
import FormulaProficiencyCard from "./FormulaProficiencyCard";
import PracticeHistoryStatsCard from "./PracticeHistoryStatsCard";
import "../styles/practiceTools.css";

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

export default function AlgsPracticeToolsPanel({
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
}: AlgsPracticeToolsPanelProps) {
  const { t } = useI18n();

  return (
    <Card.Root
      size="sm"
      className="algs-practice-tools-panel"
      mb={4}
      borderRadius="xl"
      variant="outline"
    >
      <Card.Header py={3} px={4}>
        <Card.Title fontSize="sm" fontWeight="semibold">
          {t("algs.detail.practiceTools")}
        </Card.Title>
      </Card.Header>
      <Card.Body pt={2} px={4} pb={4}>
        <div
          className={`algs-practice-tools-grid${showRandomPick ? "" : " algs-practice-tools-grid--no-random"}`}
        >
          {showRandomPick && (
            <FormulaRandomPickCard
              embedded
              cube={cube}
              classId={classId}
              flatAlgs={flatAlgs}
              refreshKey={formulaRandomRefreshKey}
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
            embedded
            cube={cube}
            classId={classId}
            flatAlgs={flatAlgs}
            onOpenFormulaPractice={onOpenFormulaPractice}
            refreshKey={unskilledRefreshKey}
          />
          <PracticeHistoryStatsCard
            embedded
            cube={cube}
            classId={classId}
            refreshKey={unskilledRefreshKey}
          />
        </div>
      </Card.Body>
    </Card.Root>
  );
}
