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
      borderRadius="12px"
      variant="outline"
      bg="bg.elevated"
      borderColor="border"
      minW={0}
    >
      <Card.Header pt="12px" pb="8px" px="12px">
        <Card.Title fontSize="12px" lineHeight="18px" fontWeight="semibold">
          {t("algs.detail.practiceTools")}
        </Card.Title>
      </Card.Header>
      <Card.Body pt={0} px="10px" pb="10px">
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
