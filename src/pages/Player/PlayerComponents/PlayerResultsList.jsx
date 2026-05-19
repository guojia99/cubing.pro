import { NavTabs } from '@/components/Tabs/nav_tabs';
import DownloadExcelButton from '@/pages/Player/PlayerComponents/PlayerResultDownloadButton';
import React, { Suspense, useEffect, useState } from 'react';
const PlayerResultsListWithEvent = React.lazy(() => import('./PlayerResultsListWithEvent'));
const PlayerResultsListWithComps = React.lazy(() => import('./PlayerResultsListWithComps'));
const PlayerResultsList = ({ events, results, records, comps, player, }) => {
    const [withResult, setWithResult] = useState([]);
    const [withComps, setWithComps] = useState([]);
    const [withDownloads, setWithDownloads] = useState([]);
    useEffect(() => {
        setWithResult(structuredClone(results));
        setWithComps(structuredClone(results));
        setWithDownloads(structuredClone(results));
    }, [results]);
    const items = [
        {
            key: 'with_result',
            label: '按项目',
            children: (<Suspense fallback={<div>Loading...</div>}>
          <PlayerResultsListWithEvent events={events} results={withResult} records={records} comps={comps}/>
        </Suspense>),
        },
        {
            key: 'with_comps',
            label: '按比赛',
            children: (<Suspense fallback={<div>Loading...</div>}>
          <PlayerResultsListWithComps events={events} results={withComps} records={records} comps={comps}/>
        </Suspense>),
        },
    ];
    return (<div style={{ minWidth: 0, maxWidth: '100%' }}>
      {/*<h4 style={{textAlign:"center"}}><strong>成绩列表</strong></h4>*/}
      <DownloadExcelButton player={player} results={withDownloads}/>
      <NavTabs type="line" items={items} tabsKey="player_result_result_list_tabs" indicator={{ size: (origin) => origin - 20, align: 'center' }}/>
    </div>);
};
export default PlayerResultsList;
//# sourceMappingURL=PlayerResultsList.jsx.map