"use client";

import {
  Box,
  Button,
  Card,
  HStack,
  SegmentGroup,
  SimpleGrid,
  Spacer,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { appendFrPracticeRecord, type FrAxisMode } from "@/services/cubing-pro/fr/practiceHistory";
import { AxisResultCard } from "@/views/FloppyReduction/components/AxisResultCard";
import { SolutionBreakdown } from "@/views/FloppyReduction/components/SolutionBreakdown";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import {
  analyzeScramble,
  generateHtrScramble,
  parsePracticeSolutionInput,
  verifyFrSolution,
  type AxisKey,
  type FrAnalysis,
  type VerifyFrResult,
} from "@/views/FloppyReduction/fr";

const FrCube3D = dynamic(
  () => import("@/views/FloppyReduction/components/FrCube3D").then((m) => m.FrCube3D),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" h="320px">
        <Spinner />
      </Box>
    ),
  },
);

const AXIS_TABS: AxisKey[] = ["ud", "fb", "rl"];
const AXIS_TAB_LABEL: Record<AxisKey, string> = {
  ud: "U / D",
  fb: "F / B",
  rl: "R / L",
};

function pickRandomAxis(): AxisKey {
  return AXIS_TABS[Math.floor(Math.random() * AXIS_TABS.length)]!;
}

export function PracticePanel({
  onHistoryChange,
  onHelp,
}: {
  onHistoryChange?: () => void;
  onHelp: () => void;
}) {
  const { t, tf } = useI18n();
  const [analysis, setAnalysis] = useState<FrAnalysis | null>(null);
  const [axisKey, setAxisKey] = useState<AxisKey>("ud");
  const [axisMode, setAxisMode] = useState<FrAxisMode>("pick");
  const [userSolution, setUserSolution] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyFrResult | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  const loadScramble = useCallback((scramble: string, assignRandomAxis = false) => {
    const result = analyzeScramble(scramble);
    setAnalysis(result);
    setUserSolution("");
    setSubmitted(false);
    setVerifyResult(null);
    setShowSteps(true);
    if (assignRandomAxis) {
      setAxisMode("random");
      setAxisKey(pickRandomAxis());
    }
  }, []);

  const handleRandom = useCallback(() => {
    loadScramble(generateHtrScramble(), true);
  }, [loadScramble]);

  useEffect(() => {
    handleRandom();
    // 仅首次进入练习时出题，轴切换不得触发重新随机
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAttempt = useCallback(() => {
    setUserSolution("");
    setSubmitted(false);
    setVerifyResult(null);
  }, []);

  const handleRandomAxis = useCallback(() => {
    setAxisMode("random");
    setAxisKey(pickRandomAxis());
    resetAttempt();
  }, [resetAttempt]);

  const handleAxisPick = useCallback(
    (ax: AxisKey) => {
      if (ax === axisKey && axisMode === "pick") return;
      setAxisMode("pick");
      setAxisKey(ax);
      resetAttempt();
    },
    [axisKey, axisMode, resetAttempt],
  );

  const activeResult = useMemo(
    () => analysis?.axes.find((a) => a.axisKey === axisKey) ?? null,
    [analysis, axisKey],
  );

  const showCube = analysis?.ok && analysis.isHtr;

  const liveInput = useMemo(() => {
    if (!analysis?.ok || !analysis.isHtr || submitted) {
      return null;
    }
    return parsePracticeSolutionInput(analysis.scramble, userSolution, axisKey);
  }, [analysis, userSolution, axisKey, submitted]);

  const canSubmit =
    showCube &&
    !submitted &&
    userSolution.trim().length > 0 &&
    liveInput?.status !== "invalid";

  const inputBorderColor = useMemo(() => {
    if (!liveInput) return undefined;
    if (liveInput.status === "invalid") return FR_COLORS.destructive;
    if (liveInput.status === "trueFr") return FR_COLORS.success;
    if (liveInput.status === "falseFr") return FR_COLORS.warning;
    return undefined;
  }, [liveInput]);

  const referenceSolution = submitted ? (activeResult?.solution ?? null) : null;
  const showReferencePlayback = Boolean(referenceSolution?.length);

  const handleSubmit = useCallback(() => {
    if (!analysis?.ok || !analysis.isHtr) return;
    const result = verifyFrSolution(analysis.scramble, userSolution, axisKey);
    setVerifyResult(result);
    setSubmitted(true);

    const axisResult = analysis.axes.find((a) => a.axisKey === axisKey);
    if (axisResult) {
      appendFrPracticeRecord({
        scramble: analysis.scramble,
        axisKey,
        axisMode,
        userSolution: userSolution.trim(),
        correct: result.ok && result.correct,
        caseLabel: axisResult.caseLabel,
        referenceSolution: axisResult.solution,
        userMoveCount: result.userMoves.length,
        referenceMoveCount: axisResult.solution?.length ?? null,
      });
      onHistoryChange?.();
    }
  }, [analysis, userSolution, axisKey, axisMode, onHistoryChange]);

  return (
    <VStack align="stretch" gap="6">
      <HStack gap="2" flexWrap="wrap">
        <Button variant="outline" colorPalette={FR_COLORS.palette} onClick={handleRandom}>
          {t("fr.btn.random")}
        </Button>
        <Spacer />
        <Button variant="outline" onClick={onHelp}>
          {t("fr.btn.help")}
        </Button>
      </HStack>

      {analysis && !analysis.ok && (
        <Card.Root borderRadius="lg" borderColor={FR_COLORS.destructive} borderWidth="1px">
          <Card.Body color={FR_COLORS.destructive} fontSize="sm">
            {tf("fr.error.parse", { token: analysis.errorToken ?? "" })}
          </Card.Body>
        </Card.Root>
      )}

      {analysis?.ok && !analysis.isHtr && (
        <Card.Root borderRadius="lg" borderColor={FR_COLORS.warning} borderWidth="1px">
          <Card.Body color={FR_COLORS.warning} fontSize="sm">
            {t("fr.error.notHtr")}
          </Card.Body>
        </Card.Root>
      )}

      {showCube && (
        <>
          <Text fontFamily="mono" fontSize="sm" color="fg.muted" wordBreak="break-all">
            {analysis!.scramble}
          </Text>

          <Card.Root borderRadius="lg" variant="outline" bg="bg.subtle">
            <Card.Body>
              <Text fontSize="sm" fontWeight="medium" mb="3">
                {t("fr.practice.axisPrompt")}
              </Text>
              <HStack gap="2" flexWrap="wrap" mb="2">
                <SegmentGroup.Root
                  value={axisKey}
                  onValueChange={(e) => {
                    const v = e.value as AxisKey | null;
                    if (v) handleAxisPick(v);
                  }}
                  size="sm"
                >
                  <SegmentGroup.Indicator />
                  {AXIS_TABS.map((ax) => (
                    <SegmentGroup.Item key={ax} value={ax}>
                      <SegmentGroup.ItemText>{AXIS_TAB_LABEL[ax]}</SegmentGroup.ItemText>
                      <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                  ))}
                </SegmentGroup.Root>
                <Button size="sm" variant="outline" colorPalette={FR_COLORS.palette} onClick={handleRandomAxis}>
                  {t("fr.practice.randomAxis")}
                </Button>
                {axisMode === "random" && (
                  <Text fontSize="xs" color="fg.muted">
                    {t("fr.practice.randomAxisHint")}
                  </Text>
                )}
              </HStack>
            </Card.Body>
          </Card.Root>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
            <Card.Root borderRadius="xl" variant="outline">
              <Card.Body>
                <FrCube3D
                  scramble={analysis!.scramble}
                  previewMoves={
                    !submitted && liveInput?.appliedMoves.length
                      ? liveInput.appliedMoves
                      : null
                  }
                  solution={referenceSolution}
                  axisKey={axisKey}
                  showControls={showReferencePlayback}
                />
              </Card.Body>
            </Card.Root>

            <VStack align="stretch" gap="4">
              {activeResult && (
                <AxisResultCard
                  result={activeResult}
                  active
                  onSelect={() => {}}
                  hideSolution={!submitted}
                />
              )}

              {!submitted ? (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="2">
                    {t("fr.practice.solutionInput")}
                  </Text>
                  <Textarea
                    value={userSolution}
                    onChange={(e) => setUserSolution(e.target.value)}
                    placeholder={t("fr.practice.solutionPlaceholder")}
                    rows={3}
                    fontFamily="mono"
                    resize="vertical"
                    borderWidth={inputBorderColor ? "2px" : "1px"}
                    borderColor={inputBorderColor}
                    _focusVisible={
                      inputBorderColor
                        ? { borderColor: inputBorderColor, outline: "none" }
                        : undefined
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
                        handleSubmit();
                      }
                    }}
                  />
                  {liveInput?.status === "invalid" && liveInput.invalidToken && (
                    <Text fontSize="xs" color={FR_COLORS.destructive} mt="1">
                      {tf("fr.practice.liveInvalid", { token: liveInput.invalidToken })}
                    </Text>
                  )}
                  {liveInput?.status === "trueFr" && (
                    <Text fontSize="xs" color={FR_COLORS.success} mt="1" fontWeight="medium">
                      {t("fr.practice.liveTrueFr")}
                    </Text>
                  )}
                  {liveInput?.status === "falseFr" && (
                    <Text fontSize="xs" color={FR_COLORS.warning} mt="1">
                      {t("fr.practice.liveFalseFr")}
                    </Text>
                  )}
                  <Button
                    mt="3"
                    colorPalette={FR_COLORS.palette}
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                  >
                    {t("fr.practice.submit")}
                  </Button>
                </Box>
              ) : (
                verifyResult && (
                  <VStack align="stretch" gap="3">
                    <Card.Root
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={
                        verifyResult.ok && verifyResult.correct
                          ? FR_COLORS.success
                          : FR_COLORS.destructive
                      }
                    >
                      <Card.Body fontSize="sm">
                        {!verifyResult.ok ? (
                          <Text color={FR_COLORS.destructive}>
                            {tf("fr.error.parse", {
                              token: verifyResult.errorToken ?? "",
                            })}
                          </Text>
                        ) : verifyResult.correct ? (
                          <Text color={FR_COLORS.success} fontWeight="semibold">
                            {t("fr.practice.resultCorrect")}
                          </Text>
                        ) : verifyResult.falseFr ? (
                          <Text color={FR_COLORS.warning}>{t("fr.practice.resultFalseFr")}</Text>
                        ) : (
                          <Text color={FR_COLORS.destructive}>{t("fr.practice.resultWrong")}</Text>
                        )}
                      </Card.Body>
                    </Card.Root>

                    {activeResult && (
                      <>
                        <Box>
                          <Text fontSize="sm" color="fg.muted" mb="1">
                            {t("fr.practice.yourSolution")}：
                          </Text>
                          <Text fontFamily="mono" fontWeight="semibold">
                            {userSolution.trim() || t("fr.alreadyFr")}
                          </Text>
                        </Box>

                        {showSteps &&
                          activeResult.decomposition &&
                          activeResult.decomposition.length > 1 && (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" mb="2">
                                {t("fr.steps.toggle")}
                              </Text>
                              <SolutionBreakdown
                                steps={activeResult.decomposition}
                                shapeSteps={activeResult.shapeDecomposition}
                              />
                            </Box>
                          )}

                        <HStack gap="2">
                          <Button
                            size="sm"
                            variant="outline"
                            colorPalette={FR_COLORS.palette}
                            onClick={handleRandom}
                          >
                            {t("fr.practice.next")}
                          </Button>
                        </HStack>
                      </>
                    )}
                  </VStack>
                )
              )}
            </VStack>
          </SimpleGrid>
        </>
      )}
    </VStack>
  );
}
