"use client";

import { Card } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import { PRACTICE_COLORS } from "../utils/constants";
import "../styles/practiceTools.css";

export interface FormulaPracticeStartCardProps {
  onStart: () => void;
  embedded?: boolean;
}

export default function FormulaPracticeStartCard({
  onStart,
  embedded = false,
}: FormulaPracticeStartCardProps) {
  const { t } = useI18n();

  const content = (
    <>
      <div className="algs-practice-tool-cell-header">
        <span
          className="algs-practice-tool-cell-icon algs-practice-tool-cell-icon--practice"
          aria-hidden
        >
          ▶
        </span>
        <span className="algs-practice-tool-cell-title">
          {t("algs.formulaPractice.start")}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">
        {t("algs.formulaPractice.title")}
      </p>
    </>
  );

  if (embedded) {
    return (
      <button
        type="button"
        className="algs-practice-tool-cell algs-practice-tool-cell--practice"
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
      bg={PRACTICE_COLORS.practice.bg}
      borderColor={PRACTICE_COLORS.practice.border}
      borderWidth="1px"
      _hover={{ borderColor: "signal.info" }}
    >
      <Card.Body p={4} h="full">
        {content}
      </Card.Body>
    </Card.Root>
  );
}
