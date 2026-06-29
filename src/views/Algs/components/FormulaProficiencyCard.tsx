"use client";

import {
  Box,
  Card,
  CloseButton,
  Collapsible,
  Dialog,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import {
  getFormulaProficiency,
  setFormulaProficiency,
  type ProficiencyLevel,
} from "@/services/cubing-pro/algs/formulaPracticeProficiency";
import { buildFormulaKey } from "@/services/cubing-pro/algs/formulaPracticeSelection";
import type { FormulaItem } from "../types";
import { ALGS_COLORS } from "../utils/constants";
import ProficiencySelect from "./ProficiencySelect";
import SvgRenderer from "./SvgRenderer";
import "../styles/practiceTools.css";

interface FormulaProficiencyCardProps {
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  onOpenFormulaPractice?: () => void;
  refreshKey?: number;
  embedded?: boolean;
}

export default function FormulaProficiencyCard({
  cube,
  classId,
  flatAlgs,
  onOpenFormulaPractice,
  refreshKey = 0,
  embedded = false,
}: FormulaProficiencyCardProps) {
  useReleaseOverlayOnUnmount();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, ProficiencyLevel>>(
    () => getFormulaProficiency(cube, classId),
  );

  useEffect(() => {
    setProficiencyMap(getFormulaProficiency(cube, classId));
  }, [cube, classId, refreshKey]);

  const handleProficiencyChange = useCallback(
    (formulaKey: string, level: ProficiencyLevel) => {
      setFormulaProficiency(cube, classId, formulaKey, level);
      setProficiencyMap((prev) => ({ ...prev, [formulaKey]: level }));
    },
    [cube, classId],
  );

  const markedCount = useMemo(
    () =>
      Object.keys(proficiencyMap).filter((key) =>
        flatAlgs.some(
          (f) => buildFormulaKey(f.setName, f.groupName, f.alg.name) === key,
        ),
      ).length,
    [proficiencyMap, flatAlgs],
  );

  const groupedBySetAndGroup = useMemo(() => {
    const map: Record<string, Record<string, FormulaItem[]>> = {};
    for (const item of flatAlgs) {
      if (!map[item.setName]) map[item.setName] = {};
      if (!map[item.setName][item.groupName]) map[item.setName][item.groupName] = [];
      map[item.setName][item.groupName].push(item);
    }
    return map;
  }, [flatAlgs]);

  const summary = (
    <>
      <div className="algs-practice-tool-cell-header">
        <span className="algs-practice-tool-cell-icon" aria-hidden>
          🚩
        </span>
        <span className="algs-practice-tool-cell-title">
          {t("algs.proficiencyCard.title")}
          {markedCount > 0 && (
            <span className="algs-practice-tool-cell-badge"> ({markedCount})</span>
          )}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">{t("algs.proficiencyCard.desc")}</p>
      {onOpenFormulaPractice && (
        <p className="algs-practice-tool-cell-hint">
          {t("algs.proficiencyCard.practiceHint")}
        </p>
      )}
    </>
  );

  return (
    <>
      {embedded ? (
        <button
          type="button"
          className="algs-practice-tool-cell algs-practice-tool-cell--proficiency"
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
          if (!e.open) setModalOpen(false);
        }}
        size="xl"
        placement="center"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" maxW="760px" maxH="90vh">
            <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
              <Dialog.Title fontSize="md" fontWeight="bold">
                {t("algs.proficiencyCard.modalTitle")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto" maxH="560px" pb={4}>
              <Text fontSize="xs" color="fg.muted" mb={3}>
                {t("algs.proficiencyCard.modalDesc")}
              </Text>
              {Object.entries(groupedBySetAndGroup).map(([setName, groups]) => (
                <Collapsible.Root key={setName} defaultOpen>
                  <Collapsible.Trigger asChild>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 0",
                        fontWeight: 600,
                        fontSize: "14px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "inherit",
                      }}
                    >
                      {t("algs.detail.set")}: {setName}
                    </button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    {Object.entries(groups).map(([groupName, items]) => (
                      <Collapsible.Root
                        key={`${setName}-${groupName}`}
                        defaultOpen
                        ml={2}
                        mb={2}
                      >
                        <Collapsible.Trigger asChild>
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "6px 0",
                              fontSize: "14px",
                              opacity: 0.75,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "inherit",
                            }}
                          >
                            {t("algs.detail.group")}: {groupName} ({items.length})
                          </button>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <Flex direction="column" gap={1.5} py={1}>
                            {items.map((item) => {
                              const key = buildFormulaKey(
                                item.setName,
                                item.groupName,
                                item.alg.name,
                              );
                              const level = proficiencyMap[key] ?? "average";
                              return (
                                <Flex
                                  key={key}
                                  align="center"
                                  gap={3}
                                  px={3}
                                  py={2}
                                  bg="bg.subtle"
                                  borderRadius="lg"
                                >
                                  <SvgRenderer
                                    svg={item.alg.image ?? ""}
                                    maxWidth={40}
                                    maxHeight={56}
                                    style={{ flexShrink: 0 }}
                                  />
                                  <Box flex={1} minW={0}>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {item.alg.name}
                                    </Text>
                                    <Text fontSize="xs" color="fg.muted">
                                      {item.setName} · {item.groupName}
                                    </Text>
                                  </Box>
                                  <ProficiencySelect
                                    value={level}
                                    onChange={(v) => handleProficiencyChange(key, v)}
                                    size="sm"
                                  />
                                </Flex>
                              );
                            })}
                          </Flex>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    ))}
                  </Collapsible.Content>
                </Collapsible.Root>
              ))}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
