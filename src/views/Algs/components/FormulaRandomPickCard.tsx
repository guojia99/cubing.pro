"use client";

import { Box, Button, Card, Flex, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getFormulaPickHistory } from "@/services/cubing-pro/algs/formulaRandomPick";
import type { FormulaItem } from "../types";
import { ALGS_COLORS } from "../utils/constants";
import SvgRenderer from "./SvgRenderer";
import "../styles/practiceTools.css";

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

interface FormulaRandomPickCardProps {
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  onOpenRandom: () => void;
  onOpenHistory: () => void;
  onPickFormula: (index: number) => void;
  embedded?: boolean;
  refreshKey?: number;
}

export default function FormulaRandomPickCard({
  cube,
  classId,
  flatAlgs,
  onOpenRandom,
  onOpenHistory,
  onPickFormula,
  embedded = false,
  refreshKey = 0,
}: FormulaRandomPickCardProps) {
  const { t } = useI18n();
  const [history, setHistory] = useState(() => getFormulaPickHistory(cube, classId));

  useEffect(() => {
    setHistory(getFormulaPickHistory(cube, classId));
  }, [cube, classId, refreshKey]);

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
    if (idx >= 0) onPickFormula(idx);
  };

  const preview = latestPick ? (
    <div
      role="button"
      tabIndex={0}
      onClick={handleLatestClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleLatestClick();
      }}
      className="algs-practice-tool-random-preview"
    >
      <SvgRenderer
        svg={latestPick.image}
        maxWidth={48}
        maxHeight={64}
        style={{ flexShrink: 0 }}
      />
      <Box minW={0} flex={1} textAlign={embedded ? "center" : "left"}>
        <Text fontWeight="semibold" fontSize="sm">
          {latestPick.algName}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {latestPick.setName} · {latestPick.groupName}
        </Text>
      </Box>
    </div>
  ) : (
    <div className="algs-practice-tool-random-empty">
      <SvgRenderer
        svg={RANDOM_PICK_ICON_SVG}
        maxWidth={48}
        maxHeight={48}
        style={{ opacity: 0.6 }}
      />
      <span>{t("algs.formulaRandom.noPickYet")}</span>
    </div>
  );

  const actions = (
    <div className={embedded ? "algs-practice-tool-cell-actions" : undefined}>
      <Button
        colorPalette="brand"
        size="sm"
        w={embedded ? "full" : undefined}
        onClick={onOpenRandom}
      >
        {t("algs.formulaRandom.random")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        w={embedded ? "full" : undefined}
        onClick={onOpenHistory}
      >
        {t("algs.formulaRandom.history")}
      </Button>
    </div>
  );

  if (embedded) {
    return (
      <div className="algs-practice-tool-cell algs-practice-tool-cell--random">
        <div className="algs-practice-tool-cell-header">
          <span className="algs-practice-tool-cell-title">
            {t("algs.detail.randomPickCard")}
          </span>
        </div>
        <div className="algs-practice-tool-cell-body">{preview}</div>
        {actions}
      </div>
    );
  }

  return (
    <Card.Root
      size="sm"
      borderRadius="xl"
      bg={ALGS_COLORS.cardBg}
      borderColor={ALGS_COLORS.cardBorder}
      borderWidth="1px"
    >
      <Card.Body p={4}>
        <Flex align="center" gap={4} flexWrap="wrap">
          <Flex align="center" gap={3} flex={1} minW="200px">
            {preview}
          </Flex>
          <Flex gap={2} flexShrink={0}>
            {actions}
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
