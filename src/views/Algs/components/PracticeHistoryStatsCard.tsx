"use client";

import {
  Box,
  Button,
  Card,
  CloseButton,
  Dialog,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import { toaster } from "@/components/ui/toaster";
import {
  getFormulaPracticeHistory,
  clearFormulaPracticeHistory,
} from "@/services/cubing-pro/algs/formulaPracticeHistory";
import {
  getFormulaProficiency,
  type ProficiencyLevel,
} from "@/services/cubing-pro/algs/formulaPracticeProficiency";
import type { MessageKey } from "@/i18n";
import { ALGS_COLORS } from "../utils/constants";
import "../styles/practiceTools.css";

const PROFICIENCY_LABEL_KEYS: Record<ProficiencyLevel, MessageKey> = {
  mastered: "algs.formulaPractice.proficiency.mastered",
  skilled: "algs.formulaPractice.proficiency.skilled",
  average: "algs.formulaPractice.proficiency.average",
  unskilled: "algs.formulaPractice.proficiency.unskilled",
  unknown: "algs.formulaPractice.proficiency.unknown",
};

const PROFICIENCY_DISPLAY: {
  value: ProficiencyLevel;
  icon: string;
  color: string;
}[] = [
  { value: "mastered", icon: "✓", color: "var(--signal-success)" },
  { value: "skilled", icon: "⚡", color: "var(--signal-info)" },
  { value: "average", icon: "−", color: "var(--muted-foreground)" },
  { value: "unskilled", icon: "!", color: "var(--signal-warning)" },
  { value: "unknown", icon: "✕", color: "var(--destructive)" },
];

interface PracticeHistoryStatsCardProps {
  cube: string;
  classId: string;
  refreshKey?: number;
  embedded?: boolean;
}

export interface FormulaStatsItem {
  formulaKey: string;
  formulaName: string;
  setName: string;
  groupName: string;
  count: number;
  frequency: number;
}

export default function PracticeHistoryStatsCard({
  cube,
  classId,
  refreshKey = 0,
  embedded = false,
}: PracticeHistoryStatsCardProps) {
  useReleaseOverlayOnUnmount();
  const { t, tf } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sortKey, setSortKey] = useState<"count" | "frequency">("count");
  const [sortAsc, setSortAsc] = useState(false);

  const proficiencyMap = useMemo(
    () => getFormulaProficiency(cube, classId),
    [cube, classId, refreshKey],
  );

  const stats = useMemo(() => {
    const records = getFormulaPracticeHistory(cube, classId);
    const total = records.length;
    const map = new Map<
      string,
      { formulaName: string; setName: string; groupName: string; count: number }
    >();
    for (const r of records) {
      const existing = map.get(r.formulaKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(r.formulaKey, {
          formulaName: r.formulaName,
          setName: r.setName,
          groupName: r.groupName,
          count: 1,
        });
      }
    }
    const items: FormulaStatsItem[] = [];
    map.forEach((v, key) => {
      items.push({
        formulaKey: key,
        formulaName: v.formulaName,
        setName: v.setName,
        groupName: v.groupName,
        count: v.count,
        frequency: total > 0 ? (v.count / total) * 100 : 0,
      });
    });
    items.sort((a, b) => {
      const av = sortKey === "count" ? a.count : a.frequency;
      const bv = sortKey === "count" ? b.count : b.frequency;
      return sortAsc ? av - bv : bv - av;
    });
    return { items, total };
  }, [cube, classId, refreshKey, clearTrigger, sortKey, sortAsc]);

  const handleClearHistory = () => {
    clearFormulaPracticeHistory(cube, classId);
    setClearTrigger((n) => n + 1);
    setConfirmClear(false);
    toaster.create({
      title: t("algs.practiceHistoryStats.clearSuccess"),
      type: "success",
    });
  };

  const toggleSort = (key: "count" | "frequency") => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const summary = (
    <>
      <div className="algs-practice-tool-cell-header">
        <span className="algs-practice-tool-cell-icon" aria-hidden>
          📊
        </span>
        <span className="algs-practice-tool-cell-title">
          {t("algs.practiceHistoryStats.title")}
          {stats.total > 0 && (
            <span className="algs-practice-tool-cell-badge"> ({stats.total})</span>
          )}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">
        {t("algs.practiceHistoryStats.desc")}
      </p>
    </>
  );

  return (
    <>
      {embedded ? (
        <button
          type="button"
          className="algs-practice-tool-cell algs-practice-tool-cell--history"
          onClick={() => setModalOpen(true)}
        >
          {summary}
        </button>
      ) : (
        <Card.Root
          size="sm"
          borderRadius="xl"
          bg={ALGS_COLORS.cardBg}
          borderColor={ALGS_COLORS.cardBorder}
          borderWidth="1px"
          cursor="pointer"
          h="full"
          onClick={() => setModalOpen(true)}
        >
          <Card.Body p={4} h="full">
            {summary}
          </Card.Body>
        </Card.Root>
      )}

      <Dialog.Root
        open={modalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setModalOpen(false);
            setConfirmClear(false);
          }
        }}
        size="xl"
        placement="center"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" maxW="880px" maxH="90vh">
            <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
              <Dialog.Title fontSize="md" fontWeight="bold">
                {t("algs.practiceHistoryStats.modalTitle")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto" maxH="640px" pb={4}>
              <Text fontSize="xs" color="fg.muted" mb={3}>
                {tf("algs.practiceHistoryStats.modalDesc", { total: stats.total })}
              </Text>
              {stats.items.length === 0 ? (
                <Text py={6} textAlign="center" color="fg.muted">
                  {t("algs.formulaPractice.historyEmpty")}
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Box as="table" w="full" fontSize="sm" borderCollapse="collapse">
                    <Box as="thead">
                      <Box as="tr" borderBottomWidth="1px" borderColor="border">
                        <Box as="th" textAlign="left" py={2} px={2} fontWeight="medium">
                          {t("algs.detail.set")}
                        </Box>
                        <Box as="th" textAlign="left" py={2} px={2} fontWeight="medium">
                          {t("algs.detail.group")}
                        </Box>
                        <Box as="th" textAlign="left" py={2} px={2} fontWeight="medium">
                          {t("algs.practiceHistoryStats.formulaName")}
                        </Box>
                        <Box as="th" textAlign="left" py={2} px={2} fontWeight="medium">
                          {t("algs.practiceHistoryStats.proficiency")}
                        </Box>
                        <Box
                          as="th"
                          textAlign="left"
                          py={2}
                          px={2}
                          fontWeight="medium"
                          cursor="pointer"
                          onClick={() => toggleSort("count")}
                        >
                          {t("algs.practiceHistoryStats.count")}
                          {sortKey === "count" ? (sortAsc ? " ↑" : " ↓") : ""}
                        </Box>
                        <Box
                          as="th"
                          textAlign="left"
                          py={2}
                          px={2}
                          fontWeight="medium"
                          cursor="pointer"
                          onClick={() => toggleSort("frequency")}
                        >
                          {t("algs.practiceHistoryStats.frequency")}
                          {sortKey === "frequency" ? (sortAsc ? " ↑" : " ↓") : ""}
                        </Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {stats.items.map((row) => {
                        const level = proficiencyMap[row.formulaKey] ?? "average";
                        const config = PROFICIENCY_DISPLAY.find((c) => c.value === level);
                        return (
                          <Box
                            as="tr"
                            key={row.formulaKey}
                            borderBottomWidth="1px"
                            borderColor="border"
                          >
                            <Box as="td" py={2} px={2}>
                              {row.setName}
                            </Box>
                            <Box as="td" py={2} px={2}>
                              {row.groupName}
                            </Box>
                            <Box as="td" py={2} px={2} fontWeight="medium">
                              {row.formulaName}
                            </Box>
                            <Box as="td" py={2} px={2}>
                              {config ? (
                                <HStack gap={1.5}>
                                  <Text as="span" color={config.color}>
                                    {config.icon}
                                  </Text>
                                  <Text fontSize="sm">
                                    {t(PROFICIENCY_LABEL_KEYS[level])}
                                  </Text>
                                </HStack>
                              ) : null}
                            </Box>
                            <Box as="td" py={2} px={2}>
                              {row.count}
                            </Box>
                            <Box as="td" py={2} px={2}>
                              {row.frequency.toFixed(1)}%
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            {stats.total > 0 && (
              <Box borderTopWidth="1px" borderColor="border" px={4} py={3}>
                {confirmClear ? (
                  <Flex gap={2} align="center" flexWrap="wrap">
                    <Text fontSize="sm">{t("algs.practiceHistoryStats.clearConfirm")}</Text>
                    <Button
                      size="sm"
                      colorPalette="red"
                      onClick={handleClearHistory}
                    >
                      {t("algs.practiceHistoryStats.clearConfirmOk")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmClear(false)}
                    >
                      {t("algs.practiceHistoryStats.clearConfirmCancel")}
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() => setConfirmClear(true)}
                  >
                    {t("algs.practiceHistoryStats.clearHistory")}
                  </Button>
                )}
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
