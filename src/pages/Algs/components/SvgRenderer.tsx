import React, { useMemo } from 'react';

interface SvgRendererProps {
  svg: string;
  maxWidth?: number;
  maxHeight?: number;
  style?: React.CSSProperties;
}

const SvgRenderer: React.FC<SvgRendererProps> = ({
                                                   svg,
                                                   maxWidth = 150,
                                                   maxHeight = 150,
                                                   style = {},
                                                 }) => {
  const processed = useMemo(() => {
    if (!svg || !svg.trim()) return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');

      if (!svgEl) return null;

      // 读取原始 width / height
      const widthAttr = svgEl.getAttribute('width');
      const heightAttr = svgEl.getAttribute('height');

      const width = widthAttr ? parseFloat(widthAttr) : 100;
      const height = heightAttr ? parseFloat(heightAttr) : 100;

      const ratio = width / height;

      // 删除 svg 本身的 width / height
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');

      // 如果没有 viewBox，自动补
      if (!svgEl.getAttribute('viewBox')) {
        svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      // 强制自适应
      svgEl.setAttribute(
        'style',
        'width:100%;height:100%;display:block;'
      );

      svgEl.setAttribute(
        'preserveAspectRatio',
        'xMidYMid meet'
      );

      return {
        html: new XMLSerializer().serializeToString(svgEl),
        ratio,
      };
    } catch (e) {
      console.error('SVG parse error:', e);
      return null;
    }
  }, [svg]);

  if (!processed) return null;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: maxWidth,
        aspectRatio: processed.ratio,
        maxHeight: maxHeight,
        margin: '0 auto',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: processed.html }}
    />
  );
};

export default SvgRenderer;
