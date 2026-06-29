"use client";

import { Box, Flex, Grid, Separator, Text, VStack } from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import type { SolutionStep } from "@/views/FloppyReduction/fr";

/** 解法列固定宽度，保证各步形态文字左对齐 */
const MOVE_COL_W = "3.25rem";

function MoveCell({ move, startLabel }: { move: string | null; startLabel: string }) {
  if (move) {
    return (
      <Box
        w="full"
        py="1.5"
        px="1"
        borderRadius="md"
        bg={FR_COLORS.accent}
        color={FR_COLORS.accentFg}
        fontFamily="mono"
        fontSize="md"
        fontWeight="bold"
        lineHeight="1"
        textAlign="center"
        letterSpacing="0.02em"
      >
        {move}
      </Box>
    );
  }

  return (
    <Box
      w="full"
      py="1.5"
      px="1"
      borderRadius="md"
      borderWidth="1px"
      borderColor={FR_COLORS.border}
      bg={FR_COLORS.bgSubtle}
      fontSize="xs"
      fontWeight="medium"
      color={FR_COLORS.fgMuted}
      lineHeight="1"
      textAlign="center"
    >
      {startLabel}
    </Box>
  );
}

function StepRow({ step, index, isLast }: { step: SolutionStep; index: number; isLast: boolean }) {
  const { t, tf } = useI18n();

  const dotBg = isLast
    ? step.trueFr
      ? FR_COLORS.success
      : FR_COLORS.warning
    : FR_COLORS.accent;
  const borderColor = isLast
    ? step.trueFr
      ? FR_COLORS.success
      : FR_COLORS.warning
    : FR_COLORS.border;
  const rowBg = isLast
    ? step.trueFr
      ? FR_COLORS.successSoft
      : FR_COLORS.warningSoft
    : FR_COLORS.bgSubtle;

  return (
    <Flex gap="3" align="center">
      <Flex
        flexShrink={0}
        w="6"
        h="6"
        borderRadius="full"
        bg={dotBg}
        color={isLast ? "white" : FR_COLORS.accentFg}
        fontSize="xs"
        fontWeight="bold"
        align="center"
        justify="center"
      >
        {index + 1}
      </Flex>

      <Box
        flex="1"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        px="3"
        py="2.5"
        bg={rowBg}
      >
        <Grid
          templateColumns={`${MOVE_COL_W} 1fr`}
          columnGap="3"
          rowGap="2"
          alignItems="center"
        >
          <MoveCell move={step.move} startLabel={t("fr.steps.start")} />

          <Box minW="0">
            <Text fontSize="sm" fontWeight="medium" color={FR_COLORS.fg} lineHeight="1.4">
              {step.caseLabel}
            </Text>
            {isLast ? (
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={step.trueFr ? FR_COLORS.success : FR_COLORS.warning}
                mt="0.5"
                lineHeight="1.4"
              >
                {step.trueFr ? t("fr.steps.frDone") : t("fr.steps.falseFrDone")}
              </Text>
            ) : null}
          </Box>

          {!isLast && step.trigger ? (
            <Box gridColumn="2">
              <Text
                px="2.5"
                py="1.5"
                borderRadius="sm"
                bg={FR_COLORS.accentSoft}
                borderWidth="1px"
                borderColor={FR_COLORS.accent}
                fontSize="xs"
                color={FR_COLORS.fgMuted}
                lineHeight="1.5"
              >
                {tf("fr.steps.triggerHint", { alg: step.trigger })}
              </Text>
            </Box>
          ) : null}
        </Grid>
      </Box>
    </Flex>
  );
}

function StepTimeline({ steps }: { steps: SolutionStep[] }) {
  return (
    <VStack align="stretch" gap="2.5">
      {steps.map((s, i) => (
        <StepRow key={i} step={s} index={i} isLast={i === steps.length - 1} />
      ))}
    </VStack>
  );
}

export interface SolutionBreakdownProps {
  steps: SolutionStep[];
  shapeSteps?: SolutionStep[] | null;
}

export function SolutionBreakdown({ steps, shapeSteps }: SolutionBreakdownProps) {
  const { t } = useI18n();

  if (shapeSteps && shapeSteps.length > 0) {
    return (
      <VStack align="stretch" gap="3">
        <Box>
          <Text fontSize="xs" color={FR_COLORS.warning} fontWeight="semibold" mb="2">
            {t("fr.steps.shapeTitle")}
          </Text>
          <StepTimeline steps={shapeSteps} />
        </Box>
        <Separator borderColor={FR_COLORS.border} />
        <Box>
          <Text fontSize="xs" color={FR_COLORS.success} fontWeight="semibold" mb="2">
            {t("fr.steps.trueTitle")}
          </Text>
          <StepTimeline steps={steps} />
        </Box>
      </VStack>
    );
  }

  return <StepTimeline steps={steps} />;
}
