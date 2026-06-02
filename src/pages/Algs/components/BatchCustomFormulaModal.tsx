import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Input, message, Modal, Popconfirm, Progress, Space, theme } from 'antd';
import { DeleteOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import { getCustomAlgs, saveCustomAlgs } from '@/services/cubing-pro/algs/customAlgs';
import { buildAlgsKey } from '../utils/storage';
import AlgsCubeDiagram from './AlgsCubeDiagram';
import type { FormulaItem } from './FormulaRandomPickCard';
import { getFormulaFontFamilyCSSValue, type FormulaFontFamilyId } from '../utils/formulaFontFamily';
import './BatchCustomFormulaModal.less';

type Step = 'selectSets' | 'fill';

export interface BatchCustomFormulaModalProps {
  open: boolean;
  onClose: () => void;
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  useVisualCube?: boolean;
  formulaFontFamily?: FormulaFontFamilyId;
}

function hasCustomFormula(cube: string, classId: string, item: FormulaItem): boolean {
  const key = buildAlgsKey(cube, classId, item.setName, item.groupName, item.alg.name);
  return getCustomAlgs(key).length > 0;
}

const BatchCustomFormulaModal: React.FC<BatchCustomFormulaModalProps> = ({
  open,
  onClose,
  cube,
  classId,
  flatAlgs,
  useVisualCube = true,
  formulaFontFamily,
}) => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const formulaFontCss = getFormulaFontFamilyCSSValue(formulaFontFamily);

  const setNames = useMemo(() => {
    const names = new Set<string>();
    flatAlgs.forEach((f) => names.add(f.setName));
    return Array.from(names);
  }, [flatAlgs]);

  const [step, setStep] = useState<Step>('selectSets');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [hideFilled, setHideFilled] = useState(true);
  const [queue, setQueue] = useState<FormulaItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [customAlgs, setCustomAlgsLocal] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [previewLibraryIdx, setPreviewLibraryIdx] = useState(0);

  const resetState = useCallback(() => {
    setStep('selectSets');
    setSelectedSets(setNames);
    setHideFilled(true);
    setQueue([]);
    setCurrentIdx(0);
    setCustomAlgsLocal([]);
    setCustomInput('');
    setPreviewLibraryIdx(0);
  }, [setNames]);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  const setStats = useMemo(() => {
    const map = new Map<string, { total: number; filled: number }>();
    for (const name of setNames) {
      map.set(name, { total: 0, filled: 0 });
    }
    for (const item of flatAlgs) {
      const stat = map.get(item.setName);
      if (!stat) continue;
      stat.total += 1;
      if (hasCustomFormula(cube, classId, item)) stat.filled += 1;
    }
    return map;
  }, [flatAlgs, setNames, cube, classId]);

  const pendingCountForSets = useCallback(
    (sets: string[], excludeFilled: boolean) => {
      return flatAlgs.filter((item) => {
        if (!sets.includes(item.setName)) return false;
        if (excludeFilled && hasCustomFormula(cube, classId, item)) return false;
        return true;
      }).length;
    },
    [flatAlgs, cube, classId],
  );

  const previewPending = pendingCountForSets(selectedSets, hideFilled);

  const handleSetToggle = (name: string) => {
    setSelectedSets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const handleSelectAllSets = () => setSelectedSets([...setNames]);
  const handleDeselectAllSets = () => setSelectedSets([]);

  const buildQueue = useCallback(() => {
    return flatAlgs.filter((item) => {
      if (!selectedSets.includes(item.setName)) return false;
      if (hideFilled && hasCustomFormula(cube, classId, item)) return false;
      return true;
    });
  }, [flatAlgs, selectedSets, hideFilled, cube, classId]);

  const handleStartFill = () => {
    const nextQueue = buildQueue();
    if (nextQueue.length === 0) return;
    setQueue(nextQueue);
    setCurrentIdx(0);
    setStep('fill');
  };

  const currentItem = queue[currentIdx];
  const storageKey = currentItem
    ? buildAlgsKey(cube, classId, currentItem.setName, currentItem.groupName, currentItem.alg.name)
    : '';

  useEffect(() => {
    if (!currentItem || step !== 'fill') return;
    const key = buildAlgsKey(cube, classId, currentItem.setName, currentItem.groupName, currentItem.alg.name);
    setCustomAlgsLocal(getCustomAlgs(key));
    setCustomInput('');
    setPreviewLibraryIdx(0);
  }, [currentItem, step, cube, classId, currentIdx]);

  const goNext = useCallback(() => {
    setCurrentIdx((i) => {
      if (i >= queue.length - 1) return i;
      return i + 1;
    });
  }, [queue.length]);

  const goPrev = () => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  };

  const persistCustom = useCallback(
    (formulas: string[], advance: boolean) => {
      if (!storageKey) return;
      saveCustomAlgs(storageKey, formulas);
      setCustomAlgsLocal(formulas);
      if (advance) {
        if (currentIdx >= queue.length - 1) {
          message.success(intl.formatMessage({ id: 'algs.batchCustom.allDone' }));
          setStep('selectSets');
          setQueue([]);
          setCurrentIdx(0);
        } else {
          goNext();
        }
      }
    },
    [storageKey, currentIdx, queue.length, goNext, intl],
  );

  const handleAddCustom = (advance = true) => {
    const val = customInput.trim();
    if (!val) return;
    const next = [...customAlgs, val];
    persistCustom(next, advance);
    setCustomInput('');
  };

  const handlePreviewLibrary = (idx: number) => {
    setPreviewLibraryIdx(idx);
  };

  const handleAdoptLibrary = (formula: string, idx: number) => {
    setPreviewLibraryIdx(idx);
    if (customAlgs.includes(formula)) return;
    const next = [...customAlgs, formula];
    persistCustom(next, true);
  };

  const handleDeleteCustom = (idx: number) => {
    const next = customAlgs.filter((_, i) => i !== idx);
    persistCustom(next, false);
  };

  const handleBackToSelect = () => {
    setStep('selectSets');
    setQueue([]);
    setCurrentIdx(0);
  };

  const defaultScramble = currentItem?.alg.scrambles?.[0] ?? '';
  const selectedLibraryFormula =
    currentItem?.alg.algs[previewLibraryIdx] ?? currentItem?.alg.algs[0] ?? '';

  const renderSetSelect = () => (
  <div className="batch-custom-set-select">
      <Checkbox
        checked={hideFilled}
        onChange={(e) => setHideFilled(e.target.checked)}
        style={{ marginBottom: 12 }}
      >
        {intl.formatMessage({ id: 'algs.batchCustom.hideFilled' })}
      </Checkbox>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <Button size="small" onClick={handleSelectAllSets}>
          {intl.formatMessage({ id: 'algs.detail.selectAll' })}
        </Button>
        <Button size="small" onClick={handleDeselectAllSets}>
          {intl.formatMessage({ id: 'algs.detail.deselectAll' })}
        </Button>
      </div>
      <div className="batch-custom-set-list">
        {setNames.map((name) => {
          const stat = setStats.get(name) ?? { total: 0, filled: 0 };
          const pending = flatAlgs.filter((item) => {
            if (item.setName !== name) return false;
            return !(hideFilled && hasCustomFormula(cube, classId, item));
          }).length;
          return (
            <label key={name} className="batch-custom-set-row">
              <Checkbox
                checked={selectedSets.includes(name)}
                onChange={() => handleSetToggle(name)}
              >
                <span>{name}</span>
                <span className="batch-custom-set-meta">
                  {intl.formatMessage(
                    { id: 'algs.batchCustom.setProgress' },
                    { pending, total: stat.total, filled: stat.filled },
                  )}
                </span>
              </Checkbox>
            </label>
          );
        })}
      </div>
      <div style={{ marginTop: 16, color: 'var(--ant-color-text-secondary)', fontSize: 13 }}>
        {intl.formatMessage(
          { id: 'algs.batchCustom.pendingCount' },
          { count: previewPending },
        )}
      </div>
    </div>
  );

  const renderFill = () => {
    if (!currentItem) {
      return (
        <div style={{ textAlign: 'center', padding: 24 }}>
          {intl.formatMessage({ id: 'algs.batchCustom.allDone' })}
        </div>
      );
    }

    const { alg, setName, groupName } = currentItem;
    const progressPercent = queue.length > 0 ? Math.round(((currentIdx + 1) / queue.length) * 100) : 0;

    return (
      <>
        <Progress percent={progressPercent} size="small" showInfo={false} style={{ marginBottom: 12 }} />
        <div className="batch-custom-fill-top">
          <div className="batch-custom-fill-name">{alg.name}</div>
          <div className="batch-custom-fill-meta">
            {setName} · {groupName} · {currentIdx + 1} / {queue.length}
          </div>
          <AlgsCubeDiagram
            cube={cube}
            classId={classId}
            setName={setName}
            groupName={groupName}
            imageSvg={alg.image}
            scramble={defaultScramble}
            formula=""
            useVisualCube={useVisualCube}
            maxWidth={260}
            maxHeight={260}
          />
        </div>

        <div className="batch-custom-fill-bottom">
          <div className="batch-custom-column">
            <div className="batch-custom-column-title">
              {intl.formatMessage({ id: 'algs.modal.library' })}
            </div>
            <div className="batch-custom-formula-list">
              {alg.algs.map((formula, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  className={`batch-custom-formula-item${
                    previewLibraryIdx === idx ? ' batch-custom-formula-item--selected' : ''
                  }`}
                  style={{ fontFamily: formulaFontCss }}
                  onClick={() => handlePreviewLibrary(idx)}
                  onDoubleClick={() => handleAdoptLibrary(formula, idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAdoptLibrary(formula, idx);
                    }
                  }}
                >
                  {formula}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                size="small"
                type="primary"
                disabled={!selectedLibraryFormula || customAlgs.includes(selectedLibraryFormula)}
                onClick={() => handleAdoptLibrary(selectedLibraryFormula, previewLibraryIdx)}
              >
                {intl.formatMessage({ id: 'algs.batchCustom.adoptSelected' })}
              </Button>
              <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}>
                {intl.formatMessage({ id: 'algs.batchCustom.adoptHint' })}
              </span>
            </div>
          </div>

          <div className="batch-custom-column">
            <div className="batch-custom-column-title">
              {intl.formatMessage({ id: 'algs.modal.custom' })}
            </div>
            <div className="batch-custom-formula-list">
              {customAlgs.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    color: 'var(--ant-color-text-tertiary)',
                    fontSize: 13,
                  }}
                >
                  {intl.formatMessage({ id: 'algs.modal.noCustomAlgs' })}
                </div>
              ) : (
                customAlgs.map((formula, idx) => (
                  <div
                    key={idx}
                    className="batch-custom-formula-item batch-custom-formula-item--custom"
                    style={{
                      fontFamily: formulaFontCss,
                      borderColor: token.colorPrimaryBorder,
                      background: token.colorPrimaryBg,
                    }}
                  >
                    <span style={{ flex: 1 }}>{formula}</span>
                    <Popconfirm
                      title={intl.formatMessage({ id: 'algs.modal.deleteCustomConfirm' })}
                      onConfirm={() => handleDeleteCustom(idx)}
                      okButtonProps={{ size: 'small' }}
                      cancelButtonProps={{ size: 'small' }}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>
                ))
              )}
            </div>
            <div className="batch-custom-add-row">
              <Input
                size="small"
                placeholder={intl.formatMessage({ id: 'algs.modal.addCustomPlaceholder' })}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onPressEnter={() => handleAddCustom(true)}
                style={{ flex: 1, fontFamily: formulaFontCss }}
              />
              <Button size="small" icon={<PlusOutlined />} onClick={() => handleAddCustom(true)}>
                {intl.formatMessage({ id: 'algs.modal.addCustom' })}
              </Button>
            </div>
          </div>
        </div>

        <div className="batch-custom-footer">
          <Space>
            <Button size="small" onClick={handleBackToSelect}>
              {intl.formatMessage({ id: 'algs.batchCustom.backToSets' })}
            </Button>
            <Button icon={<LeftOutlined />} disabled={currentIdx <= 0} onClick={goPrev}>
              {intl.formatMessage({ id: 'algs.modal.prev' })}
            </Button>
          </Space>
          <Space>
            <Button onClick={goNext} disabled={currentIdx >= queue.length - 1}>
              {intl.formatMessage({ id: 'algs.batchCustom.skip' })}
            </Button>
            <Button
              type="primary"
              icon={<RightOutlined />}
              disabled={currentIdx >= queue.length - 1}
              onClick={goNext}
            >
              {intl.formatMessage({ id: 'algs.modal.next' })}
            </Button>
          </Space>
        </div>
      </>
    );
  };

  const modalTitle =
    step === 'selectSets'
      ? intl.formatMessage({ id: 'algs.batchCustom.selectSetsTitle' })
      : intl.formatMessage({ id: 'algs.batchCustom.fillTitle' });

  const modalFooter =
    step === 'selectSets' ? (
      <Space>
        <Button onClick={onClose}>{intl.formatMessage({ id: 'algs.modal.close' })}</Button>
        <Button type="primary" disabled={previewPending === 0} onClick={handleStartFill}>
          {intl.formatMessage({ id: 'algs.batchCustom.startFill' })}
        </Button>
      </Space>
    ) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={modalTitle}
      footer={modalFooter}
      width={step === 'fill' ? 820 : 520}
      destroyOnClose
      className="batch-custom-formula-modal"
      styles={{ body: { paddingTop: 8 } }}
    >
      {step === 'selectSets' ? renderSetSelect() : renderFill()}
    </Modal>
  );
};

export default BatchCustomFormulaModal;
