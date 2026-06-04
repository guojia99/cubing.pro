"use client";

import { Box, Button, Card, Text, VStack, HStack, Badge } from "@chakra-ui/react";
import { useMemo } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import type { AlgClassDetail } from "@/services/cubing-pro/algs/algs";
import { buildGroupKey } from "@/services/cubing-pro/algs/formulaPracticeSelection";
import { collectVisibleFormulaKeys } from "../utils/algsFormulaFilter";

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
    <VStack align="stretch" gap={3}>
      <Card.Root size="sm" variant="outline">
        <Card.Body p={3}>
          <HStack gap={2} mb={2} flexWrap="wrap" align="center">
            <Text fontSize="xs" color="fg.muted">{t("algs.detail.set")}</Text>
            <Button size="2xs" variant="outline" onClick={onSetSelectAll}>{t("algs.detail.selectAll")}</Button>
            <Button size="2xs" variant="outline" onClick={onSetDeselectAll}>{t("algs.detail.deselectAll")}</Button>
          </HStack>
          <HStack gap={2} flexWrap="wrap">
            {setKeys.map((name) => (
              <Badge
                key={name}
                as="button"
                cursor="pointer"
                variant={selectedSets.includes(name) ? "solid" : "outline"}
                colorPalette="brand"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="sm"
                onClick={() => onSetToggle(name)}
              >
                {name}
              </Badge>
            ))}
          </HStack>
        </Card.Body>
      </Card.Root>

      <Card.Root size="sm" variant="outline">
        <Card.Body p={3}>
          <HStack gap={2} mb={2} flexWrap="wrap" align="center">
            <Text fontSize="xs" color="fg.muted">{t("algs.detail.group")}</Text>
            <Button size="2xs" variant="outline" onClick={onGroupSelectAll}>{t("algs.detail.selectAll")}</Button>
            <Button size="2xs" variant="outline" onClick={onGroupDeselectAll}>{t("algs.detail.deselectAll")}</Button>
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
                    <HStack gap={2} flexWrap="wrap">
                      {gKeys.map((gName) => {
                        const key = buildGroupKey(setName, gName);
                        return (
                          <Badge
                            key={key}
                            as="button"
                            cursor="pointer"
                            variant={selectedGroups.includes(key) ? "solid" : "outline"}
                            colorPalette="brand"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize="xs"
                            onClick={() => onGroupToggle(key)}
                          >
                            {gName}
                          </Badge>
                        );
                      })}
                    </HStack>
                  </Box>
                );
              })}
          </VStack>
        </Card.Body>
      </Card.Root>

      <Card.Root size="sm" variant="outline">
        <Card.Body p={3}>
          <HStack gap={2} mb={2} flexWrap="wrap" align="center">
            <Text fontSize="xs" color="fg.muted">
              {t("algs.detail.formulaFilter")}
              {scopeKeys.length > 0 && (
                <Text as="span" ml={1} color="fg.muted">
                  ({visibleCount}/{scopeKeys.length})
                </Text>
              )}
            </Text>
            <Button size="2xs" variant="outline" onClick={onFormulaSelectAll} disabled={scopeKeys.length === 0}>
              {t("algs.detail.selectAll")}
            </Button>
            <Button size="2xs" variant="outline" onClick={onFormulaDeselectAll} disabled={scopeKeys.length === 0}>
              {t("algs.detail.deselectAll")}
            </Button>
          </HStack>
          <Box maxH="420px" overflowY="auto" pr={1}>
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
                            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(70px, 1fr))" gap={1}>
                              {algs.map((alg) => {
                                const fKey = `${setName}:${gName}:${alg.name}`;
                                const visible = !hiddenSet.has(fKey);
                                return (
                                  <Badge
                                    key={fKey}
                                    as="button"
                                    cursor="pointer"
                                    variant={visible ? "solid" : "outline"}
                                    colorPalette="brand"
                                    borderRadius="md"
                                    px={2}
                                    py={0.5}
                                    fontSize="2xs"
                                    truncate
                                    title={alg.name}
                                    onClick={() => onFormulaToggle(fKey)}
                                  >
                                    {alg.name}
                                  </Badge>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
            </VStack>
          </Box>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
