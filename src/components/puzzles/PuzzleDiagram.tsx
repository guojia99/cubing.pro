"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import type { PuzzleID } from "cubing/twisty";
import { useI18n } from "@/contexts/I18nProvider";
import { puzzleFaceColors, usePuzzlePreferences } from "./preferences";
import { displayPracticeScramble } from "./practiceSetup";
import { usesTwoByTwo3D } from "@/views/Algs/utils/twoByTwoCategories";

const TwistyPuzzlePlayer = dynamic(() => import("./TwistyPuzzlePlayer"), { ssr: false });
const Square1Player = dynamic(() => import("./Square1Player"), { ssr: false });
const NativeTwoByTwo = dynamic(() => import("./NativeTwoByTwo"), { ssr: false });

export interface PuzzleDiagramProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  formula?: string;
  scramble?: string;
  maxWidth?: number;
  maxHeight?: number;
  interactive?: boolean;
  stateSource?: "formula" | "scramble";
  fallback?: React.ReactNode;
}

type Prepared = Awaited<ReturnType<typeof import("./model").preparePuzzle>> & {
  puzzle: PuzzleID;
  svg: string;
  stickering?: string;
  svgError?: string;
};
const diagrams = new Map<string, Prepared | null>();
// Pending work is never evicted by the bounded completed-result cache.
const diagramsInFlight = new Map<string, Promise<Prepared | null>>();

function isolateSVGIDs(svg: Element): void {
  const prefix = `puzzle-diagram-${crypto.randomUUID()}-`;
  const elements = [svg, ...svg.querySelectorAll("*")];
  const ids = new Map<string, string>();
  const elementIDs = new Map<Element, string>();
  for (const [index, element] of elements.entries()) {
    const id = element.getAttribute("id");
    if (id) {
      const unique = ids.has(id) ? `${prefix}${id}-duplicate-${index}` : `${prefix}${id}`;
      if (!ids.has(id)) ids.set(id, unique);
      elementIDs.set(element, unique);
    }
  }
  const urls = (value: string) => value.replace(/url\(\s*(["']?)#([^\s"')]+)\1\s*\)/g,
    (match, quote, id: string) => ids.has(id) ? `url(${quote}#${ids.get(id)}${quote})` : match);
  for (const element of elements) {
    for (const attribute of [...element.attributes]) {
      let value = urls(attribute.value);
      if (attribute.name === "id") value = elementIDs.get(element) ?? value;
      if (attribute.name === "data-copy-id") value = ids.get(value) ?? value;
      if (attribute.localName === "href" && value.startsWith("#")) value = `#${ids.get(value.slice(1)) ?? value.slice(1)}`;
      if (value !== attribute.value) attribute.value = value;
    }
    if (element.localName === "style") {
      element.textContent = urls(element.textContent ?? "").replace(/([^{}]+)\{/g, (match, selector: string) =>
        `${selector.replace(/#([\w-]+)/g, (reference, id: string) => ids.has(id) ? `#${ids.get(id)}` : reference)}{`);
    }
  }
}

export default function PuzzleDiagram({
  cube, classId, setName, groupName, formula = "", scramble = "",
  maxWidth = 180, maxHeight = 180, interactive = false, stateSource = "formula", fallback,
}: PuzzleDiagramProps) {
  const { locale } = useI18n();
  const zh = locale === "zh-CN";
  const preferences = usePuzzlePreferences();
  const [override, setOverride] = useState<"2D" | "3D" | null>(null);
  const [result, setResult] = useState<{ key: string; prepared?: Prepared; error?: string; unsupported?: boolean } | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const key = JSON.stringify([cube, classId, setName, groupName, formula, scramble, stateSource, preferences.bottom, preferences.front]);
  const prepared = result?.key === key ? result.prepared : undefined;
  const error = result?.key === key ? result.error : undefined;
  const twoLayer = prepared?.puzzle === "2x2x2";
  const pbl = twoLayer && usesTwoByTwo3D(classId, setName, groupName);
  const automatic = twoLayer && !pbl ? "2D" : "3D";
  const mode = override ?? (interactive ? preferences.view === "auto" ? automatic : preferences.view : "2D");

  useEffect(() => {
    if (!wrapper.current || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "160px" });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    async function prepare(): Promise<Prepared | null> {
      const { resolvePuzzle, preparePuzzle, puzzleLoader, isCubePuzzle, resolveStickering, isTwoLayerPBL } = await import("./model");
      const puzzle = resolvePuzzle(cube, classId);
      if (!puzzle) {
        return null;
      }
      const loader = puzzleLoader(puzzle);
      const identity = puzzle === "square1" && /CS Solved/i.test(groupName) && !formula.trim() && !scramble.trim();
      const state = await preparePuzzle(puzzle, formula, scramble, stateSource, identity);
      const requested = resolveStickering(classId, setName, groupName);
      const stickerings = await loader.stickerings?.();
      const stickering = requested && stickerings?.includes(requested) ? requested : undefined;
      const pbl = isTwoLayerPBL(puzzle, classId, setName, groupName);
      if (pbl) return { ...state, puzzle, svg: "", stickering: undefined };
      const colors = puzzleFaceColors(preferences, puzzle);
      try {
        const svg = isCubePuzzle(puzzle)
          ? await (await import("./cuberootCubeDiagrams")).renderCubeDiagram(puzzle, state, classId, setName, groupName, colors)
          : await (await import("./cuberootSpecialDiagrams")).renderSpecialDiagram(puzzle, state, classId, colors, setName);
        return { ...state, puzzle, svg, stickering };
      } catch (error) {
        // A drawing limitation must not disable a separately validated 3D state.
        return { ...state, puzzle, svg: "", stickering, svgError: error instanceof Error ? error.message : String(error) };
      }
    }
    const completed = diagrams.get(key);
    if (diagrams.has(key)) {
      diagrams.delete(key);
      diagrams.set(key, completed!);
    }
    let pending = diagrams.has(key) ? Promise.resolve(completed!) : diagramsInFlight.get(key);
    if (!pending) {
      pending = prepare().then((value) => {
        diagrams.set(key, value);
        if (diagrams.size > 256) diagrams.delete(diagrams.keys().next().value!);
        return value;
      }).finally(() => { diagramsInFlight.delete(key); });
      diagramsInFlight.set(key, pending);
    }
    void pending.then((value) => {
      if (!cancelled) setResult(value ? { key, prepared: value } : { key, unsupported: true, error: zh ? "暂不支持此魔方" : "Unsupported puzzle" });
    }).catch((reason: unknown) => {
      if (!cancelled) setResult({ key, error: reason instanceof Error ? reason.message : String(reason) });
    });
    return () => { cancelled = true; };
  // Primitive preferences keep unrelated view changes from rebuilding the state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, zh, visible]);

  useEffect(() => {
    const element = host.current;
    if (!element || !prepared?.svg || mode !== "2D") return;
    const svg = new DOMParser().parseFromString(prepared.svg, "image/svg+xml").documentElement;
    isolateSVGIDs(svg);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", zh ? "公式状态图" : "Algorithm case diagram");
    element.replaceChildren(document.importNode(svg, true));
    return () => { element.replaceChildren(); };
  }, [prepared, mode, zh]);

  const height = interactive && mode === "3D" ? Math.max(260, maxHeight) : maxHeight;
  const colors = puzzleFaceColors(preferences, prepared?.puzzle);
  return <Box ref={wrapper} className="puzzle-diagram" data-puzzle={prepared?.puzzle} data-state-source={stateSource}
    w="full" minW={0} maxW={interactive && mode === "3D" ? "full" : `${maxWidth}px`} mx="auto">
    {interactive && <Flex gap={1} mb={1} justify="center" role="group" aria-label={zh ? "图示视图" : "Diagram view"}>
      {(["2D", "3D"] as const).map((view) => <Button key={view} type="button" size="xs" variant={mode === view ? "solid" : "ghost"}
        colorPalette="brand" aria-pressed={mode === view} onClick={(event) => { event.stopPropagation(); setOverride(view); }}>{view}</Button>)}
    </Flex>}
    {error ? <Box minH={`${Math.min(height, 80)}px`} display="flex" alignItems="center" justifyContent="center">
      {fallback && (result?.unsupported || (!formula.trim() && !scramble.trim())) ? fallback : <Text role="alert" fontSize="xs" color="fg.muted" overflowWrap="anywhere">{zh ? "无法生成图示：" : "Cannot render: "}{error}</Text>}
    </Box> : !prepared ? <Box h={`${height}px`} role="status" aria-label={zh ? "正在生成图示" : "Generating diagram"} /> : pbl || (twoLayer && mode === "3D" && interactive) ?
      <NativeTwoByTwo key={key} setup={prepared.setup} alg={prepared.alg} colors={colors} height={height} interactive={interactive && mode === "3D"} /> : mode === "3D" && interactive ?
      prepared.puzzle === "square1" ? <Square1Player key={key} setup={prepared.setup} alg={prepared.alg} colors={colors} height={height} /> :
        <TwistyPuzzlePlayer key={key} puzzle={prepared.puzzle} setup={prepared.setup} alg={prepared.alg} colors={colors} stickering={prepared.stickering} height={height} /> :
      prepared.svgError ? <Text role="alert" fontSize="xs" color="fg.muted" overflowWrap="anywhere">{zh ? "无法生成平面图：" : "Cannot render 2D: "}{prepared.svgError}</Text> :
        <div ref={host} style={{ width: "100%", height: maxHeight, display: "flex", alignItems: "center", justifyContent: "center" }} />}
    {interactive && prepared?.warning && <Text role="status" mt={2} fontSize="xs" color="fg.muted" overflowWrap="anywhere">
      {zh ? "图示由标准 setup 生成；当前原公式暂不能播放：" : "Diagram generated from standard setup; original formula playback is unavailable: "}{prepared.warning}
    </Text>}
    {interactive && prepared?.annotation && <Text fontSize="xs" color="fg.muted" mt={2}>
      {zh ? `原始起手提示 ${prepared.annotation}；图示与动画采用正文标准握法。` : `Source starting view ${prepared.annotation}; diagram and playback use the formula body's standard grip.`}
    </Text>}
    {interactive && prepared && <Box as="details" mt={2} fontSize="xs" color="fg.muted" minW={0}>
      <summary style={{ cursor: "pointer" }}>{zh ? "图示打乱" : "Diagram setup"}</summary>
      <Text as="code" display="block" mt={1} whiteSpace="pre-wrap" overflowWrap="anywhere">
        {displayPracticeScramble(prepared.setup) || (zh ? "已复原" : "Solved")}
      </Text>
    </Box>}
  </Box>;
}
