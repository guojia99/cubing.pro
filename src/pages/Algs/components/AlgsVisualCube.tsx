import React, { useEffect, useMemo, useRef } from 'react';
import { cubePNG } from 'sr-visualizer';
import type { ICubeOptions } from 'sr-visualizer';
import { resolveVisualCubeMask, resolveVisualCubeView } from '../utils/visualCubeConfig';
import { visualCubeSize } from '../utils/visualCubeCube';

export interface AlgsVisualCubeProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  /** 打乱/setup，优先于 formula */
  scramble?: string;
  /** 库公式或自定义公式 */
  formula: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AlgsVisualCube: React.FC<AlgsVisualCubeProps> = ({
  cube,
  classId,
  setName,
  groupName,
  scramble,
  formula,
  width = 160,
  height = 160,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeSize = visualCubeSize(cube);
  const mask = useMemo(
    () => resolveVisualCubeMask(classId, setName, groupName),
    [classId, setName, groupName],
  );
  const view = useMemo(
    () => resolveVisualCubeView(cube, classId, setName, groupName),
    [cube, classId, setName, groupName],
  );

  const renderWidth = view === 'plan' ? Math.min(width, height) : width;
  const renderHeight = view === 'plan' ? Math.min(width, height) : height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = '';
    const opts: ICubeOptions = {
      cubeSize,
      width: renderWidth,
      height: renderHeight,
    };
    const scr = scramble?.trim();
    const form = formula?.trim();
    if (scr) {
      opts.algorithm = scr;
    } else if (form) {
      opts.case = form;
    }
    if (mask) opts.mask = mask;
    if (view) opts.view = view;

    const centerRenderedImage = () => {
      const img = el.querySelector('img');
      if (!img) return;
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.maxWidth = '100%';
      img.style.objectFit = 'contain';
      img.style.boxSizing = 'border-box';
    };

    try {
      cubePNG(el, opts);
      centerRenderedImage();
      const img = el.querySelector('img');
      img?.addEventListener('load', centerRenderedImage);
      return () => img?.removeEventListener('load', centerRenderedImage);
    } catch (e) {
      console.error('[AlgsVisualCube]', e);
    }
  }, [cubeSize, renderWidth, renderHeight, scramble, formula, mask, view]);

  return (
    <div
      className={`algs-visual-cube${className ? ` ${className}` : ''}`}
      style={{
        width: '100%',
        maxWidth: renderWidth,
        minWidth: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        lineHeight: 0,
        ...(view === 'plan' ? { aspectRatio: '1' } : { minHeight: renderHeight }),
        ...style,
      }}
    >
      <div
        ref={containerRef}
        className="algs-visual-cube-inner"
        style={{
          width: '100%',
          maxWidth: '100%',
          height: view === 'plan' ? '100%' : undefined,
          minHeight: view === 'plan' ? undefined : renderHeight,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          lineHeight: 0,
        }}
      />
    </div>
  );
};

export default AlgsVisualCube;
