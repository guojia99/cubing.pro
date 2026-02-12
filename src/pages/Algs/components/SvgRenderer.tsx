import React from 'react';

interface SvgRendererProps {
  svg: string;
  maxWidth?: number;
  maxHeight?: number;
  style?: React.CSSProperties;
}

const SvgRenderer: React.FC<SvgRendererProps> = ({
  svg,
  maxWidth = 120,
  maxHeight = 150,
  style = {},
}) => {
  if (!svg || !svg.trim()) return null;

  return (
    <div
      style={{
        width: '100%',
        minHeight: 40,
        maxWidth: maxWidth ?? 200,
        maxHeight: maxHeight ?? 150,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default SvgRenderer;
