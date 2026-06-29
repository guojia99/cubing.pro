"use client";

import { Badge, Box, Button, Card, Flex, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { SolutionBreakdown } from "@/views/FloppyReduction/components/SolutionBreakdown";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import type { AxisResult } from "@/views/FloppyReduction/fr";

function CaseBadge({
  result,
  alreadyFrLabel,
  falseFrLabel,
}: {
  result: AxisResult;
  alreadyFrLabel: string;
  falseFrLabel: string;
}) {
  if (result.inputFalseFr) {
    return (
      <Badge
        size="lg"
        bg={FR_COLORS.destructiveSoft}
        color={FR_COLORS.destructive}
        borderWidth="1px"
        borderColor={FR_COLORS.destructive}
      >
        {falseFrLabel}
      </Badge>
    );
  }
  if (result.alreadyFr) {
    return (
      <Badge
        size="lg"
        bg={FR_COLORS.successSoft}
        color={FR_COLORS.success}
        borderWidth="1px"
        borderColor={FR_COLORS.success}
      >
        {alreadyFrLabel}
      </Badge>
    );
  }
  return (
    <Badge size="lg" colorPalette={FR_COLORS.palette}>
      {result.caseLabel}
    </Badge>
  );
}

const AXIS_LABEL: Record<string, string> = {
  ud: "U / D",
  fb: "F / B",
  rl: "R / L",
};

export interface AxisResultCardProps {
  result: AxisResult;
  active: boolean;
  onSelect: () => void;
  onDemo: () => void;
  /** 练习模式提交前隐藏参考解与分解 */
  hideSolution?: boolean;
}

export function AxisResultCard({
  result,
  active,
  onSelect,
  onDemo,
  hideSolution = false,
}: AxisResultCardProps) {
  const { t } = useI18n();
  const { solution } = result;
  const [showSteps, setShowSteps] = useState(false);

  const hasSteps =
    !hideSolution &&
    ((result.decomposition && result.decomposition.length > 1) ||
      (result.shapeDecomposition && result.shapeDecomposition.length > 0));

  return (
    <Card.Root
      borderRadius="xl"
      variant="outline"
      cursor="pointer"
      onClick={onSelect}
      borderWidth="2px"
      borderColor={active ? FR_COLORS.accent : FR_COLORS.border}
      transition="border-color 0.15s"
    >
      <Card.Body p="4">
        <Flex justify="space-between" align="center" mb="3">
          <Text fontWeight="bold" fontSize="lg">
            {AXIS_LABEL[result.axisKey]} {t("fr.axisSuffix")}
          </Text>
          <CaseBadge
            result={result}
            alreadyFrLabel={t("fr.alreadyFr")}
            falseFrLabel={t("fr.falseFr")}
          />
        </Flex>

        <Box fontSize="sm" color={FR_COLORS.fgMuted} mb="1">
          {t("fr.badEdges")}：
          <Text as="span" color={FR_COLORS.fg} fontWeight="medium">
            {result.badCount} ({result.badTop}-{result.badBottom})
          </Text>
        </Box>
        <Box fontSize="sm" color={FR_COLORS.fgMuted} mb="3">
          {t("fr.corner")}：
          <Text as="span" color={FR_COLORS.fg} fontWeight="medium">
            {result.cornerLabel}
          </Text>
        </Box>

        {!hideSolution &&
          (result.shapeIsFalseFr && result.shapeSolution && solution ? (
            <Box mb="3">
              <Box fontSize="sm" color={FR_COLORS.warning} mb="0.5">
                {t("fr.falseFrSolution")}：
              </Box>
              <Box fontFamily="mono" fontSize="md" fontWeight="semibold" mb="2">
                {result.shapeSolution.join(" ")}
              </Box>
              <Box fontSize="sm" color={FR_COLORS.success} mb="0.5">
                {t("fr.correctSolution")}：
              </Box>
              <Box fontFamily="mono" fontSize="md" fontWeight="semibold">
                {solution.join(" ")}
              </Box>
            </Box>
          ) : (
            <>
              <Box fontSize="sm" color={FR_COLORS.fgMuted} mb="1">
                {t("fr.solution")}：
              </Box>
              <Box
                fontFamily="mono"
                fontSize="md"
                fontWeight="semibold"
                color={FR_COLORS.fg}
                minH="6"
                mb={result.inputFalseFr ? "2" : "3"}
              >
                {solution === null
                  ? t("fr.noSolution")
                  : solution.length === 0
                    ? t("fr.alreadyFr")
                    : solution.join(" ")}
              </Box>
              {result.inputFalseFr && (
                <Box fontSize="xs" color={FR_COLORS.warning} mb="3">
                  {t("fr.inputFalseFrNote")}
                </Box>
              )}
            </>
          ))}

        {hasSteps && showSteps && (
          <Box mb="3">
            <SolutionBreakdown
              steps={result.decomposition}
              shapeSteps={result.shapeDecomposition}
            />
          </Box>
        )}

        {!hideSolution && (
          <HStack justify="flex-end" gap="2">
            {hasSteps && (
              <Button
                size="xs"
                variant="outline"
                colorPalette={FR_COLORS.palette}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSteps((v) => !v);
                }}
              >
                {t("fr.steps.toggle")}
              </Button>
            )}
            <Button
              size="xs"
              variant={active ? "solid" : "outline"}
              colorPalette={FR_COLORS.palette}
              disabled={!solution || solution.length === 0}
              onClick={(e) => {
                e.stopPropagation();
                onDemo();
              }}
            >
              {t("fr.demo")}
            </Button>
          </HStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}
