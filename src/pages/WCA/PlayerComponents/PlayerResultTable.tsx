import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { WcaProfile, WCAResult } from '@/services/wca/types';
import { Button, Card, Checkbox, message, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

import { CubesCn } from '@/components/CubeIcon/cube'; // 我们将样式抽离到 less 文件中更好控制
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CopyOutlined } from '@ant-design/icons';
import { eventOrder, roundSortOrder } from '../utils/events';
import './WCAPlayerResultTable.less';

interface WCAPlayerResultTableProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
}

interface TableData {
  key: string;
  eventId: string;
  countryRankSingle: number | string | undefined;
  continentRankSingle: number | string | undefined;
  worldRankSingle: number | string | undefined;
  single: string;
  average: string;
  worldRankAverage: number | string | undefined;
  continentRankAverage: number | string | undefined;
  countryRankAverage: number | string | undefined;
  solvesAttempted: string;
  podiumCount: JSX.Element | null;
}

// 排名转带样式的节点
const renderRank = (rank: number | string) => {
  if (rank === undefined || rank === 0) {
    return <></>;
  }
  if (rank === '-' || typeof rank !== 'number') {
    return <Tag color="default"></Tag>;
  }

  let tagColor: string;
  let textColor: string | undefined = undefined;

  if (rank <= 3) {
    tagColor = '#cf1322'; // 深红
    textColor = '#fff';
  } else if (rank <= 10) {
    tagColor = '#52c41a';
    textColor = '#fff';
  } else if (rank <= 100) {
    tagColor = '#1890ff';
    textColor = '#fff';
  } else {
    // 🟤 默认排名：浅灰背景 + 暗灰色文字（Ant 默认）
    return <Tag color="default">{rank}</Tag>;
  }

  return (
    <Tag
      color={tagColor}
      style={{
        color: textColor,
        fontWeight: 'bold',
        border: 'none',
        padding: '0 6px',
        fontSize: '12px',
        lineHeight: '20px',
        height: '20px',
      }}
    >
      {rank}
    </Tag>
  );
};

const WCAPlayerResultTable: React.FC<WCAPlayerResultTableProps> = ({ wcaProfile, wcaResults }) => {
  const [showRank, setShowRank] = React.useState(true);
  const [showPodium, setShowPodium] = React.useState(true);

  const resultsMap: Record<string, WCAResult[]> = {};
  wcaResults.forEach((result) => {
    if (!resultsMap[result.event_id]) {
      resultsMap[result.event_id] = [];
    }
    resultsMap[result.event_id].push(result);
  });

  // 获取最佳成绩
  const getBestSingle = (eventId: string): number => {
    return wcaProfile.personal_records[eventId]?.single?.best || 0;
  };

  const getBestAverage = (eventId: string): number => {
    return wcaProfile.personal_records[eventId]?.average?.best || 0;
  };

  // 获取排名（返回数字或“-”）
  const getRank = (
    eventId: string,
    type: 'single' | 'average',
    rankType: 'world_rank' | 'continent_rank' | 'country_rank',
  ): number | string | undefined => {
    return wcaProfile.personal_records[eventId]?.[type]?.[rankType];
  };

  // 渲染复原/尝试
  const renderSolvesAttempted = (eventId: string): string => {
    const results = resultsMap[eventId];
    if (!results || results.length === 0) return '';

    let totalSolves = 0;
    let totalAttempts = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      for (let j = 0; j < res.attempts.length; j++) {
        if (res.attempts[j] === 0) {
          continue;
        }
        totalAttempts += 1;
        if (res.attempts[j] > 0) {
          totalSolves += 1;
        }
      }
    }

    return `${totalSolves} / ${totalAttempts}`;
  };

  // 渲染领奖台数量（金/银/铜）
  const renderPodiumCount = (eventId: string): JSX.Element | null => {
    const results = resultsMap[eventId];
    if (!results || results.length === 0) return null;

    let gold = 0;
    let silver = 0;
    let bronze = 0;

    for (let i = 0; i < results.length; i++) {
      const res = results[i];

      if (roundSortOrder[res.round_type_id] !== 1) {
        continue;
      }

      if (res.pos === 1) gold += 1;
      else if (res.pos === 2) silver += 1;
      else if (res.pos === 3) bronze += 1;
    }

    if (gold + silver + bronze === 0) return null;

    return (
      <span style={{ display: 'inline-flex', gap: 6 }}>
        <span style={{ color: '#bbb205' }}>🥇{gold}</span>
        <span style={{ color: '#C0C0C0' }}>🥈{silver}</span>
        <span style={{ color: '#ff860e' }}>🥉{bronze}</span>
      </span>
    );
  };

  // 构建表格数据
  const tableData: TableData[] = [];
  let copyResult = `${wcaProfile.person.name}
${wcaProfile.person.wca_id}
参赛次数: ${wcaProfile.competition_count}
================
`;

  for (let i = 0; i < eventOrder.length; i++) {
    const eventId = eventOrder[i];
    if (getBestSingle(eventId) === undefined || getBestSingle(eventId) === 0) {
      continue;
    }

    const single = resultsTimeFormat(getBestSingle(eventId), eventId, false);
    const average = resultsTimeFormat(getBestAverage(eventId), eventId, true);

    copyResult += `${CubesCn(eventId)} ${single}`;
    if (average) {
      copyResult += `  || ${average}`;
    }
    copyResult += `\n`;

    tableData.push({
      key: eventId,
      eventId,
      countryRankSingle: getRank(eventId, 'single', 'country_rank'),
      continentRankSingle: getRank(eventId, 'single', 'continent_rank'),
      worldRankSingle: getRank(eventId, 'single', 'world_rank'),
      single: single,
      average: average,
      worldRankAverage: getRank(eventId, 'average', 'world_rank'),
      continentRankAverage: getRank(eventId, 'average', 'continent_rank'),
      countryRankAverage: getRank(eventId, 'average', 'country_rank'),
      solvesAttempted: renderSolvesAttempted(eventId),
      podiumCount: renderPodiumCount(eventId),
    });
  }

  // 平铺列定义（无嵌套）
  const columns: ColumnsType<TableData> = [
    {
      title: '项目',
      dataIndex: 'eventId',
      key: 'eventId',
      width: 80,
      fixed: 'left',
      render: (text) => {
        return (
          <>
            {CubeIcon(text, text, {})} {CubesCn(text)}
          </>
        );
      },
    },
  ];

  if (showRank) {
    columns.push({
      title: '单次',
      children: [
        {
          title: '地区',
          dataIndex: 'countryRankSingle',
          key: 'countryRankSingle',
          width: 70,
          render: (rank: number) => renderRank(rank),
        },
        {
          title: '洲际',
          dataIndex: 'continentRankSingle',
          key: 'continentRankSingle',
          width: 70,
          render: (rank: number) => renderRank(rank),
        },
        {
          title: '世界',
          dataIndex: 'worldRankSingle',
          key: 'worldRankSingle',
          width: 70,
          render: (rank: number) => renderRank(rank), // 单次世界排名，第一名标红
        },
        {
          title: '成绩',
          dataIndex: 'single',
          key: 'single',
          width: 100,
          align: 'right', // ✅ 平均成绩右对齐
          render: (text) => <strong>{text}</strong>,
        },
      ],
    });
    columns.push({
      title: '平均',
      children: [
        {
          title: '成绩',
          dataIndex: 'average',
          key: 'average',
          width: 100,
          align: 'right', // ✅ 平均成绩右对齐
          render: (text) => <strong>{text}</strong>,
        },
        {
          title: '世界',
          dataIndex: 'worldRankAverage',
          key: 'worldRankAverage',
          width: 70,
          render: (rank) => renderRank(rank), // 平均世界排名第一标红
        },
        {
          title: '洲际',
          dataIndex: 'continentRankAverage',
          key: 'continentRankAverage',
          width: 70,
          render: (rank) => renderRank(rank),
        },
        {
          title: '地区',
          dataIndex: 'countryRankAverage',
          key: 'countryRankAverage',
          width: 70,
          render: (rank) => renderRank(rank),
        },
      ],
    });
  } else {
    columns.push({
      title: '单次',
      dataIndex: 'single',
      key: 'single',
      width: 100,
      render: (text) => <strong>{text}</strong>,
    });

    columns.push({
      title: '平均',
      dataIndex: 'average',
      key: 'average',
      width: 100,
      render: (text) => <strong>{text}</strong>,
    });
  }

  // 添加领奖台列
  for (let i = 0; i < tableData.length; i++) {
    if (tableData[i].podiumCount && showPodium) {
      columns.push({
        title: '领奖台',
        dataIndex: 'podiumCount',
        key: 'podiumCount',
        width: 90,
      });
      break;
    }
  }

  // 添加还原列
  columns.push({
    title: '复原/尝试',
    dataIndex: 'solvesAttempted',
    key: 'solvesAttempted',
    width: 90,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyResult);
      message.success('✅ 成绩已复制到剪贴板！');
    } catch (err) {
      console.error('复制失败:', err);
      message.error('❌ 复制失败，请手动选择复制');
    }
  };

  return (
    <Card hoverable style={{ minWidth: 900, margin: '0 auto', borderRadius: 16 }} bordered={false}>
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <Tooltip title="复制成绩到剪贴板">
          <Button type="default" icon={<CopyOutlined />} size="small" onClick={handleCopy} />
        </Tooltip>
      </div>

      <div className="wca-player-result-table">
        <Table
          columns={columns as ColumnsType<TableData>} // Ant Design 类型兼容
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowClassName="wca-result-row"
        />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, float: 'right' }}>
        <Checkbox checked={showRank} onChange={(e) => setShowRank(e.target.checked)}>
          显示排名
        </Checkbox>
        <Checkbox checked={showPodium} onChange={(e) => setShowPodium(e.target.checked)}>
          显示领奖台
        </Checkbox>
      </div>
    </Card>
  );
};

export default WCAPlayerResultTable;
