import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CompetitionLink, PlayerLink } from '@/components/Link/Links';
import { Record } from '@/components/Data/types/record';
import { RecordTag } from '@/components/Data/cube_record/record_tag';
import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { resultTimeString } from '@/components/Data/types/result';
import { Table } from 'antd';

export const RecordsTableKeys: string[] = ['EventId', 'UserName', 'Best', 'Average'];

export const RecordsTable = (dataSource: Record[], keys: string[]) => {
  const columnsMap = new Map([
    [
      "Index",
      {
        title: "序号",
        dataIndex: 'Index',
        key: 'Index',
        width: 100,
      }
    ],
    [
      'EventId',
      {
        title: '项目',
        dataIndex: 'EventId',
        key: 'EventId',
        width: 100,
        render: (value: string, record: Record) => {
          return (
            <td>
              {CubeIcon(value, record.id + 'record', {})} {CubesCn(value)}
            </td>
          );
        },
      },
    ],
    [
      'UserName',
      {
        title: '选手',
        dataIndex: 'UserName',
        key: 'UserName',
        width: 100,
        render: (value: string, record: Record) => {
          return <>{PlayerLink(record.UserId, record.UserName, "")}</>;
        },
      },
    ],
    [
      'Best',
      {
        title: '最佳',
        dataIndex: 'Best',
        key: 'Best',
        width: 150,
        render: (value: number, record: Record) => {
          const m = eventRouteM(record.EventRoute);
          let inter = m.integer ? m.integer : false;

          if (record.Best !== null && record.Best !== undefined) {
            return RecordTag(record, resultTimeString(record.Best, inter));
          }
          if (m.repeatedly && record.Repeatedly !== null && record.Repeatedly !== undefined) {
            return RecordTag(record, record.Repeatedly);
          }
          return <></>;
        },
      },
    ],
    [
      'Average',
      {
        title: '平均',
        dataIndex: 'Average',
        key: 'Average',
        width: 150,
        render: (value: number, record: Record) => {
          if (record.Average !== null && record.Average !== undefined) {
            return RecordTag(record, resultTimeString(record.Average));
          }
          return <></>;
        },
      },
    ],
    [
      'CompsName',
      {
        title: '比赛',
        dataIndex: 'CompsName',
        key: 'CompsName',
        width: 300,
        render: (value: string, record: Record) => {
          return <>{CompetitionLink(record.CompsId, record.CompsName)}</>;
        },
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
      size="small"
      pagination={false}
      scroll={{ x: 'max-content' }} // 启用横向滚动
    />
  );
};
