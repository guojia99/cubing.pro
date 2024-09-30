import { CompsTable } from '@/components/Data/cube_comps/comps_tables';
import { Comp } from '@/components/Data/types/comps';
import React from 'react';

interface PlayerResultsCompsProps {
  comps: Comp[];
}

const PlayerResultsComps: React.FC<PlayerResultsCompsProps> = ({ comps }) => {

  for (let i = 0; i < comps.length; i++){
    comps[i].Index = comps.length - i
  }

  return <>{CompsTable(comps, ['Index', 'CompStartTime', 'Genre', 'Name'])}</>;
};

export default PlayerResultsComps;
