import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { Result, resultStringPro, resultTimeString } from '@/components/Data/types/result';
import { Table } from 'antd';

import { RecordTagWithResult } from '@/components/Data/cube_record/record_tag';
import { generateRecordMap } from '@/components/Data/cube_record/record_utils';
import { Record } from '@/components/Data/types/record';
import { CompetitionLink, PlayerLink } from '@/components/Link/Links';
import './result_tables.css';

export const playerResultKeys = ['EventNameOnlyOne', 'Round', 'Best', 'Average', 'Result'];

export const ResultsTable = (
  dataSource: Result[],
  keys: string[],
  records: Record[] | undefined,
) => {
  let recordsMap = generateRecordMap(records); // map[resultsID]Record

  const columnsMap = new Map([
    [
      'Index',
      {
        title: '序号',
        dataIndex: 'Index',
        key: 'Index',
        width: 100,
      },
    ],
    [
      'Round',
      {
        title: '轮次',
        dataIndex: 'Round',
        key: 'Round',
        width: 80,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell',
        }),
      },
    ],
    [
      'PersonName',
      {
        title: '玩家名',
        dataIndex: 'PersonName',
        key: 'PersonName',
        width: 150,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell',
        }),
        render: (value: string, result: Result) => {
          return <>{PlayerLink(result.CubeID, value, '')}</>;
        },
      },
    ],
    [
      'CubeID',
      {
        title: "CubeID",
        dataIndex: "CubeID",
        key: "CubeID",
        width: 100,
      }
    ],
    [
      'Best',
      {
        title: '单次',
        dataIndex: 'Best',
        key: 'Best',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell',
        }),
        width: 135,
        render: (results: number, result: Result) => {
          const m = eventRouteM(result.EventRoute);
          let inter = m.integer ? m.integer : false;

          if (m.repeatedly) {
            inter = true;
            return (
              <td className={'cube_result_Best_col'}>
                {RecordTagWithResult(
                  resultTimeString(results, inter),
                  result.id + '_repeatedly',
                  true,
                  false,
                  recordsMap,
                )}
              </td>
            );
          }
          return (
            <td className={'cube_result_Best_col'}>
              {RecordTagWithResult(
                resultTimeString(results, inter),
                result.id + '_best',
                true,
                false,
                recordsMap,
              )}
            </td>
          );
        },
      },
    ],
    [
      'Average',
      {
        title: '平均',
        dataIndex: 'Average',
        key: 'Average',
        width: 135,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell',
        }),
        render: (results: number, result: Result) => {
          const m = eventRouteM(result.EventRoute);
          if (m.repeatedly) {
            // todo 多轮的
            return <td className={'cube_result_Average_col'}>-</td>;
          }

          // todo 需要pb
          return (
            <td className={'cube_result_Average_col'}>
              {RecordTagWithResult(
                resultTimeString(results, false, false, m.integer),
                result.id + '_average',
                false,
                false,
                recordsMap,
              )}
            </td>
          );
        },
      },
    ],
    [
      'Result',
      {
        title: '成绩',
        dataIndex: 'Result',
        key: 'Result',
        render: (results: number[], result: Result) => {
          let body: JSX.Element[] = [];
          // eslint-disable-next-line array-callback-return
          const data = resultStringPro(results, result.EventRoute);
          // eslint-disable-next-line array-callback-return
          data.map((value: string) => {
            body.push(<td style={{ minWidth: '80px' }}>{value}</td>);
          });
          return <div className={'cube_result_results_col'}>{body}</div>;
        },
      },
    ],
    [
      'Result_with_repeatedly',
      {
        title: '成绩',
        dataIndex: 'Result',
        key: 'Result',
        render: (results: number[], result: Result) => {
          let body: JSX.Element[] = [];
          // eslint-disable-next-line array-callback-return
          const data = resultStringPro(results, result.EventRoute);
          // eslint-disable-next-line array-callback-return
          data.map((value: string) => {
            body.push(
              <td style={{ minWidth: '80px' }}>
                {RecordTagWithResult(value, result.id + '_repeatedly', true, false, recordsMap)}
              </td>,
            );
          });
          return <div className={'cube_result_results_col'}>{body}</div>;
        },
      },
    ],
    [
      'EventName',
      {
        title: '项目',
        dataIndex: 'EventID',
        key: 'EventID',
        width: 80,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell',
        }),
        render: (value: string, result: Result) => {
          return (
            <td style={{ minWidth: '80px', width: '80px' }}>
              {CubeIcon(result.EventID, result.EventID, {})} {CubesCn(value)}
            </td>
          );
        },
      },
    ],
    [
      'EventNameOnlyOne',
      {
        title: '项目',
        dataIndex: 'EventID',
        key: 'EventID',
        width: 80,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell',
        }),
        render: (value: string, result: Result) => {
          if (result.RoundNumber !== 1) {
            return <td style={{ minWidth: '80px', width: '80px' }}></td>;
          }
          // todo 中英文？
          return (
            <td style={{ minWidth: '80px', width: '80px' }}>
              {CubeIcon(result.EventID, result.EventID, {})} {CubesCn(value)}
            </td>
          );
        },
      },
    ],
    [
      'Rank',
      {
        title: '排名',
        dataIndex: 'Rank',
        key: 'Rank',
        width: 65,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell: (result: any, rowIndex: number) => ({
          className: 'custom-cell cube_result_rank_col',
        }),
        render: (value: number) => {
          return <td>{value + 1}</td>;
        },
      },
    ],
    [
      'CompetitionName',
      {
        title: '比赛',
        dataIndex: 'CompetitionName',
        key: 'CompetitionName',
        render: (value: string, record: Result) => {
          return <>{CompetitionLink(record.CompetitionID, value)}</>;
        },
        width: 260,
      },
    ],
  ]);

  let columns = [];
  for (let key of keys) {
    let column = columnsMap.get(key);
    if (column === undefined) {
      continue;
    }
    columns.push(column);
  }

  return (
    <Table
      dataSource={dataSource}
      // @ts-ignore
      columns={columns}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }} // 启用横向滚动
    />
  );
};
