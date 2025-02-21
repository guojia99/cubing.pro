import DrawPalette, {pathSvg} from '@/pages/Tools/DrawPalette';
import React, {useEffect, useState} from 'react';

const MinxDraw: React.FC = () => {
  const baseMinxColor = [
    '#00000000',
    '#033fff',
    '#f3ff00',
    '#d10707',
    '#b112d8',
    '#206606',

    '#ebf076',
    '#4dd800',
    '#ff8806',
    '#f18886',
    '#60a8f1',

    '#3d3d3d',
    '#f5f3db',
    '#777',
  ];

  const minxPoints = [
    'M1985 2690 L3488 1595 L3488 2541 L2894 2968 Z',
    'M2894 2968 L3488 2541 L4991 3673 L3488 4749 Z',

    'M6494 1595 L7997 2690 L7088 2968 L6512 2541 Z',
    'M6512 2541 L7088 2968 L6494 4749 L4991 3673 Z',

    'M8015 5844 L7793 6531 L5919 6512 L6494 4749 Z',
    'M8925 5547 L8349 7310 L7793 6531 L8015 5844 Z',

    'M5919 9073 L4063 9073 L4638 8312 L5362 8312 Z',
    'M5362 8312 L4638 8312 L4063 6512 L5919 6512 Z',

    'M1632 7310 L1057 5547 L1966 5844 L2189 6531 Z',
    'M2189 6531 L1966 5844 L3488 4749 L4063 6512 Z',

    'M4991 1446 L6512 2541 L4991 3673 L3488 2541 Z',
    'M3488 1595 L4991 500 L4991 1446 L3488 2541 Z',
    'M4991 500 L6494 1595 L6512 2541 L4991 1446 Z',

    'M1391 4063 L2894 2968 L3488 4749 L1966 5844 Z',
    'M1057 5547 L500 3785 L1391 4063 L1966 5844 Z',
    'M500 3785 L1985 2690 L2894 2968 L1391 4063 Z',

    'M8591 4063 L8015 5844 L6494 4749 L7088 2968 Z',
    'M7997 2690 L9500 3785 L8591 4063 L7088 2968 Z',
    'M9500 3785 L8925 5547 L8015 5844 L8591 4063 Z',

    'M2764 8312 L2189 6531 L4063 6512 L4638 8312 Z',
    'M4063 9073 L2207 9073 L2764 8312 L4638 8312 Z',
    'M2207 9073 L1632 7310 L2189 6531 L2764 8312 Z',

    'M7218 8312 L5362 8312 L5919 6512 L7793 6531 Z',
    'M8349 7310 L7774 9073 L7218 8312 L7793 6531 Z',
    'M7774 9073 L5919 9073 L5362 8312 L7218 8312 Z',

    'M5919 6512 L4063 6512 L3488 4749 L4991 3673 L6494 4749 Z',
  ];


  const [minxPointsM, setMinxPointsM] = useState<pathSvg[]>([]);

  useEffect(() => {
    const v = []
    for (let i = 0; i < minxPoints.length; i++){
      v.push({
        key: 'minx' + i,
        d: minxPoints[i]
      });
    }
    setMinxPointsM(v)
  }, []);

  return (
    <div>
      <DrawPalette
        svgPoints={minxPointsM}
        presetColors={baseMinxColor}
        storageKey={'minxDraw'}
        viewBox={"0 0 10000 10000"}
        strokeWidthNum={25}
      />
    </div>
  );
};

export default MinxDraw;
