import { CompsTable } from '@/components/Data/cube_comps/comps_tables';
import React from 'react';
const PlayerResultsComps = ({ comps }) => {
    for (let i = 0; i < comps.length; i++) {
        comps[i].Index = comps.length - i;
    }
    return <>{CompsTable(comps, ['Index', 'CompStartTime', 'Genre', 'Name'])}</>;
};
export default PlayerResultsComps;
//# sourceMappingURL=PlayerResultsComps.jsx.map