"use client";

import {
  Box,
  Flex,
  IconButton,
  Input,
  Separator,
  Slider,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BiSolidFileJpg, BiSolidFilePng } from "react-icons/bi";

import { useI18n } from "@/contexts/I18nProvider";
import { translateFinishing } from "@/i18n/messages/finishing";
import { downloadSvg, downloadSvgImage } from "@/lib/svgDownload";
import { toaster } from "@/components/ui/toaster";
import { SectionHeader, Surface } from "@/components/ui/page";
import { DRAW_FONT_COLOR, DRAW_NEUTRAL_STICKER } from "@/theme/domainColors";
import { ColorPalette } from "@/views/DrawTools/components/ColorPalette";
import {
  buildRenderKey,
  findSvgClickTarget,
  getInvertedColor,
} from "@/views/DrawTools/drawColorUtils";
import type { PathSvg } from "@/views/DrawTools/types";

interface DrawPaletteProps {
  presetColors?: string[];
  storageKey?: string;
  svgPoints: PathSvg[];
  viewBox: string;
  strokeWidthNum: number;
  buttons?: ReactNode;
  width?: number;
  height?: number;
}

const SHAPE_POINTER_STYLE = {
  cursor: "pointer",
  pointerEvents: "all" as const,
};

const EMPTY_SVG_POINTS: PathSvg[] = [];

function getFormattedDate(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function buildTransform(elem: PathSvg): string {
  if (elem.transformStr) return elem.transformStr;
  const parts: string[] = [];
  if (elem.translate?.length) parts.push(`translate(${elem.translate.join(" ")})`);
  if (elem.rotatePoint) {
    const angle = (elem.baseRotate ?? 0) + (elem.rotate ?? 0);
    parts.push(`rotate(${angle} ${elem.rotatePoint})`);
  }
  return parts.join(" ");
}

function defaultColorForKey(key: string, defaultFill?: string): string {
  if (defaultFill) return defaultFill;
  return key.includes("fonts") ? DRAW_FONT_COLOR : DRAW_NEUTRAL_STICKER;
}

const FILE_DOWNLOAD_ICON_SIZE = "1.1rem";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="currentColor" aria-hidden>
      <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4h14v2H5v-2z" />
    </svg>
  );
}

export function DrawPalette({
  presetColors = [],
  storageKey = "color-history",
  svgPoints = EMPTY_SVG_POINTS,
  viewBox,
  strokeWidthNum = 1,
  buttons,
  width = 400,
  height = 400,
}: DrawPaletteProps) {
  const { t, locale } = useI18n();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<string>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloadName, setDownloadName] = useState("");
  const [strokeWidth, setStrokeWidth] = useState(1);

  const handleColorChange = useCallback((key: string, color: string) => {
    setColors((prevColors) => ({
      ...prevColors,
      [key]: color,
    }));
  }, []);

  const keys = useMemo(
    () => svgPoints.map((elem) => buildRenderKey(storageKey, elem.key, elem.disableDrawing)),
    [svgPoints, storageKey],
  );

  const keyDefaults = useMemo(() => {
    const defaults: Record<string, string> = {};
    for (const elem of svgPoints) {
      if (!elem.defaultFill) continue;
      defaults[buildRenderKey(storageKey, elem.key, elem.disableDrawing)] = elem.defaultFill;
    }
    return defaults;
  }, [svgPoints, storageKey]);

  useEffect(() => {
    setColors((prevColors) => {
      let next = prevColors;
      for (const key of keys) {
        if (prevColors[key] === undefined) {
          if (next === prevColors) next = { ...prevColors };
          next[key] = defaultColorForKey(key, keyDefaults[key]);
        }
      }
      return next;
    });
  }, [keys, keyDefaults]);

  const paintShape = useCallback(
    (key: string, unbindKey: string | null | undefined) => {
      if (!selectedColor || key.includes("disable") || !key.includes(storageKey)) {
        return;
      }
      handleColorChange(key, selectedColor);
      if (unbindKey) {
        handleColorChange(unbindKey, getInvertedColor(selectedColor));
      }
    },
    [handleColorChange, selectedColor, storageKey],
  );

  const handleSvgClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const { key, unbindKey } = findSvgClickTarget(event.target, svgRef.current);
      if (!key) return;
      event.stopPropagation();
      paintShape(key, unbindKey);
    },
    [paintShape],
  );

  const handleDownload = async (format: "svg" | "png" | "jpeg") => {
    const svg = svgRef.current;
    if (!svg) return;
    const filename = `${downloadName || `${storageKey}_${getFormattedDate()}`}.${format === "jpeg" ? "jpg" : format}`;
    try {
      if (format === "svg") downloadSvg(svg, filename, { width, height });
      else await downloadSvgImage(svg, filename, { format, width, height });
    } catch {
      toaster.create({ title: t("teamMatch.exportFailed"), type: "error" });
    }
  };

  return (
    <Flex direction={{ base: "column", xl: "row" }} gap={{ base: 4, md: 6 }} align="start" minW="0">
      <Surface flex="1" w="full" minW="0" p={{ base: 4, md: 6 }}>
          <Flex gap="2" align="center" flexWrap="wrap" mb="5" pb="5" borderBottomWidth="1px" borderColor="border">
            <Input
              value={downloadName}
              onChange={(e) => setDownloadName(e.target.value)}
              placeholder={t("draws.palette.input")}
              aria-label={t("draws.palette.input")}
              flex="1 1 160px"
              minW="0"
              maxW={{ base: "full", md: "320px" }}
              size="sm"
              minH="44px"
              borderRadius="12px"
              fontSize="sm"
            />
            <IconButton
              aria-label={t("algs.modal.downloadSvg")}
              variant="outline"
              size="sm"
              minW="44px"
              minH="44px"
              borderRadius="12px"
              colorPalette="brand"
              onClick={() => void handleDownload("svg")}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              aria-label={translateFinishing(locale, "finishing.downloadJpg")}
              variant="outline"
              size="sm"
              minW="44px"
              minH="44px"
              borderRadius="12px"
              colorPalette="brand"
              onClick={() => void handleDownload("jpeg")}
            >
              <BiSolidFileJpg size={FILE_DOWNLOAD_ICON_SIZE} />
            </IconButton>
            <IconButton
              aria-label={t("algs.modal.downloadPng")}
              variant="outline"
              size="sm"
              minW="44px"
              minH="44px"
              borderRadius="12px"
              colorPalette="brand"
              onClick={() => void handleDownload("png")}
            >
              <BiSolidFilePng size={FILE_DOWNLOAD_ICON_SIZE} />
            </IconButton>
          </Flex>

          <Box
            p={{ base: 2, md: 6 }}
            minW="0"
            minH={{ base: "280px", md: "440px" }}
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderRadius="var(--radius-card)"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={width}
              height={height}
              viewBox={viewBox}
              ref={svgRef}
              className="draw-palette-canvas"
              style={{ maxWidth: "100%", height: "auto", flexShrink: 1 }}
              onClick={handleSvgClick}
            >
              {svgPoints.map((elem) => {
                const key = buildRenderKey(storageKey, elem.key, elem.disableDrawing);
                const transform = buildTransform(elem);
                const fillColor = colors[key] ?? defaultColorForKey(key, elem.defaultFill);

                let curStrokeWidth = strokeWidth * strokeWidthNum;
                if (elem.disableStrokeWidth) {
                  curStrokeWidth = 0;
                }

                if (elem.text) {
                  const angle = (elem.baseRotate ?? 0) + (elem.rotate ?? 0);
                  const baseTransform = buildTransform(elem);
                  const textX =
                    (elem.textPoint?.[0] ?? 0) + (elem.textRouteResetPoint?.[0] ?? 0);
                  const textY =
                    (elem.textPoint?.[1] ?? 0) + (elem.textRouteResetPoint?.[1] ?? 0);
                  const textTransform = `${baseTransform} rotate(${-angle} ${textX} ${textY})`;
                  const textSize = elem.textSize ?? 5;

                  return (
                    <text
                      fill={fillColor}
                      key={key}
                      data-key={key}
                      textAnchor="start"
                      fontSize={textSize}
                      x={elem.textPoint?.[0]}
                      y={elem.textPoint?.[1]}
                      transform={textTransform}
                      opacity={elem.disShow ? 0 : 1}
                      style={{
                        ...SHAPE_POINTER_STYLE,
                        fontFamily: '"Noto Sans JP", sans-serif',
                        fontSize: textSize,
                      }}
                    >
                      {elem.text}
                    </text>
                  );
                }

                if (elem.d) {
                  return (
                    <path
                      fill={fillColor}
                      key={key}
                      data-key={key}
                      uncolor-data-key={elem.unColorBindKey}
                      d={elem.d}
                      stroke="black"
                      strokeWidth={curStrokeWidth}
                      strokeLinejoin="round"
                      style={SHAPE_POINTER_STYLE}
                      transform={transform}
                    />
                  );
                }

                if (elem.points) {
                  return (
                    <polygon
                      fill={fillColor}
                      key={key}
                      data-key={key}
                      points={elem.points}
                      stroke="black"
                      strokeWidth={curStrokeWidth}
                      strokeLinejoin="round"
                      style={SHAPE_POINTER_STYLE}
                      transform={transform}
                    />
                  );
                }

                if (elem.line) {
                  return (
                    <line
                      x1={elem.line.x1}
                      x2={elem.line.x2}
                      y1={elem.line.y1}
                      y2={elem.line.y2}
                      key={key}
                      data-key={key}
                      stroke="black"
                      strokeWidth={curStrokeWidth}
                      strokeLinejoin="round"
                      style={SHAPE_POINTER_STYLE}
                      transform={transform}
                    />
                  );
                }

                return null;
              })}
            </svg>
          </Box>

          {buttons ? <Box mt="6" pt="6" borderTopWidth="1px" borderColor="border" minW="0">{buttons}</Box> : null}
      </Surface>

      <Surface w={{ base: "full", xl: "320px" }} flexShrink={0} p={{ base: 5, md: 6 }} position={{ xl: "sticky" }} top="calc(var(--header-height) + 24px)">
          <SectionHeader title={t("draws.palette.color_setting")} />
          <Flex justify="space-between" align="center" mb="4" gap="3">
            <Text fontSize="sm" color="fg.muted">{t("draws.palette.thickness")}</Text>
            <Text fontSize="sm" fontWeight="semibold" color="accent" fontVariantNumeric="tabular-nums">{strokeWidth}</Text>
          </Flex>
          <Slider.Root
            colorPalette="brand"
            min={1}
            max={10}
            step={1}
            defaultValue={[1]}
            onValueChange={(details) => setStrokeWidth(details.value[0] ?? 1)}
            mb="6"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb index={0} aria-label={t("draws.palette.thickness")} />
            </Slider.Control>
          </Slider.Root>

          <Separator borderColor="border" mb="4" />

          <ColorPalette
            selectedColor={selectedColor}
            onSelectedColorChange={setSelectedColor}
            onSelectColor={handleColorChange}
            presetColors={presetColors}
            storageKey={storageKey}
            allKeys={keys}
            keyDefaults={keyDefaults}
          />
      </Surface>
    </Flex>
  );
}
