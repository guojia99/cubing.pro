import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { getCompsEvents } from '@/views/Wca/utils/events';
import { Button, Space, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useIntl } from '@/hooks/useIntlMessage';
import { getLocale } from '@/lib/localeClient';
import { getCountryNameByIso2 } from '@/views/Wca/PlayerComponents/region/all_contiry';
import { getLocationByPinyin } from '@/views/Wca/PlayerComponents/region/china_citys';
import { findCubingCompetitionByIdentifier } from '@/services/cubing-pro/cubing_china/cubing';
import { WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';

interface WCACompetitionTableProps {
  competitions: WCACompetition[];
  wcaResults: WCAResult[];
}

// 赛事列表表格组件
const CompetitionTable: React.FC<WCACompetitionTableProps> = ({ competitions, wcaResults }) => {
  const intl = useIntl();
  const locale = getLocale() || intl.locale || 'zh-CN';
  /** 仅简体/繁体等中文界面将中港澳台省市区转为中文；英文、日文等保留 WCA 原文 */
  const translateChinaPlaceNames = locale.toLowerCase().startsWith('zh');

  const competitionRegionPrefix = (iso2: string): string => {
    if (translateChinaPlaceNames) {
      return getCountryNameByIso2(iso2) || iso2;
    }
    const code = iso2.toUpperCase();
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined') {
        const dn = new Intl.DisplayNames([locale], { type: 'region' });
        const n = dn.of(code);
        if (n) return n;
      }
    } catch {
      /* ignore */
    }
    return code;
  };

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
      title: intl.formatMessage({ id: 'wca.competition.index' }),
      dataIndex: 'indexNum',
      key: 'indexNum',
      width: 60,
      align: 'center',
    },
    {
      title: intl.formatMessage({ id: 'wca.competition.time' }),
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
      title: intl.formatMessage({ id: 'wca.competition.name' }),
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
        return (
          <Button
            type="link"
            size="small"
            href={`https://www.worldcubeassociation.org/competitions/${record.id}`}
            target="_blank"
            style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}
          >
            {cpName}
          </Button>
        );

      }
    },
    {
      title: intl.formatMessage({ id: 'wca.competition.events' }),
      dataIndex: 'event_ids',
      key: 'events',
      width: 200,
      render: (ids: string[], record: WCACompetition) => {
        const body: React.ReactElement[] = [];
        const playerIds = competitionEventMap.get(record.id) || [];
        if (ids){
          for (let i = 0; i < ids.length; i++) {
            const eventId = ids[i];

            if (playerIds.includes(eventId)) {
              body.push(CubeIcon(eventId, eventId, { color: 'var(--foreground)' }));
            } else {
              body.push(CubeIcon(eventId, eventId, { color: 'var(--faint-foreground)' }));
            }
          }
        } else {
          for (let i = 0; i < playerIds.length; i++) {
            const eventId = playerIds[i];
            body.push(CubeIcon(eventId, eventId, { color: 'var(--foreground)' }));
          }
        }
        return <Space>{body}</Space>;
      },
    },

    {
      title: intl.formatMessage({ id: 'wca.competition.city' }),
      dataIndex: 'city',
      key: 'city',
      width: 150,
      ellipsis: true,
      render: (city: string, record: WCACompetition) => {
        // 如果是来自中国的比赛，则进行中文城市名转换
        let cityNames = city.replace('Province', '').split(',').map(name => name.trim()).reverse()
        if (record.country_iso2 === 'CN' || record.country_iso2 === 'TW' || record.country_iso2 === 'HK') {
          const englishProvince =
            cityNames.length > 1 ? cityNames[cityNames.length - 1] : undefined;
          const convertedCityNames = translateChinaPlaceNames
            ? cityNames.map((cityName, idx) => {
                const isProvinceSegment = idx === cityNames.length - 1;
                if (isProvinceSegment) {
                  const peer =
                    cityNames.length >= 2 ? cityNames[0] : undefined;
                  return getLocationByPinyin(cityName, peer) || cityName;
                }
                return getLocationByPinyin(cityName, englishProvince) || cityName;
              })
            : cityNames;

          return `${competitionRegionPrefix(record.country_iso2)} ${convertedCityNames.join(' ')}`;
        }

        // 非中国比赛保持原有逻辑
        return `${competitionRegionPrefix(record.country_iso2)} ${cityNames.join(' ')}`;
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
