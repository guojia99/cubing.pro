import { secondTimeFormat } from '@/pages/WCA/utils/wca_results';
import {
  getResultProportionEstimation,
  impliedCentisAllEvents,
  interpolateRatioAt,
  segmentRefRangeAsAnchorCs,
  solveBackendAnchorCs,
  type ProportionCurveSample,
  type ProportionEstimationSegment,
  type ResultProportionEstimationResult,
  type ResultProportionEstimationType,
} from '@/services/cubing-pro/wca/proportion_estimation';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import Markdown from '@/components/Markdown/Markdown';
import { LineChartOutlined, ReadOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './ProportionEstimation.less';

const { Title, Text } = Typography;

const WR_OPTIONS = [100, 200, 500, 1000] as const;

const TYPE_OPTIONS: { value: ResultProportionEstimationType; labelKey: string }[] = [
  { value: 'bigcube', labelKey: 'wca.proportion.typeBigCube' },
  { value: '333-333oh', labelKey: 'wca.proportion.type333oh' },
  { value: 'bld', labelKey: 'wca.proportion.typeBld' },
];

const DEFAULT_ANCHOR_SEC: Record<ResultProportionEstimationType, number> = {
  bigcube: 19,
  '333-333oh': 6.5,
  bld: 40,
};

const CHART_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#2f54eb'];

/** 分段表：厘秒区间格式化为秒显示 */
function formatCsRangeSec(minCs: number, maxCs: number): string {
  return `${secondTimeFormat(minCs / 100, false)} – ${secondTimeFormat(maxCs / 100, false)}`;
}

/** 折线按横坐标升序，避免切换锚点后 X 与样本顺序不一致导致连线“打结” */
function sortChartPointsByX(points: [number, number][]): [number, number][] {
  return [...points].sort((a, b) => {
    if (a[0] !== b[0]) {
      return a[0] - b[0];
    }
    return a[1] - b[1];
  });
}

const ProportionEstimation: React.FC = () => {
  const intl = useIntl();
  const [estimationType, setEstimationType] = useState<ResultProportionEstimationType>('bigcube');
  const [wrN, setWrN] = useState<number>(500);
  const [data, setData] = useState<ResultProportionEstimationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [anchorSec, setAnchorSec] = useState<number>(DEFAULT_ANCHOR_SEC.bigcube);
  const [algorithmModalOpen, setAlgorithmModalOpen] = useState(false);
  /** 页面全局锚点：分段区间、横轴、各卡片标题与说明均以此为基准 */
  const [anchorEvent, setAnchorEvent] = useState<string>('');

  useEffect(() => {
    setAnchorSec(DEFAULT_ANCHOR_SEC[estimationType]);
  }, [estimationType]);

  useEffect(() => {
    if (!data?.events?.length) {
      return;
    }
    setAnchorEvent((prev) => (prev && data.events.includes(prev) ? prev : data.events[0]));
  }, [data?.events]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResultProportionEstimation(estimationType, wrN);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [estimationType, wrN]);

  useEffect(() => {
    load();
  }, [load]);

  const backendAnchor = data?.events[0] ?? '';
  const globalMap = data?.global_ratio ?? {};

  /** 仅用于「模拟推断」：由锚点成绩输入反解后端参考锚点再展开各项目 */
  const inferResolved = useMemo(() => {
    if (!data?.events?.length || !backendAnchor || !anchorEvent) {
      return { ta: 0, centis: {} as Record<string, number> };
    }
    const targetCs = Math.max(0, anchorSec) * 100;
    const ta = solveBackendAnchorCs(
      targetCs,
      anchorEvent,
      backendAnchor,
      data.segments,
      globalMap,
    );
    const centis = impliedCentisAllEvents(ta, data.events, backendAnchor, data.segments, globalMap);
    return { ta, centis };
  }, [data, backendAnchor, anchorEvent, anchorSec, globalMap]);

  /** 全局参考用时：固定取拟合曲线采样序列的中点参考锚点（厘秒），与锚点成绩输入无关 */
  const globalRefBackendCs = useMemo(() => {
    const samples = data?.curve_samples;
    if (!samples?.length) {
      return 0;
    }
    const mid = samples[Math.floor(samples.length / 2)];
    return mid.anchor_sec * 100;
  }, [data?.curve_samples]);

  const inferredRows = useMemo(() => {
    if (!data?.events?.length || !anchorEvent) {
      return [];
    }
    const { centis } = inferResolved;
    return data.events.map((ev) => ({
      key: ev,
      event: ev,
      sec: centis[ev] / 100,
    }));
  }, [data?.events, inferResolved, anchorEvent]);

  const chartOption = useMemo(() => {
    if (!data?.curve_samples?.length || !data.events?.length || !backendAnchor || !anchorEvent) {
      return null;
    }
    const samples = data.curve_samples;
    const events = data.events;

    const xForSample = (s: ProportionCurveSample) => {
      const tAcs = s.anchor_sec * 100;
      if (anchorEvent === backendAnchor) {
        return s.anchor_sec;
      }
      const gSel = globalMap[anchorEvent] ?? 1;
      const rSel = interpolateRatioAt(tAcs, data.segments, anchorEvent, gSel);
      return (tAcs * rSel) / 100;
    };

    const series = events.map((ev, idx) => {
      const pts = samples.map((s) => [xForSample(s), s.estimates[ev] ?? 0] as [number, number]);
      return {
        name: ev,
        type: 'line' as const,
        smooth: true,
        showSymbol: samples.length <= 30,
        symbolSize: 6,
        lineStyle: { width: ev === anchorEvent ? 3 : 2 },
        itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
        emphasis: { focus: 'series' as const },
        data: sortChartPointsByX(pts),
      };
    });

    const xName = intl.formatMessage({ id: 'wca.proportion.chartXAnchor' });
    const yName = intl.formatMessage({ id: 'wca.proportion.chartY' });
    const fmt = (n: number) => secondTimeFormat(n, false);

    return {
      color: CHART_COLORS,
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
        formatter: (params: unknown) => {
          const list = (Array.isArray(params) ? params : [params]) as Array<{
            value?: [number, number] | number;
            axisValue?: number;
            seriesName?: string;
            marker?: string;
          }>;
          if (!list.length) {
            return '';
          }
          const first = list[0];
          const v0 = first.value;
          const xVal =
            Array.isArray(v0) && typeof v0[0] === 'number'
              ? v0[0]
              : typeof first.axisValue === 'number'
                ? first.axisValue
                : Number(first.axisValue ?? 0);
          const lines = list.map((p) => {
            const v = p.value;
            const y = Array.isArray(v) ? v[1] : Number(v);
            return `${p.marker ?? ''} ${p.seriesName ?? ''}: ${fmt(y)}`;
          });
          return `${fmt(xVal)}<br/>${lines.join('<br/>')}`;
        },
      },
      legend: {
        type: 'scroll' as const,
        bottom: 0,
        data: events,
      },
      grid: {
        left: 56,
        right: 24,
        top: 48,
        bottom: events.length > 4 ? 72 : 56,
        containLabel: false,
      },
      xAxis: {
        type: 'value' as const,
        name: xName,
        nameLocation: 'middle' as const,
        nameGap: 28,
        scale: true,
        axisLabel: {
          formatter: (val: string | number) => fmt(typeof val === 'string' ? parseFloat(val) : val),
        },
      },
      yAxis: {
        type: 'value' as const,
        name: yName,
        nameLocation: 'middle' as const,
        nameGap: 44,
        scale: true,
        axisLabel: {
          formatter: (val: string | number) => fmt(typeof val === 'string' ? parseFloat(val) : val),
        },
      },
      series,
    };
  }, [data, backendAnchor, anchorEvent, globalMap, intl]);

  const segmentColumns: ColumnsType<ProportionEstimationSegment & { ratio: Record<string, number> }> =
    useMemo(() => {
      if (!data?.segments?.length || !data.events?.length || !backendAnchor || !anchorEvent) {
        return [];
      }
      const events = data.events;
      const gr = globalMap;
      const segs = data.segments;

      const evCols = events.map((ev) => ({
        title: ev,
        key: ev,
        align: 'right' as const,
        render: (_: unknown, row: ProportionEstimationSegment & { ratio: Record<string, number> }) => {
          const centerCs = (row.anchor_min + row.anchor_max) / 2;
          const r =
            ev === backendAnchor ? 1 : row.ratio?.[ev] ?? gr[ev] ?? 1;
          const sec = (centerCs * r) / 100;
          return secondTimeFormat(sec, false);
        },
      }));

      return [
        {
          title: intl.formatMessage({ id: 'wca.proportion.segIndex' }),
          key: 'idx',
          width: 56,
          render: (_: unknown, __: unknown, i: number) => i + 1,
        },
        {
          title: intl.formatMessage({ id: 'wca.proportion.segRangeCol' }),
          key: 'range',
          render: (_: unknown, row: ProportionEstimationSegment) => {
            const [loCs, hiCs] = segmentRefRangeAsAnchorCs(
              row.anchor_min,
              row.anchor_max,
              anchorEvent,
              backendAnchor,
              segs,
              gr,
            );
            return formatCsRangeSec(loCs, hiCs);
          },
        },
        {
          title: intl.formatMessage({ id: 'wca.proportion.segPersons' }),
          dataIndex: 'n_persons',
          key: 'n_persons',
          width: 88,
        },
        ...evCols,
      ];
    }, [data, backendAnchor, anchorEvent, globalMap, intl]);

  const segmentDataSource = useMemo(
    () =>
      (data?.segments ?? []).map((s) => ({
        ...s,
        ratio: s.ratio ?? {},
      })),
    [data?.segments],
  );

  const inferredColumns: ColumnsType<(typeof inferredRows)[0]> = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'wca.resultTable.event' }),
        dataIndex: 'event',
        key: 'event',
        width: 120,
        render: (_: string, row) => {
          const isAnchor = row.event === anchorEvent;
          return (
            <Tag
              className="proportion-infer-event-tag"
              color={isAnchor ? 'geekblue' : 'default'}
              bordered={!isAnchor}
            >
              <span className="proportion-infer-event-tag-inner">
                {CubeIcon(row.event, `proportion-infer-${row.event}`, {
                  width: 16,
                  height: 16,
                })}
                <span className="proportion-infer-event-code">{row.event}</span>
              </span>
            </Tag>
          );
        },
      },
      {
        title: intl.formatMessage({ id: 'wca.proportion.estimated' }),
        key: 'est',
        align: 'right' as const,
        render: (_, row) => secondTimeFormat(row.sec, false),
      },
    ],
    [anchorEvent, intl],
  );

  return (
    <div className="proportion-page">
      <div className="proportion-hero">
        <div className="proportion-hero-bar">
          <Title level={3} className="proportion-title">
            <LineChartOutlined /> {intl.formatMessage({ id: 'wca.proportion.title' })}
          </Title>
          <Button
            type="link"
            icon={<ReadOutlined />}
            className="proportion-algorithm-btn"
            onClick={() => setAlgorithmModalOpen(true)}
          >
            {intl.formatMessage({ id: 'wca.proportion.algorithmBtn' })}
          </Button>
        </div>
      </div>

      <Card className="proportion-controls" bordered={false} loading={loading}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10} lg={8}>
            <div className="proportion-field-label">{intl.formatMessage({ id: 'wca.proportion.fieldType' })}</div>
            <Select
              className="proportion-select-full"
              value={estimationType}
              options={TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: intl.formatMessage({ id: o.labelKey }),
              }))}
              onChange={(v) => setEstimationType(v)}
            />
          </Col>
          <Col xs={24} md={14} lg={10}>
            <div className="proportion-field-label">{intl.formatMessage({ id: 'wca.proportion.fieldWr' })}</div>
            <Segmented
              className="proportion-wr-seg"
              value={wrN}
              onChange={(v) => setWrN(v as number)}
              options={WR_OPTIONS.map((n) => ({
                label: `WR${n}`,
                value: n,
              }))}
            />
          </Col>
          <Col xs={24} lg={6} className="proportion-reload-wrap">
            <Text type="secondary">{intl.formatMessage({ id: 'wca.proportion.changeHint' })}</Text>
          </Col>
        </Row>

        {data && anchorEvent && (
          <Row gutter={[16, 16]} className="proportion-stats-row">
            <Col xs={24} sm={12} md={8}>
              <Card size="small" className="proportion-stat-card">
                <Statistic
                  title={
                    <Space>
                      <TeamOutlined />
                      {intl.formatMessage({ id: 'wca.proportion.statFit' })}
                    </Space>
                  }
                  value={data.sample_count}
                  suffix={intl.formatMessage({ id: 'wca.proportion.people' })}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" className="proportion-stat-card">
                <Statistic
                  title={intl.formatMessage({ id: 'wca.proportion.statPool' })}
                  value={data.persons?.length ?? 0}
                  suffix={intl.formatMessage({ id: 'wca.proportion.people' })}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" className="proportion-stat-card proportion-stat-anchor">
                <div className="proportion-anchor-block">
                  <div className="proportion-field-label" style={{ marginBottom: 8 }}>
                    {intl.formatMessage({ id: 'wca.proportion.fieldAnchor' })}
                  </div>
                  <Select
                    className="proportion-select-full"
                    value={anchorEvent}
                    options={data.events.map((e) => ({ label: e, value: e }))}
                    onChange={(v) => setAnchorEvent(v)}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {data && data.sample_count < 5 && (
          <Alert
            type="warning"
            showIcon
            className="proportion-alert"
            message={intl.formatMessage({ id: 'wca.proportion.lowSample' })}
          />
        )}
      </Card>

      {data && anchorEvent && (
        <>
          <Card
            className="proportion-section"
            title={intl.formatMessage({ id: 'wca.proportion.sectionInfer' })}
          >
            <div className="proportion-infer-controls">
              <Row gutter={[16, 16]} align="bottom">
                <Col xs={24} sm={12} md={16}>
                  <Text type="secondary" className="proportion-infer-input-label">
                    <ThunderboltOutlined />{' '}
                    {intl.formatMessage({ id: 'wca.proportion.anchorLabel' })}
                  </Text>
                  <Space align="center" className="proportion-infer-input-row">
                    <InputNumber
                      min={0}
                      step={0.01}
                      value={anchorSec}
                      onChange={(v) => setAnchorSec(typeof v === 'number' ? v : 0)}
                      className="proportion-anchor-input"
                    />
                    <Text type="secondary">s</Text>
                  </Space>
                </Col>
              </Row>
            </div>
            <Table
              className="proportion-infer-table"
              size="small"
              pagination={false}
              tableLayout="fixed"
              columns={inferredColumns}
              dataSource={inferredRows}
              rowKey="key"
              onRow={(record) => ({
                className:
                  record.event === anchorEvent ? 'proportion-infer-row--anchor' : undefined,
              })}
            />
            <Text type="secondary" className="proportion-footnote">
              {intl.formatMessage({ id: 'wca.proportion.inferNote' }, { anchor: anchorEvent })}
            </Text>
          </Card>

          {chartOption && (
            <Card
              className="proportion-section"
              title={intl.formatMessage({ id: 'wca.proportion.sectionChart' })}
            >
              <div className="proportion-chart-wrap">
                <ReactECharts option={chartOption} style={{ height: 380, width: '100%' }} notMerge lazyUpdate />
              </div>
            </Card>
          )}

          <Card
            className="proportion-section"
            title={intl.formatMessage({ id: 'wca.proportion.sectionGlobal' })}
          >
            <Row gutter={[16, 8]}>
              {data.events.map((ev) => {
                const gr = ev === backendAnchor ? 1 : globalMap[ev] ?? 1;
                const sec = (globalRefBackendCs * gr) / 100;
                return (
                  <Col xs={12} sm={8} md={6} key={ev}>
                    <div className="proportion-global-item">
                      <Text strong>{ev}</Text>
                      <div className="proportion-global-val">{secondTimeFormat(sec, false)}</div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>

          <Card
            className="proportion-section"
            title={intl.formatMessage({ id: 'wca.proportion.sectionSegments' })}
          >
            <div className="proportion-table-wrap">
              <Table
                size="small"
                scroll={{ x: 'max-content' }}
                pagination={false}
                columns={segmentColumns}
                dataSource={segmentDataSource}
                rowKey={(row) => `${row.anchor_min}-${row.anchor_max}-${row.n_persons}`}
              />
            </div>
          </Card>
        </>
      )}

      <Modal
        title={intl.formatMessage({ id: 'wca.proportion.algorithmModalTitle' })}
        open={algorithmModalOpen}
        onCancel={() => setAlgorithmModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
        className="proportion-algorithm-modal"
      >
        <div className="proportion-algorithm-modal-body">
          <Markdown md={intl.formatMessage({ id: 'wca.proportion.algorithmMd' })} />
        </div>
      </Modal>
    </div>
  );
};

export default ProportionEstimation;
