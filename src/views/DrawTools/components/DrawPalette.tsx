"use client";

import {
  Box,
  Card,
  Flex,
  IconButton,
  Input,
  Separator,
  Slider,
  Text,
} from "@chakra-ui/react";
import html2canvas from "html2canvas";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BiSolidFileJpg, BiSolidFilePng } from "react-icons/bi";

import { useI18n } from "@/contexts/I18nProvider";
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

function defaultColorForKey(key: string): string {
  return key.includes("fonts") ? "#000" : "#777";
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
  svgPoints = [],
  viewBox,
  strokeWidthNum = 1,
  buttons,
  width = 400,
  height = 400,
}: DrawPaletteProps) {
  const { t } = useI18n();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [keys, setKeys] = useState<string[]>([]);
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

  const svgPointsKey = JSON.stringify(svgPoints);

  useEffect(() => {
    const nextKeys: string[] = [];
    for (let i = 0; i < svgPoints.length; i++) {
      nextKeys.push(
        buildRenderKey(storageKey, svgPoints[i].key, svgPoints[i].disableDrawing),
      );
    }
    setKeys(nextKeys);

    setColors((prevColors) => {
      let changed = false;
      const next = { ...prevColors };
      for (const key of nextKeys) {
        if (next[key] === undefined) {
          next[key] = defaultColorForKey(key);
          changed = true;
        }
      }
      return changed ? next : prevColors;
    });
  }, [svgPointsKey, storageKey]);

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

  const handleSvgDownload = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgBlob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = svgUrl;
    a.download = downloadName
      ? `${downloadName}.svg`
      : `${storageKey}_${getFormattedDate()}.svg`;
    a.click();
    URL.revokeObjectURL(svgUrl);
  };

  const handleImageDownload = async (format: "png" | "jpeg") => {
    const svg = svgRef.current;
    if (!svg) return;

    const wrapper = document.createElement("div");
    const clonedSvg = svg.cloneNode(true) as SVGElement;
    wrapper.appendChild(clonedSvg);
    document.body.appendChild(wrapper);

    const { width: w, height: h } = clonedSvg.getBoundingClientRect();
    const canvas = await html2canvas(wrapper, {
      backgroundColor: null,
      width: w,
      height: h,
      scale: 2,
    });
    document.body.removeChild(wrapper);

    const link = document.createElement("a");
    link.href = canvas.toDataURL(`image/${format}`);
    link.download = downloadName
      ? `${downloadName}.${format === "jpeg" ? "jpg" : "png"}`
      : `${storageKey}_${getFormattedDate()}.${format === "jpeg" ? "jpg" : "png"}`;
    link.click();
  };

  return (
    <Flex direction={{ base: "column", lg: "row" }} gap="6" align="stretch">
      <Card.Root flex="1">
        <Card.Body>
          <Flex gap="1.5" align="center" flexWrap="wrap" mb="4">
            <Input
              value={downloadName}
              onChange={(e) => setDownloadName(e.target.value)}
              placeholder={t("draws.palette.input")}
              maxW="40"
              size="xs"
              fontSize="xs"
            />
            <IconButton
              aria-label="Download SVG"
              variant="outline"
              size="xs"
              colorPalette="gray"
              onClick={handleSvgDownload}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              aria-label="Download JPG"
              variant="outline"
              size="xs"
              colorPalette="gray"
              onClick={() => void handleImageDownload("jpeg")}
            >
              <BiSolidFileJpg size={FILE_DOWNLOAD_ICON_SIZE} />
            </IconButton>
            <IconButton
              aria-label="Download PNG"
              variant="outline"
              size="xs"
              colorPalette="gray"
              onClick={() => void handleImageDownload("png")}
            >
              <BiSolidFilePng size={FILE_DOWNLOAD_ICON_SIZE} />
            </IconButton>
          </Flex>

          <Box
            p="5"
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderRadius="lg"
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
              onClick={handleSvgClick}
            >
              {svgPoints.map((elem) => {
                const key = buildRenderKey(storageKey, elem.key, elem.disableDrawing);
                const transform = buildTransform(elem);
                const fillColor = colors[key] ?? defaultColorForKey(key);

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

          {buttons ? <Box mt="6" textAlign="center">{buttons}</Box> : null}
        </Card.Body>
      </Card.Root>

      <Card.Root w={{ base: "full", lg: "400px" }} flexShrink={0}>
        <Card.Body>
          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb="3">
            {t("draws.palette.thickness")}
          </Text>
          <Slider.Root
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
              <Slider.Thumb index={0} />
            </Slider.Control>
          </Slider.Root>

          <Separator borderColor="border" mb="4" />

          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb="3">
            {t("draws.palette.color_setting")}
          </Text>
          <ColorPalette
            selectedColor={selectedColor}
            onSelectedColorChange={setSelectedColor}
            onSelectColor={handleColorChange}
            presetColors={presetColors}
            storageKey={storageKey}
            allKeys={keys}
          />
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}
