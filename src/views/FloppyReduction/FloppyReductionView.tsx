"use client";

import {
  Box,
  Button,
  Card,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { AxisResultCard } from "@/views/FloppyReduction/components/AxisResultCard";
import { FrHelpDialog } from "@/views/FloppyReduction/components/FrHelpDialog";
import {
  FR_EXAMPLE_SCRAMBLE,
  ScrambleInput,
} from "@/views/FloppyReduction/components/ScrambleInput";
import {
  analyzeScramble,
  generateHtrScramble,
  type AxisKey,
  type FrAnalysis,
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

export function FloppyReductionView() {
  const { t, tf } = useI18n();
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<FrAnalysis | null>(null);
  const [activeAxis, setActiveAxis] = useState<AxisKey>("ud");
  const [demo, setDemo] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const runAnalyze = useCallback((scramble: string) => {
    setAnalysis(analyzeScramble(scramble));
    setActiveAxis("ud");
    setDemo(false);
  }, []);

  const handleRandom = useCallback(() => {
    const s = generateHtrScramble();
    setInput(s);
    runAnalyze(s);
  }, [runAnalyze]);

  // 首次加载默认进入随机示例（在客户端生成，避免水合不一致）
  useEffect(() => {
    handleRandom();
  }, [handleRandom]);

  const handleExample = useCallback(() => {
    setInput(FR_EXAMPLE_SCRAMBLE);
    runAnalyze(FR_EXAMPLE_SCRAMBLE);
  }, [runAnalyze]);

  const activeResult = useMemo(
    () => analysis?.axes.find((a) => a.axisKey === activeAxis) ?? null,
    [analysis, activeAxis],
  );

  const showCube = analysis?.ok && analysis.isHtr;

  return (
    <VStack align="stretch" gap="6">
      <ScrambleInput
        value={input}
        onChange={setInput}
        onAnalyze={() => runAnalyze(input)}
        onRandom={handleRandom}
        onExample={handleExample}
        onHelp={() => setHelpOpen(true)}
      />

      <FrHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      {analysis && !analysis.ok && (
        <Card.Root borderRadius="lg" borderColor="red.500" borderWidth="1px">
          <Card.Body color="red.500" fontSize="sm">
            {tf("fr.error.parse", { token: analysis.errorToken ?? "" })}
          </Card.Body>
        </Card.Root>
      )}

      {analysis?.ok && !analysis.isHtr && (
        <Card.Root borderRadius="lg" borderColor="orange.500" borderWidth="1px">
          <Card.Body color="orange.600" fontSize="sm">
            {t("fr.error.notHtr")}
          </Card.Body>
        </Card.Root>
      )}

      {showCube && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
          <Card.Root borderRadius="xl" variant="outline">
            <Card.Body>
              <FrCube3D
                scramble={analysis!.scramble}
                solution={demo ? (activeResult?.solution ?? null) : null}
                axisKey={activeAxis}
              />
            </Card.Body>
          </Card.Root>

          <VStack align="stretch" gap="3" justify="center">
            <Text fontSize="sm" color="fg.muted">
              {t("fr.highlightTip")}
            </Text>
            <HStack gap="2">
              {AXIS_TABS.map((ax) => (
                <Button
                  key={ax}
                  size="sm"
                  variant={activeAxis === ax ? "solid" : "outline"}
                  colorPalette="purple"
                  onClick={() => {
                    setActiveAxis(ax);
                    setDemo(false);
                  }}
                >
                  {AXIS_TAB_LABEL[ax]}
                </Button>
              ))}
            </HStack>
            {demo && (
              <Button
                size="xs"
                variant="ghost"
                alignSelf="flex-start"
                onClick={() => setDemo(false)}
              >
                {t("fr.showScrambleOnly")}
              </Button>
            )}
            <Text fontSize="xs" color="fg.muted">
              {t("fr.legend")}
            </Text>
          </VStack>
        </SimpleGrid>
      )}

      {showCube && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
          {analysis!.axes.map((res) => (
            <AxisResultCard
              key={res.axisKey}
              result={res}
              active={activeAxis === res.axisKey}
              onSelect={() => {
                setActiveAxis(res.axisKey);
                setDemo(false);
              }}
              onDemo={() => {
                setActiveAxis(res.axisKey);
                setDemo(true);
              }}
            />
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
}
