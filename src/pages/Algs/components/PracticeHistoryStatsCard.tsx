import React, { useMemo, useState } from 'react';
import { Card, Modal, Table } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import { getFormulaPracticeHistory } from '@/services/cubing-pro/algs/formulaPracticeHistory';
import { ALGS_COLORS } from '../constants';

interface PracticeHistoryStatsCardProps {
  cube: string;
  classId: string;
  refreshKey?: number;
}

export interface FormulaStatsItem {
  formulaKey: string;
  formulaName: string;
  setName: string;
  groupName: string;
  count: number;
  frequency: number;
}

const PracticeHistoryStatsCard: React.FC<PracticeHistoryStatsCardProps> = ({
  cube,
  classId,
  refreshKey = 0,
}) => {
  const intl = useIntl();
  const [modalOpen, setModalOpen] = useState(false);

  const stats = useMemo(() => {
    const records = getFormulaPracticeHistory(cube, classId);
    const total = records.length;
    const map = new Map<
      string,
      { formulaName: string; setName: string; groupName: string; count: number }
    >();
    for (const r of records) {
      const existing = map.get(r.formulaKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(r.formulaKey, {
          formulaName: r.formulaName,
          setName: r.setName,
          groupName: r.groupName,
          count: 1,
        });
      }
    }
    const items: FormulaStatsItem[] = [];
    map.forEach((v, key) => {
      items.push({
        formulaKey: key,
        formulaName: v.formulaName,
        setName: v.setName,
        groupName: v.groupName,
        count: v.count,
        frequency: total > 0 ? (v.count / total) * 100 : 0,
      });
    });
    items.sort((a, b) => b.count - a.count);
    return { items, total };
  }, [cube, classId, refreshKey]);

  const columns = [
    {
      title: intl.formatMessage({ id: 'algs.detail.set' }),
      dataIndex: 'setName',
      key: 'setName',
      width: 160,
    },
    {
      title: intl.formatMessage({ id: 'algs.detail.group' }),
      dataIndex: 'groupName',
      key: 'groupName',
      width: 160,
    },
    {
      title: intl.formatMessage({ id: 'algs.practiceHistoryStats.formulaName' }),
      dataIndex: 'formulaName',
      key: 'formulaName',
      width: 200,
      render: (_: unknown, row: FormulaStatsItem) => (
        <span style={{ fontWeight: 500 }}>{row.formulaName}</span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'algs.practiceHistoryStats.count' }),
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a: FormulaStatsItem, b: FormulaStatsItem) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: intl.formatMessage({ id: 'algs.practiceHistoryStats.frequency' }),
      dataIndex: 'frequency',
      key: 'frequency',
      width: 110,
      render: (v: number) => `${v.toFixed(1)}%`,
      sorter: (a: FormulaStatsItem, b: FormulaStatsItem) => a.frequency - b.frequency,
    },
  ];

  return (
    <>
      <Card
        size="small"
        style={{
          borderRadius: 12,
          backgroundColor: ALGS_COLORS.cardBg,
          borderColor: ALGS_COLORS.cardBorder,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            cursor: 'pointer',
          }}
          onClick={() => setModalOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(0,0,0,0.85)' }}>
            <BarChartOutlined style={{ color: 'rgba(100,149,237,0.8)' }} />
            <span style={{ fontWeight: 500 }}>
              {intl.formatMessage({ id: 'algs.practiceHistoryStats.title' })}
            </span>
            {stats.total > 0 && (
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>({stats.total})</span>
            )}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
          {intl.formatMessage({ id: 'algs.practiceHistoryStats.desc' })}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={intl.formatMessage({ id: 'algs.practiceHistoryStats.modalTitle' })}
        footer={null}
        width={880}
        styles={{ body: { maxHeight: 640, overflowY: 'auto' } }}
      >
        <div style={{ marginBottom: 12, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
          {intl.formatMessage(
            { id: 'algs.practiceHistoryStats.modalDesc' },
            { total: stats.total },
          )}
        </div>
        {stats.items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>
            {intl.formatMessage({ id: 'algs.formulaPractice.historyEmpty' })}
          </div>
        ) : (
          <Table
            dataSource={stats.items}
            columns={columns}
            rowKey="formulaKey"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="small"
          />
        )}
      </Modal>
    </>
  );
};

export default PracticeHistoryStatsCard;
