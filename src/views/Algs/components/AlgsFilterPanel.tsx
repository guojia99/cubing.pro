"use client";

import { Box, Text, VStack, HStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import type { AlgClassDetail } from "@/services/cubing-pro/algs/algs";
import { buildGroupKey } from "@/services/cubing-pro/algs/formulaPracticeSelection";
import { collectVisibleFormulaKeys } from "../utils/algsFormulaFilter";
import "./algsFilter.css";

interface AlgsFilterPanelProps {
  data: AlgClassDetail;
  selectedSets: string[];
  selectedGroups: string[];
  hiddenFormulaKeys: string[];
  onSetToggle: (name: string) => void;
  onGroupToggle: (key: string) => void;
  onFormulaToggle: (key: string) => void;
  onSetSelectAll: () => void;
  onSetDeselectAll: () => void;
  onGroupSelectAll: () => void;
  onGroupDeselectAll: () => void;
  onFormulaSelectAll: () => void;
  onFormulaDeselectAll: () => void;
}

export default function AlgsFilterPanel({
  data,
  selectedSets,
  selectedGroups,
  hiddenFormulaKeys,
  onSetToggle,
  onGroupToggle,
  onFormulaToggle,
  onSetSelectAll,
  onSetDeselectAll,
  onGroupSelectAll,
  onGroupDeselectAll,
  onFormulaSelectAll,
  onFormulaDeselectAll,
}: AlgsFilterPanelProps) {
  const { t } = useI18n();
  const sets = data.sets ?? [];
  const setKeys = useMemo(
    () => data.setKeys ?? data.sets?.map((s) => s.name) ?? [],
    [data],
  );
  const hiddenSet = useMemo(() => new Set(hiddenFormulaKeys), [hiddenFormulaKeys]);
  const scopeKeys = useMemo(
    () => collectVisibleFormulaKeys(data, selectedSets, selectedGroups),
    [data, selectedSets, selectedGroups],
  );
  const visibleCount = scopeKeys.filter((k) => !hiddenSet.has(k)).length;

  return (
    <VStack className="algs-filter-panel" align="stretch" gap={3}>
      <Box as="section" className="algs-filter-section">
          <HStack className="algs-filter-heading" gap={1} mb={2} flexWrap="wrap" align="center">
            <Text fontSize="xs" color="fg.muted">{t("algs.detail.set")}</Text>
            <button type="button" className="algs-filter-action" onClick={onSetSelectAll}>{t("algs.detail.selectAll")}</button>
            <button type="button" className="algs-filter-action" onClick={onSetDeselectAll}>{t("algs.detail.deselectAll")}</button>
          </HStack>
          <div className="algs-filter-grid">
            {setKeys.map((name) => (
              <button
                key={name}
                type="button"
                className="algs-filter-choice"
                aria-pressed={selectedSets.includes(name)}
                onClick={() => onSetToggle(name)}
              >
                <span className="algs-filter-check" aria-hidden="true" />
                <span className="algs-filter-label">{name}</span>
              </button>
            ))}
          </div>
      </Box>

      <Box as="section" className="algs-filter-section">
          <HStack className="algs-filter-heading" gap={1} mb={2} flexWrap="wrap" align="center">
            <Text fontSize="xs" color="fg.muted">{t("algs.detail.group")}</Text>
            <button type="button" className="algs-filter-action" onClick={onGroupSelectAll}>{t("algs.detail.selectAll")}</button>
            <button type="button" className="algs-filter-action" onClick={onGroupDeselectAll}>{t("algs.detail.deselectAll")}</button>
          </HStack>
          <VStack align="stretch" gap={3}>
            {setKeys
              .filter((sn) => selectedSets.includes(sn))
              .map((setName) => {
                const set = sets.find((s) => s.name === setName);
                const gKeys = set?.groups_keys ?? set?.groups?.map((g) => g.name) ?? [];
                if (gKeys.length === 0) return null;
                return (
                  <Box key={setName}>
                    <Text fontSize="xs" color="fg.muted" mb={1}>{setName}</Text>
                    <div className="algs-filter-grid">
                      {gKeys.map((gName) => {
                        const key = buildGroupKey(setName, gName);
                        return (
                          <button
                            key={key}
                            type="button"
                            className="algs-filter-choice"
                            aria-pressed={selectedGroups.includes(key)}
                            onClick={() => onGroupToggle(key)}
                          >
                            <span className="algs-filter-check" aria-hidden="true" />
                            <span className="algs-filter-label">{gName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Box>
                );
              })}
          </VStack>
      </Box>

      <Box as="section" className="algs-filter-section">
          <HStack className="algs-filter-heading" gap={1} mb={2} flexWrap="wrap" align="center">
            <Text fontSize="xs" color="fg.muted">
              {t("algs.detail.formulaFilter")}
              {scopeKeys.length > 0 && (
                <Text as="span" ml={1} color="fg.muted">
                  ({visibleCount}/{scopeKeys.length})
                </Text>
              )}
            </Text>
            <button type="button" className="algs-filter-action" onClick={onFormulaSelectAll} disabled={scopeKeys.length === 0}>
              {t("algs.detail.selectAll")}
            </button>
            <button type="button" className="algs-filter-action" onClick={onFormulaDeselectAll} disabled={scopeKeys.length === 0}>
              {t("algs.detail.deselectAll")}
            </button>
          </HStack>
          <Box maxH="420px" overflowY="auto">
            <VStack align="stretch" gap={3}>
              {setKeys
                .filter((sn) => selectedSets.includes(sn))
                .map((setName) => {
                  const set = sets.find((s) => s.name === setName);
                  const gKeys = set?.groups_keys ?? set?.groups?.map((g) => g.name) ?? [];
                  const groups = set?.groups ?? [];
                  const visibleGs = gKeys.filter((gName) =>
                    selectedGroups.includes(buildGroupKey(setName, gName)),
                  );
                  if (visibleGs.length === 0) return null;
                  return (
                    <Box key={setName}>
                      <Text fontSize="xs" fontWeight="bold" color="fg.muted" mb={2}>{setName}</Text>
                      {visibleGs.map((gName) => {
                        const gi = gKeys.indexOf(gName);
                        const algs = groups[gi]?.algs ?? [];
                        if (algs.length === 0) return null;
                        return (
                          <Box key={buildGroupKey(setName, gName)} mb={2}>
                            <Text fontSize="2xs" color="fg.muted" mb={1}>{gName}</Text>
                            <div className="algs-filter-grid">
                              {algs.map((alg) => {
                                const fKey = `${setName}:${gName}:${alg.name}`;
                                const visible = !hiddenSet.has(fKey);
                                return (
                                  <button
                                    key={fKey}
                                    type="button"
                                    className="algs-filter-choice"
                                    aria-pressed={visible}
                                    title={alg.name}
                                    onClick={() => onFormulaToggle(fKey)}
                                  >
                                    <span className="algs-filter-check" aria-hidden="true" />
                                    <span className="algs-filter-label">{alg.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
            </VStack>
          </Box>
      </Box>
    </VStack>
  );
}
