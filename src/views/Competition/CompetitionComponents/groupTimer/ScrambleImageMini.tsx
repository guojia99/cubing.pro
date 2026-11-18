import cstimer from 'cstimer_module';
import React, { useEffect, useState } from 'react';
import { useCompetitionPublicI18n } from '../../i18n';

const cstImageMap = new Map<string, string>([
  ['clock', 'clkwca'],
  ['minx', 'mgmo'],
  ['pyram', 'pyrm'],
  ['skewb', 'skb'],
]);

const svgToPngUrl = (svg: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngBase64 = canvas.toDataURL('image/png');
        URL.revokeObjectURL(svgUrl);
        resolve(pngBase64);
      } else {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Canvas 2d context not available'));
      }
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error(`Error loading SVG image: ${error}`));
    };
    img.src = svgUrl;
  });
};

type Props = { scramble: string; puzzleId: string; className?: string };

export const ScrambleImageMini: React.FC<Props> = ({ scramble, puzzleId, className }) => {
  const { p } = useCompetitionPublicI18n();
  const [pngData, setPngData] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setPngData(null);
    setFailed(false);
    void Promise.resolve().then(() => cstimer.getImage(scramble, cstImageMap.get(puzzleId) ?? puzzleId))
      .then(svgToPngUrl)
      .then((data) => { if (active) setPngData(data); })
      .catch((error) => {
        console.error('Group timer diagram failed', error);
        if (active) setFailed(true);
      });
    return () => { active = false; };
  }, [scramble, puzzleId]);

  if (!pngData) {
    return <div className={className} role="status">{p(failed ? 'competitionPublic.diagramFailed' : 'competitionPublic.loadingDiagram')}</div>;
  }
  return (
    <div className={className}>
      <img src={pngData} alt={p('competitionPublic.diagramAlt', { scramble })} style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
};
