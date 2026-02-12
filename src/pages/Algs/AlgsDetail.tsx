import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Collapse, Drawer, Modal, Progress, Row, Slider, Spin, Statistic } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import { useNavigate, useParams } from '@@/exports';
import { getAlgCubeClass } from '@/services/cubing-pro/algs/algs';
import type { AlgorithmClass, Algorithm } from '@/services/cubing-pro/algs/typings';
import { exportAlgsPdf } from './utils/pdfExport';
import AlgsModal from './components/AlgsModal';
import AlgsFormulaCard from './components/AlgsFormulaCard';
import AlgsFilterPanel from './components/AlgsFilterPanel';
import AlgsFloatButtons from './components/AlgsFloatButtons';
import { getFormulaFontSize, setFormulaFontSize } from './utils/storage';
import { SET_CARD_COLORS } from './constants';
import './index.less';

function buildGroupKey(setName: string, groupName: string): string {
  return `${setName}:${groupName}`;
}

const AlgsDetail: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { cube, class: classId } = useParams<{ cube: string; class: string }>();
  const [data, setData] = useState<AlgorithmClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [formulaFontSize, setFormulaFontSizeState] = useState(() => getFormulaFontSize());
  const [statModalOpen, setStatModalOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    algs: Array<{ alg: Algorithm; setName: string; groupName: string }>;
    index: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (!cube || !classId) return;
    setLoading(true);
    getAlgCubeClass(decodeURIComponent(cube), decodeURIComponent(classId))
      .then((d) => {
        setData(d);
        const keys = d.setKeys ?? [];
        setSelectedSets(keys);
        const allGroups: string[] = [];
        (d.sets ?? []).forEach((s) => {
          (s.groups_keys ?? []).forEach((g) => allGroups.push(buildGroupKey(s.name, g)));
        });
        setSelectedGroups(allGroups);
      })
      .finally(() => setLoading(false));
  }, [cube, classId]);

  const handleSetToggle = (name: string) =>
    setSelectedSets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  const handleGroupToggle = (key: string) =>
    setSelectedGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const allSetKeys = data?.setKeys ?? [];
  const allGroupKeys = (data?.sets ?? [])
    .filter((s) => selectedSets.includes(s.name))
    .flatMap((s) => (s.groups_keys ?? []).map((g) => buildGroupKey(s.name, g)));

  const handleSetSelectAll = () => setSelectedSets([...allSetKeys]);
  const handleSetDeselectAll = () => setSelectedSets([]);
  const handleGroupSelectAll = () => setSelectedGroups([...allGroupKeys]);
  const handleGroupDeselectAll = () => setSelectedGroups([]);

  const handleExportPdf = async () => {
    if (!data || !cube || !classId || !contentRef.current) return;
    setExporting(true);
    setExportProgress(0);
    try {
      await exportAlgsPdf(
        contentRef.current,
        decodeURIComponent(cube),
        decodeURIComponent(classId),
        (percent) => setExportProgress(percent),
      );
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const handleScrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || !data || !cube || !classId) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const dcube = decodeURIComponent(cube);
  const dclassId = decodeURIComponent(classId);
  const sets = data.sets ?? [];
  const setKeys = data.setKeys ?? [];

  const groupedAlgs: Array<{
    setName: string;
    groupName: string;
    setColorIndex: number;
    algs: Array<{ alg: Algorithm; setName: string; groupName: string }>;
  }> = [];
  sets.forEach((set, setIdx) => {
    if (!selectedSets.includes(set.name)) return;
    const groups = set.groups ?? [];
    const groupKeys = set.groups_keys ?? [];
    groupKeys.forEach((gName, gi) => {
      const key = buildGroupKey(set.name, gName);
      if (!selectedGroups.includes(key)) return;
      const group = groups[gi];
      const items = (group?.algs ?? []).map((alg) => ({ alg, setName: set.name, groupName: gName }));
      if (items.length > 0) {
        groupedAlgs.push({
          setName: set.name,
          groupName: gName,
          setColorIndex: setIdx % SET_CARD_COLORS.length,
          algs: items,
        });
      }
    });
  });

  const flatAlgs = groupedAlgs.flatMap((g) => g.algs);
  let globalIdxCounter = 0;

  const statBySet = groupedAlgs.reduce<Record<string, number>>((acc, b) => {
    acc[b.setName] = (acc[b.setName] ?? 0) + b.algs.length;
    return acc;
  }, {});
  const statByGroup = groupedAlgs.map((b) => ({ set: b.setName, group: b.groupName, count: b.algs.length }));

  const openModal = (index: number) => {
    setModalState({ algs: flatAlgs, index });
  };

  const filterPanelProps = {
    data,
    selectedSets,
    selectedGroups,
    onSetToggle: handleSetToggle,
    onGroupToggle: handleGroupToggle,
    onSetSelectAll: handleSetSelectAll,
    onSetDeselectAll: handleSetDeselectAll,
    onGroupSelectAll: handleGroupSelectAll,
    onGroupDeselectAll: handleGroupDeselectAll,
  };

  return (
    <div ref={topRef} style={{ padding: '16px 0', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          {dcube} - {dclassId}
        </h2>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/algs')}>
          {intl.formatMessage({ id: 'algs.detail.back' })}
        </Button>
      </div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button size="small" type="primary" icon={<FilePdfOutlined />} loading={exporting} onClick={handleExportPdf}>
            {intl.formatMessage({ id: 'algs.detail.exportPdf' })}
          </Button>
          <Button size="small" icon={<BarChartOutlined />} onClick={() => setStatModalOpen(true)}>
            {intl.formatMessage({ id: 'algs.detail.statistics' })}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
              {intl.formatMessage({ id: 'algs.detail.formulaFontSize' })}: {formulaFontSize}
            </span>
            <Slider
              min={8}
              max={32}
              value={formulaFontSize}
              onChange={(v) => {
                const n = typeof v === 'number' ? v : v[0];
                setFormulaFontSizeState(n);
                setFormulaFontSize(n);
              }}
              style={{ flex: 1, maxWidth: 180 }}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={intl.formatMessage({ id: 'algs.detail.statistics' })}
        open={statModalOpen}
        onCancel={() => setStatModalOpen(false)}
        footer={null}
        width={400}
      >
        <div className="algs-stat-modal">
          <div className="algs-stat-total">
            <Statistic
              title={intl.formatMessage({ id: 'algs.detail.statTotal' })}
              value={flatAlgs.length}
              suffix={intl.formatMessage({ id: 'algs.detail.statFormulas' })}
            />
          </div>
          <div className="algs-stat-sets">
            {Object.entries(statBySet).map(([name, count], i) => (
              <span
                key={name}
                className="algs-stat-set-chip"
                style={{ borderColor: SET_CARD_COLORS[i % SET_CARD_COLORS.length]?.border }}
              >
                {name} <em>{count}</em>
              </span>
            ))}
          </div>
          <Collapse
            size="small"
            ghost
            defaultActiveKey={Object.keys(statBySet).slice(0, 2)}
            items={Object.entries(statBySet).map(([setName]) => ({
              key: setName,
              label: (
                <span>
                  {setName} · {statBySet[setName]}{' '}
                  {intl.formatMessage({ id: 'algs.detail.statFormulas' })}
                </span>
              ),
              children: (
                <div className="algs-stat-groups">
                  {statByGroup
                    .filter((b) => b.set === setName)
                    .map((b) => (
                      <div key={`${b.set}-${b.group}`} className="algs-stat-group-row">
                        <span className="algs-stat-group-name">{b.group}</span>
                        <span className="algs-stat-group-count">{b.count}</span>
                      </div>
                    ))}
                </div>
              ),
            }))}
          />
        </div>
      </Modal>

      <Modal
        open={exporting}
        closable={false}
        maskClosable={false}
        footer={null}
        title={null}
      >
        <div className="algs-export-progress" style={{ padding: 24, textAlign: 'center', minWidth: 280 }}>
          <Progress
            type="line"
            percent={exportProgress}
            showInfo
            format={(p) => `${(p ?? 0).toFixed(1)}%`}
            status="active"
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
          />
          <div style={{ marginTop: 16, fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
            {intl.formatMessage({ id: 'algs.detail.exporting' })}
          </div>
        </div>
      </Modal>

      <div style={{ marginBottom: 16 }}>
        <AlgsFilterPanel {...filterPanelProps} />
      </div>

      <Drawer
        title={intl.formatMessage({ id: 'algs.detail.filterDrawer' })}
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        width={320}
      >
        <AlgsFilterPanel {...filterPanelProps} compact />
      </Drawer>

      <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groupedAlgs.map((block) => (
          <div key={`${block.setName}-${block.groupName}`} data-algs-group-card>
            <Card size="small" title={`${block.setName} - ${block.groupName}`} style={{ marginBottom: 0 }}>
            <Row gutter={[12, 12]}>
              {block.algs.map((item) => {
                const idx = globalIdxCounter++;
                return (
                  <Col key={`${item.setName}-${item.groupName}-${item.alg.name}`} xs={12} sm={8} md={6} lg={6} xl={4} xxl={4}>
                    <AlgsFormulaCard
                      cube={dcube}
                      classId={dclassId}
                      setName={item.setName}
                      groupName={item.groupName}
                      alg={item.alg}
                      setColorIndex={block.setColorIndex}
                      formulaFontSize={formulaFontSize}
                      onClick={() => openModal(idx)}
                    />
                  </Col>
                );
              })}
            </Row>
            </Card>
          </div>
        ))}
      </div>

      <AlgsFloatButtons onScrollTop={handleScrollTop} onOpenFilter={() => setFilterDrawerOpen(true)} />

      {modalState && (
        <AlgsModal
          open
          onClose={() => setModalState(null)}
          cube={dcube}
          classId={dclassId}
          items={modalState.algs}
          currentIndex={modalState.index}
          onNavigate={(i) => setModalState((prev) => (prev ? { ...prev, index: i } : null))}
        />
      )}
    </div>
  );
};

export default AlgsDetail;
