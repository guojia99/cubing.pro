import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { eventRouteM } from '@/utils/cube_result/event_route';
import { Result, resultStringPro, resultTimeString } from '@/utils/cube_result/result';
import { Link } from '@umijs/max';
import { Table } from 'antd';

import './result_tables.css';

const columnsMap = new Map([
  [
    'Round',
    {
      title: '轮次',
      dataIndex: 'Round',
      key: 'Round',
      width: 150,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onCell: (result: any, rowIndex: number) => ({
        className: 'custom-cell',
      }),
      render: (value: string) => {
        return <td className={'cube_result_round_col'}>{value}</td>;
      },
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
        return (
          <td className={'cube_result_player_name_col'}>
            <strong>
              <Link to={'/player/' + result.UserID}>{value}</Link>
            </strong>
          </td>
        );
      },
    },
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
      width: 100,
      render: (results: number, result: Result) => {
        const m = eventRouteM(result.EventRoute);
        let inter = m.integer ? m.integer : false;

        if (m.repeatedly) {
          inter = true;
          return <td className={'cube_result_Best_col'}>{resultTimeString(results, inter)}</td>;
        }
        return <td className={'cube_result_Best_col'}>{resultTimeString(results, inter)}</td>;
      },
    },
  ],
  [
    'Average',
    {
      title: '平均',
      dataIndex: 'Average',
      key: 'Average',
      width: 100,
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
        return <td className={'cube_result_Average_col'}>{resultTimeString(results)}</td>;
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
          if (value.includes("/")){
            body.push(<td style={{ width: '120px', minWidth: '120px' }}>{value}</td>);
          } else {
            body.push(<td style={{ width: '60px', minWidth: '60px' }}>{value}</td>);
          }

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
      width: 70,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onCell: (result: any, rowIndex: number) => ({
        className: 'custom-cell cube_result_rank_col',
      }),
      render: (value: number) => {
        return <td className={'cube_result_rank_col'}>{value+1}</td>;
      },
    },
  ],
]);

export const playerResultKeys = ['EventNameOnlyOne', 'Round', 'Best', 'Average', 'Result'];

export const ResultsTable = (dataSource: Result[], keys: string[]) => {
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
      scroll={{ x: 'max-content' }} // 启用横向滚动
    />
  );
};