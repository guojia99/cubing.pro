"use client";

import { useMemo } from "react";
import { Box } from "@chakra-ui/react";

interface SvgRendererProps {
  svg: string;
  maxWidth?: number;
  maxHeight?: number;
  style?: React.CSSProperties;
}

export default function SvgRenderer({
  svg,
  maxWidth = 150,
  maxHeight = 150,
  style,
}: SvgRendererProps) {
  const processed = useMemo(() => {
    if (!svg?.trim()) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) return null;
      const w = svgEl.getAttribute("width");
      const h = svgEl.getAttribute("height");
      const width = w ? parseFloat(w) : 100;
      const height = h ? parseFloat(h) : 100;
      const ratio = width / height;
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");
      if (!svgEl.getAttribute("viewBox")) {
        svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }
      svgEl.setAttribute("style", "width:100%;height:100%;display:block;");
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      return { html: new XMLSerializer().serializeToString(svgEl), ratio };
    } catch {
      return null;
    }
  }, [svg]);

  if (!processed) return null;

  return (
    <Box
      w="100%"
      maxW={`${maxWidth}px`}
      maxH={`${maxHeight}px`}
      aspectRatio={String(processed.ratio)}
      mx="auto"
      dangerouslySetInnerHTML={{ __html: processed.html }}
      style={style}
    />
  );
}
