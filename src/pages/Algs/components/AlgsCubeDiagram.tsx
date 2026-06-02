import React from 'react';
import SvgRenderer from './SvgRenderer';
import AlgsVisualCube from './AlgsVisualCube';
import { isVisualCubeCube } from '../utils/visualCubeCube';

export interface AlgsCubeDiagramProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  imageSvg: string;
  scramble?: string;
  formula?: string;
  /** 为 false 时对该魔方类型仍使用后端 SVG 图 */
  useVisualCube?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AlgsCubeDiagram: React.FC<AlgsCubeDiagramProps> = ({
  cube,
  classId,
  setName,
  groupName,
  imageSvg,
  scramble,
  formula = '',
  useVisualCube = true,
  maxWidth,
  maxHeight,
  className,
  style,
}) => {
  const w = maxWidth ?? 180;
  const h = maxHeight ?? 180;

  if (useVisualCube && isVisualCubeCube(cube)) {
    return (
      <AlgsVisualCube
        cube={cube}
        classId={classId}
        setName={setName}
        groupName={groupName}
        scramble={scramble}
        formula={formula}
        width={w}
        height={h}
        className={className}
        style={{ width: '100%', minWidth: 0, ...style }}
      />
    );
  }

  return (
    <span className={className} style={style}>
      <SvgRenderer svg={imageSvg} maxWidth={maxWidth} maxHeight={maxHeight} />
    </span>
  );
};

export default AlgsCubeDiagram;
