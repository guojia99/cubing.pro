"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { PuzzleID, TwistyPlayer } from "cubing/twisty";
import type { Material, Mesh } from "three";

import { useI18n } from "@/contexts/I18nProvider";
import { CUBE_COLOR_HEX } from "./preferences";

type Props = {
  puzzle: PuzzleID;
  setup: string;
  alg: string;
  colors: Record<string, string>;
  stickering?: string;
  height: number;
};

const FACES = ["U", "F", "R", "B", "L", "D"] as const;
// Cube3D's palette differs from PuzzleGeometry's palette.
const CUBE3D_COLORS = ["#ffffff", "#00ff00", "#ff0000", "#2266ff", "#ff9900", "#ffff00"];
// AxisInfo.dimColor, in FACES order; these are not uniform half-bright colors.
const CUBE3D_DIM_COLORS = ["#dddddd", "#008800", "#660000", "#113388", "#885500", "#888800"];
const PREFERENCE_COLORS = ["white", "green", "red", "blue", "orange", "yellow"] as const;

export default function TwistyPuzzlePlayer({ puzzle, setup, alg, colors, stickering, height }: Props) {
  const { locale } = useI18n();
  const zh = locale !== "en-US";
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<TwistyPlayer | null>(null);
  const speed = useRef(1);
  const [tempo, setTempo] = useState(1);
  const [status, setStatus] = useState<{ key: string; error?: string } | null>(null);
  const recolor = /^[2-7]x[2-7]x[2-7]$/.test(puzzle) || puzzle === "skewb";
  const palette = JSON.stringify(FACES.map((face) => recolor ? colors[face] || "" : ""));
  const key = JSON.stringify([puzzle, setup, alg, stickering, palette]);
  const ready = status?.key === key && status.error === undefined;
  const error = status?.key === key ? status.error : undefined;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    setStatus(null);
    let stopped = false;
    let instance: TwistyPlayer | null = null;
    let viewer: ReturnType<typeof import("./twistyViewerLifecycle").createManagedTwistyViewer> | undefined;
    const clones = new Map<Material, Material>();
    const originals = new Map<Material, Material>();
    const meshes = new Set<Mesh>();
    const removeListeners: (() => void)[] = [];
    const dispose = () => {
      if (player.current === instance) player.current = null;
      removeListeners.splice(0).forEach((remove) => remove());
      viewer?.dispose();
      // Restore only our assignments; cubing still owns all geometry and sources.
      for (const mesh of meshes) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((material) => originals.get(material) ?? material)
          : originals.get(mesh.material) ?? mesh.material;
      }
      clones.forEach((material) => material.dispose());
      clones.clear();
      originals.clear();
      meshes.clear();
    };
    const fail = (reason: unknown) => {
      if (stopped) return;
      stopped = true;
      clearTimeout(timeout);
      dispose();
      setStatus({ key, error: reason instanceof Error ? reason.message : String(reason) });
    };

    const timeout = setTimeout(() => fail(new Error("3D player loading timed out.")), 30000);
    void (async () => {
      const [{ TwistyPlayer: Player }, { Alg }, { puzzles }, { createManagedTwistyViewer }] = await Promise.all([
        import("cubing/twisty"), import("cubing/alg"), import("cubing/puzzles"),
        import("./twistyViewerLifecycle"),
      ]);
      if (stopped) return;
      // Fail here instead of leaving an invalid algorithm behind an unresolved getter.
      const kpuzzle = await puzzles[puzzle].kpuzzle();
      if (stopped) return;
      kpuzzle.defaultPattern().applyAlg(new Alg(setup)).applyAlg(new Alg(alg));
      viewer = createManagedTwistyViewer(Player, {
        puzzle, alg, experimentalSetupAlg: setup,
        experimentalStickering: stickering || "full",
        visualization: "3D", background: "none", hintFacelets: "none",
        viewerLink: "none", controlPanel: "bottom-row", tempoScale: speed.current,
        ...(puzzle === "skewb" ? { experimentalFaceletScale: 0.8 } : {}),
      });
      instance = viewer.player;
      const current = instance;
      current.style.cssText = "display:block;width:100%;height:100%;visibility:hidden";
      container.appendChild(current);

      const requested = JSON.parse(palette) as string[];
      let patchMaterials = () => {};
      viewer.setBeforeRender(() => { if (!stopped) patchMaterials(); });
      const object = await current.experimentalCurrentThreeJSPuzzleObject();
      if (stopped) return;
      if (recolor && requested.some(Boolean)) {
        const { Color } = await import("three");
        if (stopped) return;
        let sourceColors = CUBE3D_COLORS;
        if (puzzle !== "3x3x3") {
          const pg = await puzzles[puzzle].pg?.();
          if (stopped) return;
          if (!pg) throw new Error("Puzzle face colors are unavailable.");
          const data = pg.get3d();
          sourceColors = FACES.map((face) => {
            const index = data.faces.findIndex((entry) => entry.name === face);
            const sticker = data.stickers.find((entry) => entry.face === index);
            if (!sticker) throw new Error(`Missing puzzle face: ${face}`);
            return sticker.color;
          });
        }
        const vector = (rgb: number[]) => `vec3(${rgb.map((value) => value.toFixed(8)).join(",")})`;
        // PG3D stores quantized sRGB bytes, with a special dim white value.
        const pgDim = (color: InstanceType<typeof Color>) => new Color(
          color.getHex() === 0xffffff ? 0xdddddd : color.clone().multiplyScalar(0.5).getHex(),
        );
        const tests = FACES.flatMap((face, index) => {
          const target = requested[index];
          if (!target) return [];
          if (!CSS.supports("color", target) || /var\(|currentcolor/i.test(target)) {
            throw new Error(`Invalid ${face} face color: ${target}`);
          }
          const source = new Color(sourceColors[index]);
          const destination = new Color(target);
          const targetIndex = PREFERENCE_COLORS.findIndex((color) => new Color(CUBE_COLOR_HEX[color]).equals(destination));
          const sourceDim = puzzle === "3x3x3" ? new Color(CUBE3D_DIM_COLORS[index]) : pgDim(source);
          const destinationDim = puzzle === "3x3x3" && targetIndex !== -1
            ? new Color(CUBE3D_DIM_COLORS[targetIndex]) : pgDim(destination);
          // Both backends supply sRGB values here: Cube3D explicitly converts
          // AxisInfo colors; PG3D uses normalized byte attributes. Match only
          // regular/dim palette entries, leaving ignored/oriented semantics alone.
          return [[source, destination], [sourceDim, destinationDim]].map(([from, to]) => {
            const input = vector(from.clone().convertLinearToSRGB().toArray());
            // The viewer outputs LinearSRGBColorSpace without an sRGB encode,
            // so replacements must use the same sRGB values as the input.
            const output = vector(to.clone().convertLinearToSRGB().toArray());
            return `if (all(lessThan(abs(puzzleSourceRGB - ${input}), vec3(0.002)))) { diffuseColor.rgb = ${output}; }`;
          });
        });
        const injection = `\nvec3 puzzleSourceRGB = diffuseColor.rgb;\n${tests.join(" else ")}\n`;
        patchMaterials = () => {
          object.traverse((node) => {
            const mesh = node as Mesh;
            if (!mesh.isMesh) return;
            const clone = (source: Material): Material => {
              if (originals.has(source)) return source;
              const existing = clones.get(source);
              if (existing) return existing;
              const material = source.clone();
              clones.set(source, material);
              originals.set(material, source);
              material.onBeforeCompile = (shader, renderer) => {
                source.onBeforeCompile.call(material, shader, renderer);
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <color_fragment>", `#include <color_fragment>${injection}`,
                );
              };
              material.customProgramCacheKey = () => `${source.customProgramCacheKey()}:puzzle-palette:${injection}`;
              material.needsUpdate = true;
              return material;
            };
            meshes.add(mesh);
            mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
          });
        };
        patchMaterials();
      }
      for (const canvas of [viewer.canvas]) {
        if (stopped) return;
        const lost = (event: Event) => {
          event.preventDefault();
          fail(new Error("WebGL context lost. Reopen the player to retry."));
        };
        canvas.addEventListener("webglcontextlost", lost);
        removeListeners.push(() => canvas.removeEventListener("webglcontextlost", lost));
      }
      if (stopped) return;
      patchMaterials();
      await viewer.render();
      if (stopped) return;
      clearTimeout(timeout);
      current.style.visibility = "visible";
      player.current = current;
      setStatus({ key });
    })().catch(fail);

    return () => {
      stopped = true;
      clearTimeout(timeout);
      dispose();
    };
  }, [puzzle, setup, alg, stickering, palette, recolor, key]);

  const viewportHeight = Number.isFinite(height) ? Math.max(120, height) : 300;
  return (
    <Box minW="0" borderWidth="1px" borderColor="border.subtle" rounded="lg" overflow="hidden" bg="bg.subtle">
      <Box position="relative" height={`${viewportHeight}px`} aria-busy={!ready && !error}>
        <Box ref={host} position="absolute" inset="0" visibility={ready ? "visible" : "hidden"} />
        {!ready ? (
          <Flex position="absolute" inset="0" align="center" justify="center" p="4" overflowY="auto">
            <Text role={error ? "alert" : "status"} fontSize="sm" color={error ? "fg.error" : "fg.muted"} overflowWrap="anywhere">
              {error ? `${zh ? "无法播放：" : "Cannot play: "}${error}` : zh ? "正在加载 3D..." : "Loading 3D..."}
            </Text>
          </Flex>
        ) : null}
      </Box>
      <Flex align="center" justify="space-between" wrap="wrap" gap="2" p={{ base: "2", md: "3" }} borderTopWidth="1px" borderColor="border.subtle">
        <Flex as="label" align="center" gap="2" fontSize="sm">
          {zh ? "速度" : "Tempo"}
          <select
            aria-label={zh ? "播放速度" : "Playback tempo"}
            value={tempo}
            disabled={!ready}
            style={{ color: "inherit", background: "var(--chakra-colors-bg)", border: "1px solid var(--chakra-colors-border)", borderRadius: 6, padding: "6px 8px", minHeight: 36 }}
            onChange={(event) => {
              const value = Number(event.target.value);
              speed.current = value;
              setTempo(value);
              if (player.current) player.current.tempoScale = value;
            }}
          >
            {[0.25, 0.5, 0.75, 1, 1.5, 2].map((value) => <option key={value} value={value}>{value}x</option>)}
          </select>
        </Flex>
        <Button size="sm" variant="outline" disabled={!ready} onClick={() => {
          player.current?.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set("auto");
        }}>
          {zh ? "重置视角" : "Reset view"}
        </Button>
      </Flex>
    </Box>
  );
}
