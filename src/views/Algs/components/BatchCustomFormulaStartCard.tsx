"use client";

import { Card } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import { PRACTICE_COLORS } from "../utils/constants";
import "../styles/practiceTools.css";

export interface BatchCustomFormulaStartCardProps {
  onStart: () => void;
  embedded?: boolean;
}

export default function BatchCustomFormulaStartCard({
  onStart,
  embedded = false,
}: BatchCustomFormulaStartCardProps) {
  const { t } = useI18n();

  const content = (
    <>
      <div className="algs-practice-tool-cell-header">
        <span
          className="algs-practice-tool-cell-icon algs-practice-tool-cell-icon--batch"
          aria-hidden
        >
          ✎
        </span>
        <span className="algs-practice-tool-cell-title">
          {t("algs.batchCustom.title")}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">{t("algs.batchCustom.desc")}</p>
    </>
  );

  if (embedded) {
    return (
      <button
        type="button"
        className="algs-practice-tool-cell algs-practice-tool-cell--batch"
        onClick={onStart}
      >
        {content}
      </button>
    );
  }

  return (
    <Card.Root
      size="sm"
      cursor="pointer"
      onClick={onStart}
      h="full"
      borderRadius="xl"
      bg={PRACTICE_COLORS.batch.bg}
      borderColor={PRACTICE_COLORS.batch.border}
      borderWidth="1px"
      _hover={{ borderColor: "accent" }}
    >
      <Card.Body p={4} h="full">
        {content}
      </Card.Body>
    </Card.Root>
  );
}
