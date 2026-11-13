"use client";

import { Box } from "@chakra-ui/react";

import SvgRenderer from "./SvgRenderer";
import PuzzleDiagram from "@/components/puzzles/PuzzleDiagram";

export interface AlgsCubeDiagramProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  imageSvg?: string;
  scramble?: string;
  formula?: string;
  /** Legacy preference; supported puzzles now always render locally. */
  useVisualCube?: boolean;
  interactive?: boolean;
  stateSource?: "formula" | "scramble";
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AlgsCubeDiagram({
  cube,
  classId,
  setName,
  groupName,
  imageSvg = "",
  scramble,
  formula = "",
  interactive = false,
  stateSource = "formula",
  maxWidth,
  maxHeight,
  className,
  style,
}: AlgsCubeDiagramProps) {
  const w = maxWidth ?? 180;
  const h = maxHeight ?? 180;

  return (
    <Box className={className} style={style} width="full" minW={0}>
      <PuzzleDiagram cube={cube} classId={classId} setName={setName} groupName={groupName}
        formula={formula} scramble={scramble} maxWidth={w} maxHeight={h} interactive={interactive} stateSource={stateSource}
        fallback={imageSvg ? <SvgRenderer svg={imageSvg} maxWidth={w} maxHeight={h} /> : undefined} />
    </Box>
  );
}
