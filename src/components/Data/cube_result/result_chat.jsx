import { DAvg, DBest, resultTimeString } from '@/components/Data/types/result';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import ScoreLineChart from '@/components/Data/cube_result/result_echarts';
export const ResultGraphChart = (eventID, dataSource, records) => {
    if (dataSource.length === 0) {
        return <></>;
    }
    const ev = eventRouteM(dataSource[0].EventRoute);
    // const recordsMap = generateRecordMap(records); // map[resultsID]Record
    const data = [];
    for (let i = dataSource.length - 1; i >= 0; i--) {
        const round = dataSource[i].CompetitionName + dataSource[i].Round;
        const bestValue = !DBest(dataSource[i]) ? dataSource[i].Best : null;
        data.push({
            index: i + 1,
            value: bestValue,
            type: 'best',
            round,
            // valueStr:
        });
        if (!(ev.repeatedly || ev.rounds === 1)) {
            const avgValue = !DAvg(dataSource[i]) ? dataSource[i].Average : null;
            data.push({
                index: i + 1,
                value: avgValue,
                type: 'average',
                round,
                // valueStr: recordsMap?.[dataSource[i].ID]?.AverageStr, // 同上
            });
        }
    }
    return (<>
      <div style={{ marginBottom: 20 }}>
        <ScoreLineChart data={data} renderScore={(v) => resultTimeString(v)} // 这里你可以改成自己的格式
    />
      </div>
    </>);
};
//# sourceMappingURL=result_chat.jsx.map