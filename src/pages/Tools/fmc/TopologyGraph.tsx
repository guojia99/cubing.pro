// src/components/TopologyGraph.tsx
import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';  // ✅ 修改这里
import { nodes } from '@/pages/Tools/fmc/htr/nodes';
import { edges } from '@/pages/Tools/fmc/htr/edges';

const TopologyGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = { nodes, edges };

    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 80,
          nodeSpacing: 120,
        },
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'vertical',
          roundness: 0.4,
        },
      },
      nodes: {
        shape: 'box',
        margin: 10,
        font: { size: 14 },
      },
      physics: false,
      interaction: {
        dragNodes: true,
        zoomView: true,
      },
    };

    if (containerRef.current) {
      // @ts-ignore
      new Network(containerRef.current, data, options);
    }
  }, []);

  return (
    <div>
      <h2>HTR迷宫图</h2>
      <div ref={containerRef} style={{ height: '900px', border: '1px solid #ccc' }} />
    </div>
  );
};

export default TopologyGraph;
