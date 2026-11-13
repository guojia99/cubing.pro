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
  Input,
  Separator,
  SimpleGrid,
  Skeleton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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
import AlgsResizablePanels from "./components/AlgsResizablePanels";
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
  getDiagramSize,
  setDiagramSize as persistDiagramSize,
  getHideFormulaDiagram,
  setHideFormulaDiagram as persistHideFormulaDiagram,
  getAlgsSelection,
  buildAlgsKey,
} from "./utils/storage";
import {
  getFormulaFontFamily,
  setFormulaFontFamily as persistFormulaFontFamily,
  type FormulaFontFamilyId,
} from "./utils/formulaFontFamily";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";
import { isVisualCubeCube } from "./utils/visualCubeCube";
import { getAlgDisplayName } from "./utils/algDisplayName";
import { getCustomAlgs } from "@/services/cubing-pro/algs/customAlgs";
import { collectVisibleFormulaKeys } from "./utils/algsFormulaFilter";
import "./styles/algsDetail.css";

interface ModalState {
  items: FormulaItem[];
  index: number;
}

interface Props {
  cube: string;
  classId: string;
}

export function AlgsDetailView({ cube, classId }: Props) {
  const { t, locale } = useI18n();

  const [data, setData] = useState<AlgClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hiddenFormulaKeys, setHiddenKeys] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [formulaFontSize, setFontSizeState] = useState(() => getFormulaFontSize());
  const [formulaFontFamily, setFontFamilyState] = useState<FormulaFontFamilyId>(() => getFormulaFontFamily());
  const [useVisualCube, setVisualCubeState] = useState(() => getUseVisualCubeRenderer());
  const [columnsPerRow, setColumnsState] = useState(() => getColumnsPerRow(cube, classId));
  const [hideAltFormulas, setHideAltState] = useState(() => getHideAltFormulas(cube, classId));
  const [diagramSize, setDiagramSizeState] = useState(() => getDiagramSize());
  const [hideFormulaDiagram, setHideFormulaDiagramState] = useState(() =>
    getHideFormulaDiagram(),
  );

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setContentWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading, data]);

  const cardMinWidth = Math.max(196, hideFormulaDiagram ? 0 : diagramSize + 22);
  const gridColumns = Math.min(columnsPerRow, Math.max(1, Math.floor((contentWidth - 26 + 8) / (cardMinWidth + 8))));
  const cardLayout = {
    "--algs-grid-columns": gridColumns,
    "--algs-diagram-height": `${hideFormulaDiagram ? 0 : diagramSize}px`,
    "--algs-formula-height": `${formulaFontSize * 1.4 * 3 + 12}px`,
    "--algs-wide-formula-height": `${formulaFontSize * 1.45 * 2}px`,
    "--algs-wide-formula-rows": hideAltFormulas ? 1 : 4,
  } as CSSProperties;

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

  const handleChanged = useCallback(() => {
    setRefreshVersion((version) => version + 1);
    setUnskilledRefreshKey((version) => version + 1);
  }, []);

  useReleaseOverlayOnUnmount();

  useEffect(() => {
    setColumnsState(getColumnsPerRow(cube, classId));
    setHideAltState(getHideAltFormulas(cube, classId));
  }, [cube, classId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSearch("");
    setModalState(null);
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

  // Search only changes the library display, never the selected practice scope.
  const displayedGroups = useMemo(() => {
    void refreshVersion; // Local custom formulas can change without a data refetch.
    const query = deferredSearch.trim().toLocaleLowerCase();
    if (!query) return visibleGroups;
    return visibleGroups.flatMap((group) => {
      const algs = group.algs.filter((alg) => {
        const custom = getCustomAlgs(buildAlgsKey(cube, classId, group.setName, group.groupName, alg.name));
        return [group.setName, group.groupName, alg.name, getAlgDisplayName(alg, locale), ...alg.algs, ...custom]
          .some((value) => value.toLocaleLowerCase().includes(query));
      });
      return algs.length ? [{ ...group, algs }] : [];
    });
  }, [visibleGroups, deferredSearch, cube, classId, locale, refreshVersion]);
  const displayedCount = displayedGroups.reduce((count, group) => count + group.algs.length, 0);

  const settingsPreview = useMemo(() => {
    void refreshVersion;
    const first = allModalItems[0];
    if (!first) {
      return {
        formula: "",
        name: "",
        imageSvg: "",
        scramble: "",
        setName: "",
        groupName: "",
      };
    }
    const sel = getAlgsSelection(
      buildAlgsKey(cube, classId, first.setName, first.groupName, first.alg.name),
    );
    const formulas = sel?.source === "custom"
      ? getCustomAlgs(buildAlgsKey(cube, classId, first.setName, first.groupName, first.alg.name))
      : first.alg.algs;
    const idx = sel?.index ?? 0;
    const formula = formulas[idx] ?? formulas[0] ?? "";
    const scramble =
      first.alg.scrambles?.[sel?.source === "custom" ? 0 : idx] ?? first.alg.scrambles?.[0] ?? "";
    return {
      formula,
      name: getAlgDisplayName(first.alg, locale),
      imageSvg: first.alg.image ?? "",
      scramble,
      setName: first.setName,
      groupName: first.groupName,
    };
  }, [allModalItems, cube, classId, locale, refreshVersion]);

  const totalFormulas = useMemo(
    () => visibleGroups.reduce((s, g) => s + g.algs.length, 0),
    [visibleGroups],
  );

  const proficiencyStats = useMemo(() => {
    void refreshVersion;
    void statModalOpen; // Also reload changes made in the existing proficiency tool.
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
  }, [cube, classId, refreshVersion, statModalOpen]);

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
    if (!data) return;
    const scope = new Set(collectVisibleFormulaKeys(data, selectedSets, selectedGroups));
    setHiddenKeys((previous) => {
      const next = previous.filter((key) => !scope.has(key));
      persistHiddenFormulaKeys(cube, classId, next);
      return next;
    });
  }, [data, selectedSets, selectedGroups, cube, classId]);

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
    setHiddenKeys((previous) => {
      const next = [...new Set([...previous, ...keys])];
      persistHiddenFormulaKeys(cube, classId, next);
      return next;
    });
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

  const handleDiagramSizeChange = useCallback((n: number) => {
    persistDiagramSize(n);
    setDiagramSizeState(n);
  }, []);

  const handleHideFormulaDiagramChange = useCallback((b: boolean) => {
    persistHideFormulaDiagram(b);
    setHideFormulaDiagramState(b);
  }, []);

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

  const formulaGroups = useMemo(() => displayedGroups.map((group) => {
    return (
      <Card.Root
        key={`${group.setName}::${group.groupName}`}
        id={`algs-group-${encodeURIComponent(buildGroupKey(group.setName, group.groupName))}`}
        className="algs-detail-group"
        variant="outline"
        borderRadius="xl"
        bg="bg.elevated"
        borderColor="border"
        minW={0}
      >
        <Card.Body p={3} gap={0}>
          <HStack className="algs-detail-group-heading" gap={2} mb={2} align="center" minW={0}>
            <Badge
              colorPalette="brand"
              variant="subtle"
              borderRadius="md"
              px={2}
              py={0}
              h="22px"
              lineHeight="20px"
              fontSize="11px"
              flexShrink={0}
            >
              {group.setName}
            </Badge>
            <Heading as="h2"
              fontSize="xs"
              fontWeight="medium"
              color="fg.muted"
              lineHeight="22px"
              truncate
              title={group.groupName}
            >
              {group.groupName}
            </Heading>
            <Text fontSize="11px" lineHeight="22px" color="fg.muted" ml="auto" flexShrink={0}>
              {group.algs.length}
            </Text>
          </HStack>

          <Grid className={`algs-case-grid${columnsPerRow === 1 ? " algs-case-grid--wide" : ""}`}>
            {group.algs.map((alg) => {
              const cardKey = `${group.setName}:${group.groupName}:${alg.name}`;
              if (columnsPerRow === 1) {
                return (
                  <GridItem key={cardKey} minW={0}>
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
                      diagramSize={diagramSize}
                      hideFormulaDiagram={hideFormulaDiagram}
                      hideAltFormulas={hideAltFormulas}
                      refreshVersion={refreshVersion}
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
                <GridItem key={cardKey} minW={0}>
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
                    diagramSize={diagramSize}
                    hideFormulaDiagram={hideFormulaDiagram}
                    refreshVersion={refreshVersion}
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
  }), [displayedGroups, columnsPerRow, cube, classId, formulaFontSize, formulaFontFamily, useVisualCube, diagramSize, hideFormulaDiagram, hideAltFormulas, refreshVersion, handleOpenModal]);

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
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }} gap={4}>
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

  const toolsPanel = allModalItems.length > 0 && (
    <AlgsPracticeToolsPanel
      cube={cube}
      classId={classId}
      flatAlgs={allModalItems}
      showRandomPick={allModalItems.length >= 8}
      formulaRandomRefreshKey={formulaRandomRefreshKey}
      unskilledRefreshKey={unskilledRefreshKey}
      onOpenRandom={() => { setFormulaRandomModalMode("random"); setFormulaRandomModalOpen(true); }}
      onOpenHistory={() => { setFormulaRandomModalMode("history"); setFormulaRandomModalOpen(true); }}
      onPickFormula={handleOpenModalByIndex}
      onOpenFormulaPractice={() => setFormulaPracticeOpen(true)}
      onOpenBatchCustom={() => setBatchCustomOpen(true)}
    />
  );

  return (
    <>
      <Box className="algs-detail-shell">
      <Box className="algs-detail-workbench" style={cardLayout}>
        <Flex
          className="algs-detail-header"
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={3}
        >
          <HStack className="algs-detail-heading" gap={2} flex={1} minW={0} align="center">
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
            <Heading as="h1" fontSize={{ base: "md", md: "lg" }} lineHeight="short" overflowWrap="anywhere">
              {data.name}
            </Heading>
            <Badge colorPalette="brand" fontSize="11px" lineHeight="20px" h="22px" flexShrink={0}>
              {cube}
            </Badge>
          </HStack>

          <HStack gap={2} flexWrap="wrap" minW={0}>
            <Text fontSize="xs" color="fg.muted">
              {totalFormulas} {t("algs.detail.statFormulas")}
            </Text>
            <Separator orientation="vertical" h="16px" />
            <Button
              size="xs"
              variant="outline"
              colorPalette="brand"
              onClick={() => setStatModalOpen(true)}
            >
              {t("algs.practice.stats")}
            </Button>
            <Button size="sm" fontSize="xs" colorPalette="brand" disabled={!allModalItems.length} onClick={() => setFormulaPracticeOpen(true)}>
              {t("algs.formulaPractice.start")}
            </Button>
          </HStack>
        </Flex>

        <Box as="section" className="algs-detail-tools" aria-label={t("algs.detail.practiceTools")}>
          {toolsPanel}
        </Box>

        <AlgsResizablePanels navigation={<Box as="aside" id="algs-filter-pane" className="algs-detail-navigation">
          <Heading as="h2" fontSize="xs" mb={2}>{t("algs.detail.filterPanel")}</Heading>
          <Text fontSize="11px" color="fg.muted" mb={3}>
            {locale === "en-US" ? "Choose your practice scope" : "选择分组与公式，设置本次练习范围"}
          </Text>
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
          <nav aria-label={t("algs.detail.group")} className="algs-detail-group-links">
            {displayedGroups.map((group) => (
              <a key={buildGroupKey(group.setName, group.groupName)} href={`#algs-group-${encodeURIComponent(buildGroupKey(group.setName, group.groupName))}`}>
                <span>{group.setName} · {group.groupName}</span><span>{group.algs.length}</span>
              </a>
            ))}
          </nav>
        </Box>}>

        <VStack ref={contentRef} id="algs-formula-pane" className="algs-detail-content" align="stretch" gap={3} minW={0}>
          <Box className="algs-detail-toolbar">
            <Input type="search" size="sm" fontSize="xs" aria-label={locale === "en-US" ? "Search current formulas" : "搜索本页公式"}
              placeholder={locale === "en-US" ? "Search names, groups or formulas…" : "搜索名称、分组或公式…"}
              value={search} onChange={(event) => setSearch(event.target.value)} minW={0} bg="bg.elevated" />
            <Button size="sm" fontSize="xs" className="algs-detail-mobile-filter" variant="outline" onClick={() => setFilterDrawerOpen(true)}>{t("algs.detail.filterPanel")}</Button>
            <Button size="sm" fontSize="xs" variant="outline" onClick={() => setPageSettingsOpen(true)}>{t("algs.config")}</Button>
          </Box>
          <Flex gap={2} justify="space-between" flexWrap="wrap" fontSize="11px" color="fg.muted" aria-live="polite">
            <Text>{displayedCount} / {totalFormulas} {t("algs.detail.statFormulas")}</Text>
            <Text>{locale === "en-US" ? "Search changes this view; practice uses your selected scope." : "搜索仅影响展示，练习使用已选范围。"}</Text>
          </Flex>

        {displayedGroups.length === 0 && (
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
                if (search) { setSearch(""); return; }
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
              {locale === "en-US" ? (search ? "Clear search" : "Reset filters") : (search ? "清除搜索" : "重置筛选")}
            </Button>
          </Box>
        )}

        {formulaGroups}
        </VStack>
        </AlgsResizablePanels>
      </Box>
      </Box>

      {!pageSettingsOpen && !filterDrawerOpen && (
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
      )}

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
          setRefreshVersion((version) => version + 1);
        }}
        cube={cube}
        classId={classId}
        flatAlgs={allModalItems}
      />

      <BatchCustomFormulaModal
        open={batchCustomOpen}
        onClose={() => { setBatchCustomOpen(false); handleChanged(); }}
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
          <Drawer.Content className="algs-detail-drawer" maxW={{ base: "100vw", md: "480px" }}>
            <Drawer.Header>
              <Drawer.Title>
                {t("algs.detail.filterPanel")}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" color="signal.destructive" borderRadius="4px" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body overflowY="auto" minH={0}>
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
          <Drawer.Content className="algs-detail-drawer" maxW={{ base: "100vw", md: "480px" }}>
            <Drawer.Header>
              <Drawer.Title>
                {t("algs.config")}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" color="signal.destructive" borderRadius="4px" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body overflowY="auto" minH={0}>
              <AlgsPageSettingsPanel
                cube={cube}
                classId={classId}
                formulaFontSize={formulaFontSize}
                onFormulaFontSizeChange={handleFontSizeChange}
                formulaFontFamily={formulaFontFamily}
                onFormulaFontFamilyChange={handleFontFamilyChange}
                columnsPerRow={columnsPerRow}
                onColumnsPerRowChange={handleColumnsChange}
                diagramSize={diagramSize}
                onDiagramSizeChange={handleDiagramSizeChange}
                hideFormulaDiagram={hideFormulaDiagram}
                onHideFormulaDiagramChange={handleHideFormulaDiagramChange}
                showVisualCubeSwitch={showVisualCubeSwitch}
                useVisualCube={useVisualCube}
                onUseVisualCubeChange={handleVisualCubeChange}
                showHideAltFormulas={showHideAltFormulas}
                hideAltFormulas={hideAltFormulas}
                onHideAltFormulasChange={handleHideAltFormulasChange}
                previewFormula={settingsPreview.formula}
                previewName={settingsPreview.name}
                previewImageSvg={settingsPreview.imageSvg}
                previewScramble={settingsPreview.scramble}
                previewSetName={settingsPreview.setName}
                previewGroupName={settingsPreview.groupName}
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
                <CloseButton size="sm" color="signal.destructive" borderRadius="4px" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">
              <VStack gap={4} align="stretch">
                <Box textAlign="center" py={4}>
                  <Text
                    fontSize="5xl"
                    fontWeight="bold"
                    lineHeight={1}
                     color="accent"
                  >
                    {totalFormulas}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={2}>
                     {t("algs.detail.statFormulas")}
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
                  <SimpleGrid columns={{ base: 2, sm: 3 }} gap={2}>
                    <Box
                      textAlign="center"
                      p={3}
                      borderRadius="lg"
                      bg="bg.muted"
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="signal.success"
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
                      bg="bg.muted"
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="accent"
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
                      bg="bg.muted"
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="fg"
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
                      bg="bg.muted"
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="signal.destructive"
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
                      bg="bg.muted"
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="fg.muted"
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
                      bg="accent.soft"
                    >
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color="accent"
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
        diagramSize={diagramSize}
        hideFormulaDiagram={hideFormulaDiagram}
        onChanged={handleChanged}
      />
    </>
  );
}
