import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { WCACompetition } from '@/services/wca/player';
import { WCAResult } from '@/services/wca/playerResults';
import { Button, Space, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { getCompsEvents } from '@/pages/WCA/utils/events';

interface WCACompetitionTableProps {
  competitions: WCACompetition[];
  wcaResults: WCAResult[];
}



// 赛事列表表格组件
const CompetitionTable: React.FC<WCACompetitionTableProps> = ({ competitions, wcaResults }) => {
  // 倒序排列（按开始日期倒序）
  const sortedCompetitions = [...competitions].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });


  const [competitionEventMap, setCompetitionEventMap] = useState<Map<string, string[]>>(new Map<string, string[]>);

  useEffect(() => {
    setCompetitionEventMap(getCompsEvents(wcaResults))

  }, [wcaResults])

  // 定义表格列
  const columns: ColumnsType<WCACompetition> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1, // 行号从 1 开始
    },
    {
      title: '时间',
      key: 'date_range', // 使用 date_range 作为唯一 key
      width: 180,
      sorter: (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      render: (_, record) => {
        const startDate = new Date(record.start_date);
        const endDate = new Date(record.end_date);

        // 格式化为 YYYY-MM-DD
        const formatISODate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const startStr = formatISODate(startDate);
        const endStr = formatISODate(endDate);

        if (startStr === endStr) {
          return <span>{startStr}</span>; // 单天比赛
        } else {
          return (
            <span>
              {startStr} ~ {endStr}
            </span>
          ); // 多天比赛
        }
      },
    },
    {
      title: '比赛名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
      render: (name, record) => (
        <Button
          type="link"
          size="small"
          href={record.website}
          target="_blank"
          style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}
        >
          {name}
        </Button>
      ),
    },

    {
      title: '项目',
      dataIndex: 'event_ids',
      key: 'events',
      width: 200,
      render: (ids: string[], record: WCACompetition) => {
        const body: React.ReactElement[] = [];
        const playerIds = competitionEventMap.get(record.id) || [];
        for (let i = 0; i < ids.length; i++) {
          const eventId = ids[i];

          if (playerIds.includes(eventId)) {
            body.push( CubeIcon(eventId, eventId, { color: '#000000' }))
          } else {
            body.push( CubeIcon(eventId, eventId, { color: '#a9a5a5' }))
          }
        }
        return <Space>{body}</Space>;
      },
    },

    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 150,
      ellipsis: true,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={sortedCompetitions}
      rowKey="id"
      pagination={false}
      scroll={{ x: 'max-content' }}
      size="small"
    />
  );
};

export default CompetitionTable;
