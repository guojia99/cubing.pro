"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Collapsible,
  Dialog,
  Drawer,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Separator,
  SimpleGrid,
  Skeleton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import {
  getAlgCubeClass,
  type AlgClassDetail,
  type AlgItem,
} from "@/services/cubing-pro/algs/algs";
import {
  buildGroupKey,
} from "@/services/cubing-pro/algs/formulaPracticeSelection";
import {
  getFormulaProficiency,
} from "@/services/cubing-pro/algs/formulaPracticeProficiency";

import AlgsFormulaCard from "./components/AlgsFormulaCard";
import AlgsFormulaCardWide from "./components/AlgsFormulaCardWide";
import AlgsFilterPanel from "./components/AlgsFilterPanel";
import AlgsFloatButtons from "./components/AlgsFloatButtons";
import AlgsPageSettingsPanel from "./components/AlgsPageSettingsPanel";
import AlgsModal from "./components/AlgsModal";
import AlgsPracticeToolsPanel from "./components/AlgsPracticeToolsPanel";
import FormulaRandomPickModal from "./components/FormulaRandomPickModal";
import FormulaPracticeModal from "./components/FormulaPracticeModal";
import BatchCustomFormulaModal from "./components/BatchCustomFormulaModal";
import UsageInstructionsModal from "./components/UsageInstructionsModal";
import type { FormulaItem } from "./types";

import {
  getColumnsPerRow,
  setColumnsPerRow as persistColumnsPerRow,
  getHideAltFormulas,
  setHideAltFormulas as persistHideAltFormulas,
  getHiddenFormulaKeys,
  setHiddenFormulaKeys as persistHiddenFormulaKeys,
  getUseVisualCubeRenderer,
  setUseVisualCubeRenderer as persistUseVisualCubeRenderer,
  getFormulaFontSize,
  setFormulaFontSize as persistFormulaFontSize,
} from "./utils/storage";
import {
  getFormulaFontFamily,
  setFormulaFontFamily as persistFormulaFontFamily,
  type FormulaFontFamilyId,
} from "./utils/formulaFontFamily";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import { isVisualCubeCube } from "./utils/visualCubeCube";
import { SET_CARD_COLORS } from "./utils/constants";

interface ModalState {
  items: FormulaItem[];
  index: number;
}

interface Props {
  cube: string;
  classId: string;
}

export function AlgsDetailView({ cube, classId }: Props) {
  const { t } = useI18n();

  const [data, setData] = useState<AlgClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hiddenFormulaKeys, setHiddenKeys] = useState<string[]>([]);
  const [filterCollapsibleOpen, setFilterCollapsibleOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [formulaFontSize, setFontSizeState] = useState(() => getFormulaFontSize());
  const [formulaFontFamily, setFontFamilyState] = useState<FormulaFontFamilyId>(() => getFormulaFontFamily());
  const [useVisualCube, setVisualCubeState] = useState(() => getUseVisualCubeRenderer());
  const [columnsPerRow, setColumnsState] = useState(() => getColumnsPerRow(cube, classId));
  const [hideAltFormulas, setHideAltState] = useState(() => getHideAltFormulas(cube, classId));

  const [statModalOpen, setStatModalOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [formulaRandomModalOpen, setFormulaRandomModalOpen] = useState(false);
  const [formulaRandomModalMode, setFormulaRandomModalMode] = useState<
    "random" | "history"
  >("random");
  const [formulaRandomRefreshKey, setFormulaRandomRefreshKey] = useState(0);
  const [unskilledRefreshKey, setUnskilledRefreshKey] = useState(0);
  const [usageInstructionsOpen, setUsageInstructionsOpen] = useState(false);
  const [formulaPracticeOpen, setFormulaPracticeOpen] = useState(false);
  const [batchCustomOpen, setBatchCustomOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useReleaseOverlayOnUnmount();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAlgCubeClass(cube, classId)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        const sKeys = d.setKeys ?? d.sets.map((s) => s.name);
        setSelectedSets(sKeys);
        const gKeys: string[] = [];
        d.sets.forEach((set) => {
          const names = set.groups_keys ?? set.groups.map((g) => g.name);
          names.forEach((gName) => {
            gKeys.push(buildGroupKey(set.name, gName));
          });
        });
        setSelectedGroups(gKeys);
        setHiddenKeys(getHiddenFormulaKeys(cube, classId));
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cube, classId]);

  const setKeys = useMemo(
    () => data?.setKeys ?? data?.sets.map((s) => s.name) ?? [],
    [data],
  );

  const hiddenSet = useMemo(() => new Set(hiddenFormulaKeys), [hiddenFormulaKeys]);

  const visibleGroups = useMemo(() => {
    if (!data) return [];
    const result: {
      setName: string;
      groupName: string;
      setColorIndex: number;
      algs: AlgItem[];
    }[] = [];

    data.sets.forEach((set, si) => {
      if (!selectedSets.includes(set.name)) return;
      const gNames = set.groups_keys ?? set.groups.map((g) => g.name);
      const groups = set.groups;
      gNames.forEach((gName, gi) => {
        const gKey = buildGroupKey(set.name, gName);
        if (!selectedGroups.includes(gKey)) return;
        const algs = (groups[gi]?.algs ?? []).filter((alg) => {
          const fKey = `${set.name}:${gName}:${alg.name}`;
          return !hiddenSet.has(fKey);
        });
        if (algs.length > 0) {
          result.push({
            setName: set.name,
            groupName: gName,
            setColorIndex: si,
            algs,
          });
        }
      });
    });

    return result;
  }, [data, selectedSets, selectedGroups, hiddenSet]);

  const allModalItems = useMemo(() => {
    const items: FormulaItem[] = [];
    visibleGroups.forEach((g) => {
      g.algs.forEach((alg) => {
        items.push({ alg, setName: g.setName, groupName: g.groupName });
      });
    });
    return items;
  }, [visibleGroups]);

  const totalFormulas = useMemo(
    () => visibleGroups.reduce((s, g) => s + g.algs.length, 0),
    [visibleGroups],
  );

  const proficiencyStats = useMemo(() => {
    const map = getFormulaProficiency(cube, classId);
    const entries = Object.values(map);
    return {
      total: entries.length,
      mastered: entries.filter((l) => l === "mastered").length,
      skilled: entries.filter((l) => l === "skilled").length,
      average: entries.filter((l) => l === "average").length,
      unskilled: entries.filter((l) => l === "unskilled").length,
      unknown: entries.filter((l) => l === "unknown").length,
    };
  }, [cube, classId]);

  const setFormulaCounts = useMemo(() => {
    if (!data) return [];
    return data.sets.map((set) => ({
      name: set.name,
      count: set.groups.reduce((s, g) => s + g.algs.length, 0),
    }));
  }, [data]);

  const handleSetToggle = useCallback((name: string) => {
    setSelectedSets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }, []);

  const handleGroupToggle = useCallback((key: string) => {
    setSelectedGroups((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key],
    );
  }, []);

  const handleFormulaToggle = useCallback(
    (key: string) => {
      setHiddenKeys((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        persistHiddenFormulaKeys(cube, classId, next);
        return next;
      });
    },
    [cube, classId],
  );

  const handleSetSelectAll = useCallback(() => {
    if (!data) return;
    setSelectedSets(data.setKeys ?? data.sets.map((s) => s.name));
  }, [data]);

  const handleSetDeselectAll = useCallback(() => setSelectedSets([]), []);

  const handleGroupSelectAll = useCallback(() => {
    if (!data) return;
    const all: string[] = [];
    data.sets.forEach((set) => {
      const names = set.groups_keys ?? set.groups.map((g) => g.name);
      names.forEach((gName) => all.push(buildGroupKey(set.name, gName)));
    });
    setSelectedGroups(all);
  }, [data]);

  const handleGroupDeselectAll = useCallback(() => setSelectedGroups([]), []);

  const handleFormulaSelectAll = useCallback(() => {
    setHiddenKeys([]);
    persistHiddenFormulaKeys(cube, classId, []);
  }, [cube, classId]);

  const handleFormulaDeselectAll = useCallback(() => {
    if (!data) return;
    const keys: string[] = [];
    data.sets.forEach((set) => {
      if (!selectedSets.includes(set.name)) return;
      const gNames = set.groups_keys ?? set.groups.map((g) => g.name);
      const groups = set.groups;
      gNames.forEach((gName, gi) => {
        const gKey = buildGroupKey(set.name, gName);
        if (!selectedGroups.includes(gKey)) return;
        (groups[gi]?.algs ?? []).forEach((alg) => {
          keys.push(`${set.name}:${gName}:${alg.name}`);
        });
      });
    });
    setHiddenKeys(keys);
    persistHiddenFormulaKeys(cube, classId, keys);
  }, [data, selectedSets, selectedGroups, cube, classId]);

  const handleFontSizeChange = useCallback((n: number) => {
    persistFormulaFontSize(n);
    setFontSizeState(n);
  }, []);

  const handleFontFamilyChange = useCallback((id: FormulaFontFamilyId) => {
    persistFormulaFontFamily(id);
    setFontFamilyState(id);
  }, []);

  const handleColumnsChange = useCallback(
    (n: number) => {
      persistColumnsPerRow(cube, classId, n);
      setColumnsState(n);
    },
    [cube, classId],
  );

  const handleVisualCubeChange = useCallback((b: boolean) => {
    persistUseVisualCubeRenderer(b);
    setVisualCubeState(b);
  }, []);

  const handleHideAltFormulasChange = useCallback(
    (b: boolean) => {
      persistHideAltFormulas(cube, classId, b);
      setHideAltState(b);
    },
    [cube, classId],
  );

  const handleScrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleOpenModalByIndex = useCallback(
    (index: number) => {
      setModalState({ items: allModalItems, index });
    },
    [allModalItems],
  );

  const handleOpenModal = useCallback(
    (setName: string, groupName: string, alg: AlgItem) => {
      const idx = allModalItems.findIndex(
        (m) =>
          m.setName === setName &&
          m.groupName === groupName &&
          m.alg.name === alg.name,
      );
      handleOpenModalByIndex(idx >= 0 ? idx : 0);
    },
    [allModalItems, handleOpenModalByIndex],
  );

  const handleModalNavigate = useCallback((index: number) => {
    setModalState((prev) => (prev ? { ...prev, index } : null));
  }, []);

  const handleModalClose = useCallback(() => setModalState(null), []);

  const showVisualCubeSwitch = isVisualCubeCube(cube);
  const showHideAltFormulas = columnsPerRow === 1;

  if (loading) {
    return (
      <VStack gap={4} py={8} align="stretch">
        <HStack gap={3}>
          <Skeleton height="32px" width="100px" />
          <Skeleton height="32px" width="200px" />
        </HStack>
        <Skeleton height="20px" width="160px" />
        <Separator />
        <Card.Root variant="outline" borderRadius="xl">
          <Card.Body p={4}>
            <Skeleton height="24px" width="120px" mb={3} />
            <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} gap={3}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="100px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
        <Separator />
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <GridItem key={i}>
              <Skeleton height="220px" borderRadius="xl" />
            </GridItem>
          ))}
        </Grid>
        <Flex justify="center" py={6}>
          <Spinner size="lg" colorPalette="brand" />
        </Flex>
      </VStack>
    );
  }

  if (!data) {
    return (
      <VStack gap={4} py={12}>
        <Text color="fg.muted" fontSize="lg">
          {t("algs.loadError")}
        </Text>
        <Button variant="outline" colorPalette="brand" asChild>
          <Link href="/algs">← {t("algs.backToList")}</Link>
        </Button>
      </VStack>
    );
  }

  return (
    <>
      <VStack ref={containerRef} align="stretch" gap={6}>
        <Flex
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={3}
        >
          <HStack gap={3} flex={1} minW={0}>
            <Button
              variant="ghost"
              size="sm"
              colorPalette="brand"
              flexShrink={0}
              asChild
            >
              <Link href="/algs">
                ← {t("algs.backToList")}
              </Link>
            </Button>
            <Separator orientation="vertical" h="24px" />
            <Heading size="lg" truncate>
              {data.name}
            </Heading>
            <Badge colorPalette="brand" fontSize="sm">
              {cube}
            </Badge>
          </HStack>

          <HStack gap={2} flexShrink={0}>
            <Text fontSize="sm" color="fg.muted">
              {totalFormulas} {t("algs.detail.statFormulas")}
            </Text>
            <Separator orientation="vertical" h="16px" />
            <Button
              size="xs"
              variant="outline"
              colorPalette="brand"
              onClick={() => setStatModalOpen(true)}
            >
              📊 {t("algs.practice.stats")}
            </Button>
          </HStack>
        </Flex>

        <Separator />

        <Collapsible.Root
          open={filterCollapsibleOpen}
          onOpenChange={(e) => setFilterCollapsibleOpen(e.open)}
        >
          <Collapsible.Trigger asChild>
            <Button size="sm" variant="ghost" colorPalette="brand">
              {filterCollapsibleOpen ? "▼" : "▶"}{" "}
              {t("algs.detail.filterPanel")}
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box mt={3}>
              <AlgsFilterPanel
                data={data}
                selectedSets={selectedSets}
                selectedGroups={selectedGroups}
                hiddenFormulaKeys={hiddenFormulaKeys}
                onSetToggle={handleSetToggle}
                onGroupToggle={handleGroupToggle}
                onFormulaToggle={handleFormulaToggle}
                onSetSelectAll={handleSetSelectAll}
                onSetDeselectAll={handleSetDeselectAll}
                onGroupSelectAll={handleGroupSelectAll}
                onGroupDeselectAll={handleGroupDeselectAll}
                onFormulaSelectAll={handleFormulaSelectAll}
                onFormulaDeselectAll={handleFormulaDeselectAll}
              />
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>

        {allModalItems.length > 0 && (
          <AlgsPracticeToolsPanel
            cube={cube}
            classId={classId}
            flatAlgs={allModalItems}
            showRandomPick={allModalItems.length >= 8}
            formulaRandomRefreshKey={formulaRandomRefreshKey}
            unskilledRefreshKey={unskilledRefreshKey}
            onOpenRandom={() => {
              setFormulaRandomModalMode("random");
              setFormulaRandomModalOpen(true);
            }}
            onOpenHistory={() => {
              setFormulaRandomModalMode("history");
              setFormulaRandomModalOpen(true);
            }}
            onPickFormula={handleOpenModalByIndex}
            onOpenFormulaPractice={() => setFormulaPracticeOpen(true)}
            onOpenBatchCustom={() => setBatchCustomOpen(true)}
          />
        )}

        <Separator />

        {visibleGroups.length === 0 && (
          <Box textAlign="center" py={12}>
            <Text color="fg.muted" fontSize="lg">
              {t("algs.noData")}
            </Text>
            <Button
              mt={3}
              size="sm"
              variant="outline"
              colorPalette="brand"
              onClick={() => {
                setSelectedSets(setKeys);
                const allG: string[] = [];
                data.sets.forEach((set) => {
                  const names = set.groups_keys ?? set.groups.map((g) => g.name);
                  names.forEach((gName) =>
                    allG.push(buildGroupKey(set.name, gName)),
                  );
                });
                setSelectedGroups(allG);
                setHiddenKeys([]);
                persistHiddenFormulaKeys(cube, classId, []);
              }}
            >
              {t("algs.noData")}
            </Button>
          </Box>
        )}

        {visibleGroups.map((group) => {
          const colors =
            SET_CARD_COLORS[group.setColorIndex % SET_CARD_COLORS.length];
          return (
            <Card.Root
              key={`${group.setName}::${group.groupName}`}
              variant="outline"
              borderRadius="xl"
              bg={colors.bg}
              borderColor={colors.border}
            >
              <Card.Body p={4}>
                <HStack gap={2} mb={3}>
                  <Badge
                    colorPalette="brand"
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {group.setName}
                  </Badge>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="fg.muted"
                  >
                    {group.groupName}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" ml="auto">
                    {group.algs.length}
                  </Text>
                </HStack>

                <Grid
                  templateColumns={`repeat(${columnsPerRow}, minmax(0, 1fr))`}
                  gap={3}
                >
                  {group.algs.map((alg) => {
                    const cardKey = `${group.setName}:${group.groupName}:${alg.name}`;
                    if (columnsPerRow === 1) {
                      return (
                        <GridItem key={cardKey}>
                          <AlgsFormulaCardWide
                            cube={cube}
                            classId={classId}
                            setName={group.setName}
                            groupName={group.groupName}
                            alg={alg}
                            setColorIndex={group.setColorIndex}
                            formulaFontSize={formulaFontSize}
                            formulaFontFamily={formulaFontFamily}
                            useVisualCube={useVisualCube}
                            hideAltFormulas={hideAltFormulas}
                            onOpenModal={() =>
                              handleOpenModal(
                                group.setName,
                                group.groupName,
                                alg,
                              )
                            }
                          />
                        </GridItem>
                      );
                    }
                    return (
                      <GridItem key={cardKey}>
                        <AlgsFormulaCard
                          cube={cube}
                          classId={classId}
                          setName={group.setName}
                          groupName={group.groupName}
                          alg={alg}
                          setColorIndex={group.setColorIndex}
                          formulaFontSize={formulaFontSize}
                          formulaFontFamily={formulaFontFamily}
                          useVisualCube={useVisualCube}
                          onClick={() =>
                            handleOpenModal(
                              group.setName,
                              group.groupName,
                              alg,
                            )
                          }
                        />
                      </GridItem>
                    );
                  })}
                </Grid>
              </Card.Body>
            </Card.Root>
          );
        })}
      </VStack>

      <AlgsFloatButtons
        onScrollTop={handleScrollTop}
        onOpenFilter={() => setFilterDrawerOpen(true)}
        onOpenPageSettings={() => setPageSettingsOpen(true)}
        onOpenUsageInstructions={() => setUsageInstructionsOpen(true)}
        onOpenFormulaPractice={
          allModalItems.length > 0
            ? () => setFormulaPracticeOpen(true)
            : undefined
        }
      />

      <FormulaRandomPickModal
        open={formulaRandomModalOpen}
        onClose={() => setFormulaRandomModalOpen(false)}
        mode={formulaRandomModalMode}
        cube={cube}
        classId={classId}
        flatAlgs={allModalItems}
        onPickFormula={handleOpenModalByIndex}
        onPickSuccess={() => setFormulaRandomRefreshKey((k) => k + 1)}
      />

      <UsageInstructionsModal
        open={usageInstructionsOpen}
        onClose={() => setUsageInstructionsOpen(false)}
      />

      <FormulaPracticeModal
        open={formulaPracticeOpen}
        onClose={() => {
          setFormulaPracticeOpen(false);
          setUnskilledRefreshKey((k) => k + 1);
        }}
        cube={cube}
        classId={classId}
        flatAlgs={allModalItems}
      />

      <BatchCustomFormulaModal
        open={batchCustomOpen}
        onClose={() => setBatchCustomOpen(false)}
        cube={cube}
        classId={classId}
        flatAlgs={allModalItems}
        useVisualCube={useVisualCube}
        formulaFontFamily={formulaFontFamily}
      />

      <Drawer.Root
        open={filterDrawerOpen}
        onOpenChange={(e) => {
          if (!e.open) setFilterDrawerOpen(false);
        }}
        placement="end"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>
                {t("algs.detail.filterPanel")}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <AlgsFilterPanel
                data={data}
                selectedSets={selectedSets}
                selectedGroups={selectedGroups}
                hiddenFormulaKeys={hiddenFormulaKeys}
                onSetToggle={handleSetToggle}
                onGroupToggle={handleGroupToggle}
                onFormulaToggle={handleFormulaToggle}
                onSetSelectAll={handleSetSelectAll}
                onSetDeselectAll={handleSetDeselectAll}
                onGroupSelectAll={handleGroupSelectAll}
                onGroupDeselectAll={handleGroupDeselectAll}
                onFormulaSelectAll={handleFormulaSelectAll}
                onFormulaDeselectAll={handleFormulaDeselectAll}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      <Drawer.Root
        open={pageSettingsOpen}
        onOpenChange={(e) => {
          if (!e.open) setPageSettingsOpen(false);
        }}
        placement="end"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>
                {t("algs.config")}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <AlgsPageSettingsPanel
                formulaFontSize={formulaFontSize}
                onFormulaFontSizeChange={handleFontSizeChange}
                formulaFontFamily={formulaFontFamily}
                onFormulaFontFamilyChange={handleFontFamilyChange}
                columnsPerRow={columnsPerRow}
                onColumnsPerRowChange={handleColumnsChange}
                showVisualCubeSwitch={showVisualCubeSwitch}
                useVisualCube={useVisualCube}
                onUseVisualCubeChange={handleVisualCubeChange}
                showHideAltFormulas={showHideAltFormulas}
                hideAltFormulas={hideAltFormulas}
                onHideAltFormulasChange={handleHideAltFormulasChange}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      <Dialog.Root
        open={statModalOpen}
        onOpenChange={(e) => {
          if (!e.open) setStatModalOpen(false);
        }}
        size="md"
        placement="center"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" maxH="90vh">
            <Dialog.Header>
              <Dialog.Title>
                {t("algs.practice.stats")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">
              <VStack gap={4} align="stretch">
                <Box textAlign="center" py={4}>
                  <Text
                    fontSize="5xl"
                    fontWeight="bold"
                    lineHeight={1}
                    bgGradient="linear(to-r, teal.400, cyan.500)"
                    bgClip="text"
                  >
                    {totalFormulas}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={2}>
                    {t("algs.noData")}
                  </Text>
                </Box>

                <Separator />

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    {t("algs.proficiency")}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    {setFormulaCounts.map(({ name, count }) => (
                      <Badge
                        key={name}
                        colorPalette="brand"
                        variant="subtle"
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {name}: {count}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                <Separator />

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={3}>
                    {t("algs.practice.stats")}
                  </Text>
                  <SimpleGrid columns={3} gap={2}>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="green.50"
                      _dark={{ bg: "green.900/20" }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="green.600"
                        _dark={{ color: "green.400" }}
                      >
                        {proficiencyStats.mastered}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        Mastered
                      </Text>
                    </Box>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="blue.50"
                      _dark={{ bg: "blue.900/20" }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="blue.600"
                        _dark={{ color: "blue.400" }}
                      >
                        {proficiencyStats.skilled}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        Skilled
                      </Text>
                    </Box>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="orange.50"
                      _dark={{ bg: "orange.900/20" }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="orange.600"
                        _dark={{ color: "orange.400" }}
                      >
                        {proficiencyStats.average}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        Average
                      </Text>
                    </Box>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="red.50"
                      _dark={{ bg: "red.900/20" }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="red.500"
                        _dark={{ color: "red.400" }}
                      >
                        {proficiencyStats.unskilled}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        Unskilled
                      </Text>
                    </Box>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="gray.50"
                      _dark={{ bg: "gray.800/40" }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        {proficiencyStats.unknown}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        Unknown
                      </Text>
                    </Box>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="teal.50"
                      _dark={{ bg: "teal.900/20" }}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="teal.600"
                        _dark={{ color: "teal.400" }}
                      >
                        {proficiencyStats.total}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        Tracked
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                <Separator />

                {data.sets.map((set) => {
                  const gNames =
                    set.groups_keys ?? set.groups.map((g) => g.name);
                  return (
                    <Collapsible.Root key={set.name}>
                      <Collapsible.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          w="full"
                          justifyContent="space-between"
                          borderRadius="lg"
                          _hover={{ bg: "bg.muted" }}
                        >
                          <HStack gap={2}>
                            <Text fontWeight="semibold">{set.name}</Text>
                            <Badge variant="subtle" fontSize="2xs">
                              {set.groups.reduce(
                                (s, g) => s + g.algs.length,
                                0,
                              )}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="fg.muted">
                            {gNames.length} groups ▾
                          </Text>
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <VStack align="stretch" gap={1} pl={4} pb={2}>
                          {set.groups.map((group) => (
                            <Flex
                              key={group.name}
                              justify="space-between"
                              align="center"
                              py={1.5}
                              px={3}
                              borderRadius="md"
                              _hover={{ bg: "bg.muted" }}
                              transition="background 0.15s"
                            >
                              <Text fontSize="sm" color="fg.muted">
                                {group.name}
                              </Text>
                              <Badge
                                variant="outline"
                                fontSize="xs"
                                borderRadius="full"
                                px={2}
                              >
                                {group.algs.length}
                              </Badge>
                            </Flex>
                          ))}
                        </VStack>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  );
                })}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <AlgsModal
        open={modalState !== null}
        onClose={handleModalClose}
        cube={cube}
        classId={classId}
        items={modalState?.items ?? []}
        currentIndex={modalState?.index ?? 0}
        onNavigate={handleModalNavigate}
        useVisualCube={useVisualCube}
        formulaFontFamily={formulaFontFamily}
      />

      <style>{`
        @keyframes algsFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
}
