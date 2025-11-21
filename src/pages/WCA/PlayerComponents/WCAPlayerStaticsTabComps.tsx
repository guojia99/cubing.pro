import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { getCompsEvents } from '@/pages/WCA/utils/events';
import { WCACompetition, WCAResult } from '@/services/wca/types';
import { Button, Space, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';
import { getLocationByPinyin } from '@/pages/WCA/PlayerComponents/region/china_citys';
import { findCubingCompetitionByIdentifier } from '@/services/cubing-pro/cubing_china/cubing';

interface WCACompetitionTableProps {
  competitions: WCACompetition[];
  wcaResults: WCAResult[];
}

// 赛事列表表格组件
const CompetitionTable: React.FC<WCACompetitionTableProps> = ({ competitions, wcaResults }) => {
  // 倒序排列（按开始日期倒序）
  const sortedCompetitions = [...competitions].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  }).map((r, i) => {
    r.indexNum = competitions.length - i
    return r;
  })

  const [competitionEventMap, setCompetitionEventMap] = useState<Map<string, string[]>>(
    new Map<string, string[]>(),
  );

  useEffect(() => {
    setCompetitionEventMap(getCompsEvents(wcaResults));
  }, [wcaResults]);

  // 定义表格列
  const columns: ColumnsType<WCACompetition> = [
    {
      title: '序号',
      dataIndex: 'indexNum',
      key: 'indexNum',
      width: 60,
      align: 'center',
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
      render: (name, record) => {
        let cpName = record.name
        // 比赛id
        const findName = findCubingCompetitionByIdentifier(record.id)
        if (findName){
          cpName = findName.name
        }
        return <Button
          type="link"
          size="small"
          href={record.website}
          target="_blank"
          style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}
        >
          {cpName}
        </Button>

      }
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
            body.push(CubeIcon(eventId, eventId, { color: '#000000' }));
          } else {
            body.push(CubeIcon(eventId, eventId, { color: '#a9a5a5' }));
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
      render: (city: string, record: WCACompetition) => {
        // 如果是来自中国的比赛，则进行中文城市名转换
        let cityNames = city.replace('Province', '').split(',').map(name => name.trim()).reverse()
        if (record.country_iso2 === 'CN' || record.country_iso2 === 'TW' || record.country_iso2 === 'HK') {
          // 转换城市名和省份名为中文
          const convertedCityNames = cityNames.map(cityName => {
            // 如果城市名在映射表中存在，则转换为中文，否则保持原样
            return getLocationByPinyin(cityName) || cityName;
          });

          // 假设最后一个元素是省份名，转换省份名
          if (convertedCityNames.length > 1) {
            const provinceIndex = convertedCityNames.length - 1;
            convertedCityNames[provinceIndex] = getLocationByPinyin(convertedCityNames[provinceIndex]) || convertedCityNames[provinceIndex];
          }

          // 用逗号连接并返回
          return `${getCountryNameByIso2(record.country_iso2)} ${convertedCityNames.join(' ')}`;
        }

        // 非中国比赛保持原有逻辑
        return `${getCountryNameByIso2(record.country_iso2)} ${cityNames.join(' ')}`;
      }
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
