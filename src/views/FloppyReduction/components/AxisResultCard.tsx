"use client";

import { Badge, Box, Button, Card, Flex, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import type { AxisResult, SolutionStep } from "@/views/FloppyReduction/fr";

function badgeContent(result: AxisResult, alreadyFrLabel: string, falseFrLabel: string) {
  if (result.inputFalseFr) return { text: falseFrLabel, palette: "red" as const };
  if (result.alreadyFr) return { text: alreadyFrLabel, palette: "green" as const };
  return { text: result.caseLabel, palette: "purple" as const };
}

const AXIS_LABEL: Record<string, string> = {
  ud: "U / D",
  fb: "F / B",
  rl: "R / L",
};

function StepList({ steps }: { steps: SolutionStep[] }) {
  const { t, tf } = useI18n();
  return (
    <Box fontSize="xs" borderLeftWidth="2px" borderColor="border" pl="2">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <Box key={i} py="0.5">
            <Text as="span" fontFamily="mono" fontWeight="semibold">
              {s.move ?? t("fr.steps.start")}
            </Text>
            <Text as="span" color="fg.muted">
              {" → "}
              {s.caseLabel}
            </Text>
            {last && (
              <Text
                as="span"
                ml="1"
                fontWeight="medium"
                color={s.trueFr ? "green.600" : "orange.600"}
              >
                {s.trueFr ? t("fr.steps.frDone") : t("fr.steps.falseFrDone")}
              </Text>
            )}
            {!last && s.trigger && (
              <Text as="span" ml="1" color="purple.500">
                （{tf("fr.steps.triggerHint", { alg: s.trigger })}）
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export interface AxisResultCardProps {
  result: AxisResult;
  active: boolean;
  onSelect: () => void;
  onDemo: () => void;
}

export function AxisResultCard({
  result,
  active,
  onSelect,
  onDemo,
}: AxisResultCardProps) {
  const { t } = useI18n();
  const { solution } = result;
  const badge = badgeContent(result, t("fr.alreadyFr"), t("fr.falseFr"));
  const [showSteps, setShowSteps] = useState(false);

  const hasSteps =
    (result.decomposition && result.decomposition.length > 1) ||
    (result.shapeDecomposition && result.shapeDecomposition.length > 0);

  return (
    <Card.Root
      borderRadius="xl"
      variant="outline"
      cursor="pointer"
      onClick={onSelect}
      borderWidth="2px"
      borderColor={active ? "accent" : "border"}
      transition="border-color 0.15s"
    >
      <Card.Body p="4">
        <Flex justify="space-between" align="center" mb="3">
          <Text fontWeight="bold" fontSize="lg">
            {AXIS_LABEL[result.axisKey]} {t("fr.axisSuffix")}
          </Text>
          <Badge colorPalette={badge.palette} size="lg">
            {badge.text}
          </Badge>
        </Flex>

        <Box fontSize="sm" color="fg.muted" mb="1">
          {t("fr.badEdges")}：
          <Text as="span" color="fg" fontWeight="medium">
            {result.badCount} ({result.badTop}-{result.badBottom})
          </Text>
        </Box>
        <Box fontSize="sm" color="fg.muted" mb="3">
          {t("fr.corner")}：
          <Text as="span" color="fg" fontWeight="medium">
            {result.cornerLabel}
          </Text>
        </Box>

        {result.shapeIsFalseFr && result.shapeSolution && solution ? (
          <Box mb="3">
            <Box fontSize="sm" color="orange.600" mb="0.5">
              {t("fr.falseFrSolution")}：
            </Box>
            <Box fontFamily="mono" fontSize="md" fontWeight="semibold" mb="2">
              {result.shapeSolution.join(" ")}
            </Box>
            <Box fontSize="sm" color="green.600" mb="0.5">
              {t("fr.correctSolution")}：
            </Box>
            <Box fontFamily="mono" fontSize="md" fontWeight="semibold">
              {solution.join(" ")}
            </Box>
          </Box>
        ) : (
          <>
            <Box fontSize="sm" color="fg.muted" mb="1">
              {t("fr.solution")}：
            </Box>
            <Box
              fontFamily="mono"
              fontSize="md"
              fontWeight="semibold"
              color="fg"
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
              <Box fontSize="xs" color="orange.600" mb="3">
                {t("fr.inputFalseFrNote")}
              </Box>
            )}
          </>
        )}

        {hasSteps && showSteps && (
          <Box mb="3">
            {result.shapeDecomposition ? (
              <>
                <Text fontSize="xs" color="orange.600" fontWeight="medium" mb="1">
                  {t("fr.steps.shapeTitle")}
                </Text>
                <StepList steps={result.shapeDecomposition} />
                <Text
                  fontSize="xs"
                  color="green.600"
                  fontWeight="medium"
                  mt="2"
                  mb="1"
                >
                  {t("fr.steps.trueTitle")}
                </Text>
                <StepList steps={result.decomposition} />
              </>
            ) : (
              <StepList steps={result.decomposition} />
            )}
          </Box>
        )}

        <HStack justify="flex-end" gap="2">
          {hasSteps && (
            <Button
              size="xs"
              variant="ghost"
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
            colorPalette="purple"
            disabled={!solution || solution.length === 0}
            onClick={(e) => {
              e.stopPropagation();
              onDemo();
            }}
          >
            {t("fr.demo")}
          </Button>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
