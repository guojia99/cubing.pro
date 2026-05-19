import cstimer from 'cstimer_module';
import React, { useEffect, useState } from 'react';
const cstImageMap = new Map([
    ['clock', 'clkwca'],
    ['minx', 'mgmo'],
    ['pyram', 'pyrm'],
    ['skewb', 'skb'],
]);
const svgToPngUrl = (svg) => {
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
            }
            else {
                reject('Canvas 2d context not available');
            }
        };
        img.onerror = (error) => {
            reject(`Error loading SVG image: ${error}`);
        };
        img.src = svgUrl;
    });
};
export const ScrambleImageMini = ({ scramble, puzzleId, className }) => {
    const [pngData, setPngData] = useState(null);
    useEffect(() => {
        const cstEv = cstImageMap.get(puzzleId) ? cstImageMap.get(puzzleId) : puzzleId;
        const svgString = cstimer.getImage(scramble, cstEv);
        svgToPngUrl(svgString).then(setPngData).catch(() => setPngData(null));
    }, [scramble, puzzleId]);
    if (!pngData) {
        return <div className={className}>…</div>;
    }
    return (<div className={className}>
      <img src={pngData} alt="" style={{ maxWidth: '100%', height: 'auto' }}/>
    </div>);
};
//# sourceMappingURL=ScrambleImageMini.jsx.map