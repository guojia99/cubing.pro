import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesCn } from '@/components/CubeIcon/cube';
import { WCACompetition, WCAResult } from '@/services/cubing-pro/wca/types';
import { eventOrder } from '@/pages/WCA/utils/events';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { useIntl } from '@@/plugin-locale';
import './WCAPlayerEventStatsTab.less';

export interface EventStatRow {
  key: string;
  eventId: string;
  firstCompDate: string;
  lastCompDate: string;
  compCount: number;
  roundCount: number;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
}

interface WCAPlayerEventStatsTabProps {
  wcaResults: WCAResult[];
  comps: WCACompetition[];
}

/**
 * 从 wcaResults 和 comps 计算每个项目的统计
 */
function computeEventStats(
  wcaResults: WCAResult[],
  comps: WCACompetition[],
): EventStatRow[] {
  const compDateMap = new Map(comps.map((c) => [c.id, c.start_date]));

  const byEvent = new Map<
    string,
    {
      compIds: Set<string>;
      firstDate: string;
      lastDate: string;
      roundCount: number;
      totalAttempts: number;
      successCount: number;
      failureCount: number;
    }
  >();

  for (const r of wcaResults) {
    const date = compDateMap.get(r.competition_id) ?? '';
    if (!date) continue;

    let stat = byEvent.get(r.event_id);
    if (!stat) {
      stat = {
        compIds: new Set(),
        firstDate: date,
        lastDate: date,
        roundCount: 0,
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
      };
      byEvent.set(r.event_id, stat);
    }

    stat.compIds.add(r.competition_id);
    if (date < stat.firstDate) stat.firstDate = date;
    if (date > stat.lastDate) stat.lastDate = date;
    stat.roundCount += 1;

    const attempts = r.attempts || [];
    for (const a of attempts) {
      if (a === 0) continue;
      stat.totalAttempts += 1;
      if (a > 0) {
        stat.successCount += 1;
      } else {
        stat.failureCount += 1;
      }
    }
  }

  const events = Array.from(byEvent.keys()).filter((e) =>
    eventOrder.includes(e),
  );
  events.sort((a, b) => eventOrder.indexOf(a) - eventOrder.indexOf(b));

  return events.map((eventId) => {
    const s = byEvent.get(eventId)!;
    return {
      key: eventId,
      eventId,
      firstCompDate: s.firstDate,
      lastCompDate: s.lastDate,
      compCount: s.compIds.size,
      roundCount: s.roundCount,
      totalAttempts: s.totalAttempts,
      successCount: s.successCount,
      failureCount: s.failureCount,
    };
  });
}

const WCAPlayerEventStatsTab: React.FC<WCAPlayerEventStatsTabProps> = ({
  wcaResults,
  comps,
}) => {
  const intl = useIntl();
  const dataSource = useMemo(
    () => computeEventStats(wcaResults, comps),
    [wcaResults, comps],
  );

  const columns: ColumnsType<EventStatRow> = [
    {
      title: intl.formatMessage({ id: 'wca.eventStats.event' }),
      dataIndex: 'eventId',
      key: 'eventId',
      width: 100,
      fixed: 'left',
      render: (eventId: string) => (
        <div className="event-stats-event-cell">
          {CubeIcon(eventId, eventId, {})}
          <strong>{CubesCn(eventId)}</strong>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.firstComp' }),
      dataIndex: 'firstCompDate',
      key: 'firstCompDate',
      width: 110,
      sorter: (a, b) => a.firstCompDate.localeCompare(b.firstCompDate),
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.lastComp' }),
      dataIndex: 'lastCompDate',
      key: 'lastCompDate',
      width: 110,
      sorter: (a, b) => a.lastCompDate.localeCompare(b.lastCompDate),
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.compCount' }),
      dataIndex: 'compCount',
      key: 'compCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.compCount - b.compCount,
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.roundCount' }),
      dataIndex: 'roundCount',
      key: 'roundCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.roundCount - b.roundCount,
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.totalAttempts' }),
      dataIndex: 'totalAttempts',
      key: 'totalAttempts',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.totalAttempts - b.totalAttempts,
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.successCount' }),
      dataIndex: 'successCount',
      key: 'successCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.successCount - b.successCount,
    },
    {
      title: intl.formatMessage({ id: 'wca.eventStats.failureCount' }),
      dataIndex: 'failureCount',
      key: 'failureCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.failureCount - b.failureCount,
    },
  ];

  if (dataSource.length === 0) {
    return (
      <div className="event-stats-empty">
        {intl.formatMessage({ id: 'wca.eventStats.noData' })}
      </div>
    );
  }

  return (
    <div className="event-stats-table-wrapper">
      <Table<EventStatRow>
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
      />
    </div>
  );
};

export default WCAPlayerEventStatsTab;
