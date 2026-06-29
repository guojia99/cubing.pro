"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Collapsible,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import {
  clearFrPracticeHistory,
  getFrPracticeHistory,
  type FrPracticeRecord,
} from "@/services/cubing-pro/fr/practiceHistory";
import { FR_COLORS } from "@/views/FloppyReduction/utils/constants";
import type { AxisKey } from "@/views/FloppyReduction/fr";

const AXIS_LABEL: Record<AxisKey, string> = {
  ud: "U / D",
  fb: "F / B",
  rl: "R / L",
};

function formatTime(ts: number, locale: string): string {
  return new Date(ts).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryRow({ record, locale }: { record: FrPracticeRecord; locale: string }) {
  const { t } = useI18n();

  return (
    <Box
      borderWidth="1px"
      borderColor={FR_COLORS.border}
      borderRadius="md"
      p="3"
      fontSize="sm"
    >
      <Flex justify="space-between" align="center" gap="2" mb="1" flexWrap="wrap">
        <HStack gap="2">
          <Badge
            size="sm"
            bg={record.correct ? FR_COLORS.successSoft : FR_COLORS.destructiveSoft}
            color={record.correct ? FR_COLORS.success : FR_COLORS.destructive}
            borderWidth="1px"
            borderColor={record.correct ? FR_COLORS.success : FR_COLORS.destructive}
          >
            {record.correct ? t("fr.practice.resultCorrect") : t("fr.practice.resultWrong")}
          </Badge>
          <Text fontWeight="medium">{AXIS_LABEL[record.axisKey]}</Text>
          <Text color={FR_COLORS.fgMuted} fontSize="xs">
            {record.caseLabel}
          </Text>
        </HStack>
        <Text fontSize="xs" color={FR_COLORS.fgMuted}>
          {formatTime(record.createdAt, locale)}
        </Text>
      </Flex>
      <Text fontFamily="mono" fontSize="xs" color={FR_COLORS.fgMuted} mb="1" lineClamp={1}>
        {record.scramble}
      </Text>
      <Flex gap="4" flexWrap="wrap" fontSize="xs">
        <Text>
          {t("fr.practice.yourSolution")}:{" "}
          <Text as="span" fontFamily="mono" fontWeight="medium">
            {record.userSolution || "—"}
          </Text>
          <Text as="span" color={FR_COLORS.fgMuted}>
            {" "}
            ({record.userMoveCount})
          </Text>
        </Text>
        {record.referenceSolution && (
          <Text>
            {t("fr.solution")}:{" "}
            <Text as="span" fontFamily="mono" fontWeight="medium">
              {record.referenceSolution.join(" ") || t("fr.alreadyFr")}
            </Text>
            <Text as="span" color={FR_COLORS.fgMuted}>
              {" "}
              ({record.referenceMoveCount ?? 0})
            </Text>
          </Text>
        )}
      </Flex>
    </Box>
  );
}

export function PracticeHistoryPanel() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<FrPracticeRecord[]>(() => getFrPracticeHistory());

  const refresh = useCallback(() => {
    setRecords(getFrPracticeHistory());
  }, []);

  const handleClear = () => {
    clearFrPracticeHistory();
    refresh();
  };

  if (records.length === 0 && !open) {
    return null;
  }

  return (
    <Card.Root borderRadius="xl" variant="outline">
      <Card.Body p="4">
        <Collapsible.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
          <Flex justify="space-between" align="center" mb={open ? "3" : "0"}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" size="sm" px="0">
                <HStack gap="2">
                  <Text fontWeight="semibold">{t("fr.practice.historyTitle")}</Text>
                  <Badge colorPalette={FR_COLORS.palette} variant="subtle">
                    {records.length}
                  </Badge>
                </HStack>
              </Button>
            </Collapsible.Trigger>
            {open && records.length > 0 && (
              <Button
                size="xs"
                variant="ghost"
                color={FR_COLORS.destructive}
                onClick={handleClear}
              >
                {t("fr.practice.historyClear")}
              </Button>
            )}
          </Flex>
          <Collapsible.Content>
            {records.length === 0 ? (
              <Text fontSize="sm" color={FR_COLORS.fgMuted}>
                {t("fr.practice.historyEmpty")}
              </Text>
            ) : (
              <VStack align="stretch" gap="2" maxH="320px" overflowY="auto">
                {records.map((r) => (
                  <HistoryRow key={r.id} record={r} locale={locale} />
                ))}
              </VStack>
            )}
          </Collapsible.Content>
        </Collapsible.Root>
      </Card.Body>
    </Card.Root>
  );
}