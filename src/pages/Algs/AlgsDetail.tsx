import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Collapse, Drawer, Modal, Progress, Spin, Statistic } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import { useNavigate, useParams } from '@@/exports';
import { getAlgCubeClass } from '@/services/cubing-pro/algs/algs';
import { buildFormulaKey, buildGroupKey } from '@/services/cubing-pro/algs/formulaPracticeSelection';
import type { AlgorithmClass, Algorithm } from '@/services/cubing-pro/algs/typings';
import { exportAlgsPdf } from './utils/pdfExport';
import AlgsModal from './components/AlgsModal';
import AlgsFormulaCard from './components/AlgsFormulaCard';
import AlgsFormulaCardWide from './components/AlgsFormulaCardWide';
import AlgsFilterPanel from './components/AlgsFilterPanel';
import AlgsFloatButtons from './components/AlgsFloatButtons';
import AlgsPageSettingsPanel from './components/AlgsPageSettingsPanel';
import FormulaRandomPickModal from './components/FormulaRandomPickModal';
import AlgsPracticeToolsPanel from './components/AlgsPracticeToolsPanel';
import UsageInstructionsModal from './components/UsageInstructionsModal';
import FormulaPracticeModal from './components/FormulaPracticeModal';
import BatchCustomFormulaModal from './components/BatchCustomFormulaModal';
import {
  getFormulaFontFamily,
  setFormulaFontFamily,
  type FormulaFontFamilyId,
} from './utils/formulaFontFamily';
import {
  getFormulaFontSize,
  setFormulaFontSize,
  getUseVisualCubeRenderer,
  setUseVisualCubeRenderer,
  getColumnsPerRow,
  setColumnsPerRow,
  getHideAltFormulas,
  setHideAltFormulas,
  getHiddenFormulaKeys,
  setHiddenFormulaKeys,
} from './utils/storage';
import { collectVisibleFormulaKeys } from './utils/algsFormulaFilter';
import { isVisualCubeCube } from './utils/visualCubeCube';
import { SET_CARD_COLORS } from './constants';
import './index.less';

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
  const [hiddenFormulaKeys, setHiddenFormulaKeysState] = useState<string[]>([]);
  const [filterPanelExpanded, setFilterPanelExpanded] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [formulaFontSize, setFormulaFontSizeState] = useState(() => getFormulaFontSize());
  const [formulaFontFamily, setFormulaFontFamilyState] = useState<FormulaFontFamilyId>(() =>
    getFormulaFontFamily(),
  );
  const [statModalOpen, setStatModalOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    algs: Array<{ alg: Algorithm; setName: string; groupName: string }>;
    index: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [formulaRandomModalOpen, setFormulaRandomModalOpen] = useState(false);
  const [formulaRandomModalMode, setFormulaRandomModalMode] = useState<'random' | 'history'>('random');
  const [formulaRandomRefreshKey, setFormulaRandomRefreshKey] = useState(0);
  const [unskilledRefreshKey, setUnskilledRefreshKey] = useState(0);
  const [usageInstructionsOpen, setUsageInstructionsOpen] = useState(false);
  const [formulaPracticeOpen, setFormulaPracticeOpen] = useState(false);
  const [batchCustomOpen, setBatchCustomOpen] = useState(false);
  const [useVisualCube, setUseVisualCube] = useState(() => getUseVisualCubeRenderer());
  const [columnsPerRow, setColumnsPerRowState] = useState(4);
  const [hideAltFormulas, setHideAltFormulasState] = useState(false);

  useEffect(() => {
    if (!cube || !classId) return;
    const dc = decodeURIComponent(cube);
    const cl = decodeURIComponent(classId);
    setColumnsPerRowState(getColumnsPerRow(dc, cl));
    setHideAltFormulasState(getHideAltFormulas(dc, cl));
  }, [cube, classId]);

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
        const dc = decodeURIComponent(cube);
        const cl = decodeURIComponent(classId);
        const savedHidden = getHiddenFormulaKeys(dc, cl);
        const validKeys = new Set(
          collectVisibleFormulaKeys(d, keys, allGroups),
        );
        setHiddenFormulaKeysState(savedHidden.filter((k) => validKeys.has(k)));
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

  const persistHiddenFormulas = (keys: string[]) => {
    if (!cube || !classId) return;
    setHiddenFormulaKeys(decodeURIComponent(cube), decodeURIComponent(classId), keys);
  };

  const handleFormulaToggle = (key: string) => {
    setHiddenFormulaKeysState((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      persistHiddenFormulas(next);
      return next;
    });
  };

  const handleFormulaSelectAll = () => {
    if (!data) return;
    const scope = collectVisibleFormulaKeys(data, selectedSets, selectedGroups);
    setHiddenFormulaKeysState((prev) => {
      const scopeSet = new Set(scope);
      const next = prev.filter((k) => !scopeSet.has(k));
      persistHiddenFormulas(next);
      return next;
    });
  };

  const handleFormulaDeselectAll = () => {
    if (!data) return;
    const scope = collectVisibleFormulaKeys(data, selectedSets, selectedGroups);
    setHiddenFormulaKeysState((prev) => {
      const next = [...new Set([...prev, ...scope])];
      persistHiddenFormulas(next);
      return next;
    });
  };

  const hiddenFormulaSet = new Set(hiddenFormulaKeys);

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
      const items = (group?.algs ?? [])
        .map((alg) => ({ alg, setName: set.name, groupName: gName }))
        .filter(
          (item) =>
            !hiddenFormulaSet.has(buildFormulaKey(item.setName, item.groupName, item.alg.name)),
        );
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
    hiddenFormulaKeys,
    onSetToggle: handleSetToggle,
    onGroupToggle: handleGroupToggle,
    onFormulaToggle: handleFormulaToggle,
    onSetSelectAll: handleSetSelectAll,
    onSetDeselectAll: handleSetDeselectAll,
    onGroupSelectAll: handleGroupSelectAll,
    onGroupDeselectAll: handleGroupDeselectAll,
    onFormulaSelectAll: handleFormulaSelectAll,
    onFormulaDeselectAll: handleFormulaDeselectAll,
  };

  return (
    <div ref={topRef} className="algs-page-container" style={{ padding: '16px 0', minHeight: '100vh' }}>
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
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="small" type="primary" icon={<FilePdfOutlined />} loading={exporting} onClick={handleExportPdf}>
          {intl.formatMessage({ id: 'algs.detail.exportPdf' })}
        </Button>
        <Button size="small" icon={<BarChartOutlined />} onClick={() => setStatModalOpen(true)}>
          {intl.formatMessage({ id: 'algs.detail.statistics' })}
        </Button>
      </div>

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
          <div style={{ marginTop: 16, fontSize: 14, color: 'var(--ant-color-text-secondary)' }}>
            {intl.formatMessage({ id: 'algs.detail.exporting' })}
          </div>
        </div>
      </Modal>

      <Collapse
        style={{ marginBottom: 16 }}
        activeKey={filterPanelExpanded}
        onChange={(keys) => setFilterPanelExpanded(keys as string[])}
        items={[
          {
            key: 'filter',
            label: intl.formatMessage({ id: 'algs.detail.filterPanel' }),
            children: <AlgsFilterPanel {...filterPanelProps} />,
          },
        ]}
      />

      {flatAlgs.length > 0 && (
        <AlgsPracticeToolsPanel
          cube={dcube}
          classId={dclassId}
          flatAlgs={flatAlgs}
          showRandomPick={flatAlgs.length >= 8}
          formulaRandomRefreshKey={formulaRandomRefreshKey}
          unskilledRefreshKey={unskilledRefreshKey}
          onOpenRandom={() => {
            setFormulaRandomModalMode('random');
            setFormulaRandomModalOpen(true);
          }}
          onOpenHistory={() => {
            setFormulaRandomModalMode('history');
            setFormulaRandomModalOpen(true);
          }}
          onPickFormula={openModal}
          onOpenFormulaPractice={() => setFormulaPracticeOpen(true)}
          onOpenBatchCustom={() => setBatchCustomOpen(true)}
        />
      )}

      <FormulaRandomPickModal
        open={formulaRandomModalOpen}
        onClose={() => setFormulaRandomModalOpen(false)}
        mode={formulaRandomModalMode}
        cube={dcube}
        classId={dclassId}
        flatAlgs={flatAlgs}
        onPickFormula={openModal}
        onPickSuccess={() => setFormulaRandomRefreshKey((k) => k + 1)}
      />

      <UsageInstructionsModal
        open={usageInstructionsOpen}
        onClose={() => setUsageInstructionsOpen(false)}
      />

      <FormulaPracticeModal
        open={formulaPracticeOpen}
        onClose={() => {
          setFormulaPracticeOpen(false);
          setUnskilledRefreshKey((k) => k + 1);
        }}
        cube={dcube}
        classId={dclassId}
        flatAlgs={flatAlgs}
      />

      <BatchCustomFormulaModal
        open={batchCustomOpen}
        onClose={() => setBatchCustomOpen(false)}
        cube={dcube}
        classId={dclassId}
        flatAlgs={flatAlgs}
        useVisualCube={useVisualCube}
        formulaFontFamily={formulaFontFamily}
      />

      <Drawer
        title={intl.formatMessage({ id: 'algs.detail.filterDrawer' })}
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        width={520}
        styles={{ body: { paddingTop: 12 } }}
      >
        <AlgsFilterPanel {...filterPanelProps} compact drawerMode />
      </Drawer>

      <Drawer
        title={intl.formatMessage({ id: 'algs.detail.pageSettings' })}
        placement="right"
        onClose={() => setPageSettingsOpen(false)}
        open={pageSettingsOpen}
        width={360}
        styles={{ body: { paddingTop: 8 } }}
      >
        <AlgsPageSettingsPanel
          formulaFontSize={formulaFontSize}
          onFormulaFontSizeChange={(n) => {
            setFormulaFontSizeState(n);
            setFormulaFontSize(n);
          }}
          formulaFontFamily={formulaFontFamily}
          onFormulaFontFamilyChange={(id) => {
            setFormulaFontFamilyState(id);
            setFormulaFontFamily(id);
          }}
          columnsPerRow={columnsPerRow}
          onColumnsPerRowChange={(n) => {
            setColumnsPerRowState(n);
            setColumnsPerRow(dcube, dclassId, n);
          }}
          showVisualCubeSwitch={isVisualCubeCube(dcube)}
          useVisualCube={useVisualCube}
          onUseVisualCubeChange={(checked) => {
            setUseVisualCube(checked);
            setUseVisualCubeRenderer(checked);
          }}
          showHideAltFormulas={columnsPerRow === 1}
          hideAltFormulas={hideAltFormulas}
          onHideAltFormulasChange={(checked) => {
            setHideAltFormulasState(checked);
            setHideAltFormulas(dcube, dclassId, checked);
          }}
        />
      </Drawer>

      <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groupedAlgs.map((block) => (
          <div key={`${block.setName}-${block.groupName}`} data-algs-group-card>
            <Card size="small" title={`${block.setName} - ${block.groupName}`} style={{ marginBottom: 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                gap: 12,
              }}
            >
              {block.algs.map((item) => {
                const idx = globalIdxCounter++;
                const cardKey = `${item.setName}-${item.groupName}-${item.alg.name}`;
                if (columnsPerRow === 1) {
                  return (
                    <AlgsFormulaCardWide
                      key={cardKey}
                      cube={dcube}
                      classId={dclassId}
                      setName={item.setName}
                      groupName={item.groupName}
                      alg={item.alg}
                      setColorIndex={block.setColorIndex}
                      formulaFontSize={formulaFontSize}
                      formulaFontFamily={formulaFontFamily}
                      useVisualCube={useVisualCube}
                      hideAltFormulas={hideAltFormulas}
                      onOpenModal={() => openModal(idx)}
                    />
                  );
                }
                return (
                  <AlgsFormulaCard
                    key={cardKey}
                    cube={dcube}
                    classId={dclassId}
                    setName={item.setName}
                    groupName={item.groupName}
                    alg={item.alg}
                    setColorIndex={block.setColorIndex}
                    formulaFontSize={formulaFontSize}
                    formulaFontFamily={formulaFontFamily}
                    useVisualCube={useVisualCube}
                    onClick={() => openModal(idx)}
                  />
                );
              })}
            </div>
            </Card>
          </div>
        ))}
      </div>

      <AlgsFloatButtons
        onScrollTop={handleScrollTop}
        onOpenFilter={() => setFilterDrawerOpen(true)}
        onOpenPageSettings={() => setPageSettingsOpen(true)}
        onOpenUsageInstructions={() => setUsageInstructionsOpen(true)}
        onOpenFormulaPractice={flatAlgs.length > 0 ? () => setFormulaPracticeOpen(true) : undefined}
      />

      {modalState && (
        <AlgsModal
          open
          onClose={() => setModalState(null)}
          cube={dcube}
          classId={dclassId}
          items={modalState.algs}
          currentIndex={modalState.index}
          useVisualCube={useVisualCube}
          formulaFontFamily={formulaFontFamily}
          onNavigate={(i) => setModalState((prev) => (prev ? { ...prev, index: i } : null))}
        />
      )}
    </div>
  );
};

export default AlgsDetail;
