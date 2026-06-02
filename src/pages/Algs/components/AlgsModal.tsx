import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, Modal, Popconfirm, Segmented, Select, Space, theme } from 'antd';
import { DeleteOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import {
  getAlgsSelection,
  setAlgsSelection,
  buildAlgsKey,
  getCube333ViewMode,
  setCube333ViewMode,
  getTwistyPanelTone,
  setTwistyPanelTone,
  getTwistyBottomFaceColor,
  setTwistyBottomFaceColor,
  type AlgsSelectionValue,
  type Cube333ViewMode,
  type TwistyPanelTone,
  type CubeBottomFaceColor,
} from '../utils/storage';
import {
  getFormulaProficiency,
  setFormulaProficiency,
  type ProficiencyLevel,
} from '@/services/cubing-pro/algs/formulaPracticeProficiency';
import { buildFormulaKey } from '@/services/cubing-pro/algs/formulaPracticeSelection';
import { getCustomAlgs, saveCustomAlgs } from '@/services/cubing-pro/algs/customAlgs';
import SvgRenderer from './SvgRenderer';
import AlgsTwisty333 from './AlgsTwisty333';
import { isTwisty333Cube } from '../utils/cube333';
import { resolveTwistyStickering } from '../utils/twistyStickering';
import ProficiencySelect from './ProficiencySelect';

export interface AlgsModalItem {
  alg: Algorithm;
  setName: string;
  groupName: string;
}

export interface AlgsModalProps {
  open: boolean;
  onClose: () => void;
  cube: string;
  classId: string;
  items: AlgsModalItem[];
  currentIndex: number;
  onNavigate?: (index: number) => void;
}

const AlgsModal: React.FC<AlgsModalProps> = ({
  open,
  onClose,
  cube,
  classId,
  items,
  currentIndex,
  onNavigate,
}) => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const item = items[currentIndex];
  const formulaKey = item ? buildFormulaKey(item.setName, item.groupName, item.alg.name) : '';
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(() =>
    item ? (getFormulaProficiency(cube, classId)[formulaKey] ?? 'average') : 'average',
  );
  const [cube333ViewMode, setCube333ViewModeState] = useState<Cube333ViewMode>(() => getCube333ViewMode());
  const [twistyPanelTone, setTwistyPanelToneState] = useState<TwistyPanelTone>(() => getTwistyPanelTone());
  const [twistyBottomFace, setTwistyBottomFaceState] = useState<CubeBottomFaceColor>('yellow');

  useEffect(() => {
    if (item) {
      const key = buildFormulaKey(item.setName, item.groupName, item.alg.name);
      setProficiency(getFormulaProficiency(cube, classId)[key] ?? 'average');
    }
  }, [open, cube, classId, currentIndex]);

  useEffect(() => {
    if (open && isTwisty333Cube(cube)) {
      setCube333ViewModeState(getCube333ViewMode());
      setTwistyPanelToneState(getTwistyPanelTone());
      setTwistyBottomFaceState(getTwistyBottomFaceColor(cube, classId));
    }
  }, [open, cube, classId]);

  const handleProficiencyChange = useCallback(
    (level: ProficiencyLevel) => {
      if (!formulaKey) return;
      setFormulaProficiency(cube, classId, formulaKey, level);
      setProficiency(level);
    },
    [cube, classId, formulaKey],
  );

  if (!item) return null;
  const { alg, setName, groupName } = item;

  const storageKey = buildAlgsKey(cube, classId, setName, groupName, alg.name);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selection, setSelectionState] = React.useState<AlgsSelectionValue | null>(() =>
    getAlgsSelection(storageKey),
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [customAlgs, setCustomAlgsLocal] = React.useState<string[]>(() =>
    getCustomAlgs(storageKey),
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [customInputValue, setCustomInputValue] = React.useState('');

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    const key = buildAlgsKey(cube, classId, setName, groupName, alg.name);
    setSelectionState(getAlgsSelection(key));
    setCustomAlgsLocal(getCustomAlgs(key));
    setCustomInputValue('');
  }, [cube, classId, setName, groupName, alg.name]);

  const activeTab = selection?.source ?? 'library';
  const selectedIndex = selection?.index ?? 0;
  const currentFormulas = activeTab === 'custom' ? customAlgs : alg.algs;
  const displayFormula = currentFormulas[selectedIndex] ?? currentFormulas[0] ?? '';
  const currentScramble =
    activeTab === 'library'
      ? alg.scrambles?.[selectedIndex] ?? alg.scrambles?.[0] ?? ''
      : '';
  const hasMultiple = currentFormulas.length > 1;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const updateSelection = useCallback(
    (source: 'library' | 'custom', index: number) => {
      const val: AlgsSelectionValue = { source, index };
      setSelectionState(val);
      setAlgsSelection(storageKey, val);
    },
    [storageKey],
  );

  const handleIndexChange = (idx: number) => {
    updateSelection(activeTab, idx);
  };

  const handleTabChange = (tab: string) => {
    updateSelection(tab as 'library' | 'custom', 0);
  };

  const handleAddCustom = () => {
    const val = customInputValue.trim();
    if (!val) return;
    const next = [...customAlgs, val];
    saveCustomAlgs(storageKey, next);
    setCustomAlgsLocal(next);
    setCustomInputValue('');
    updateSelection('custom', next.length - 1);
  };

  const handleDeleteCustom = (idx: number) => {
    const next = customAlgs.filter((_, i) => i !== idx);
    saveCustomAlgs(storageKey, next);
    setCustomAlgsLocal(next);
    if (next.length === 0) {
      updateSelection('library', 0);
    } else {
      const newIdx = Math.min(selectedIndex, next.length - 1);
      updateSelection('custom', newIdx);
    }
  };

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < items.length - 1;
  const showTwisty333 = isTwisty333Cube(cube);
  const twistyStickering = resolveTwistyStickering(classId, setName, groupName);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      title={
        <Space>
          <span>{alg.name}</span>
          {items.length > 1 && (
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ant-color-text-tertiary)' }}>
              ({currentIndex + 1} / {items.length})
            </span>
          )}
        </Space>
      }
      styles={{ body: { paddingTop: 8 } }}
    >
      <div style={{ textAlign: 'center' }}>
        {showTwisty333 ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <Space wrap align="center" size={[8, 8]}>
                <Button
                  size="small"
                  onClick={() => {
                    const next: Cube333ViewMode = cube333ViewMode === '2d' ? '3d' : '2d';
                    setCube333ViewModeState(next);
                    setCube333ViewMode(next);
                  }}
                >
                  {cube333ViewMode === '2d'
                    ? intl.formatMessage({ id: 'algs.detail.switchTo3d' })
                    : intl.formatMessage({ id: 'algs.detail.switchTo2d' })}
                </Button>
                <Space size={4} align="center">
                  <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {intl.formatMessage({ id: 'algs.twisty.backgroundColor.label' })}
                  </span>
                  <Select<TwistyPanelTone>
                    size="small"
                    style={{ minWidth: 112 }}
                    value={twistyPanelTone}
                    onChange={(v) => {
                      setTwistyPanelToneState(v);
                      setTwistyPanelTone(v);
                    }}
                    options={(['cream', 'lightBlue', 'white', 'neutral'] as const).map((v) => ({
                      value: v,
                      label: intl.formatMessage({ id: `algs.twisty.backgroundColor.${v}` }),
                    }))}
                  />
                </Space>
                <Space size={4} align="center">
                  <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {intl.formatMessage({ id: 'algs.twisty.bottomFace.label' })}
                  </span>
                  <Select<CubeBottomFaceColor>
                    size="small"
                    style={{ minWidth: 88 }}
                    value={twistyBottomFace}
                    onChange={(v) => {
                      setTwistyBottomFaceState(v);
                      setTwistyBottomFaceColor(cube, classId, v);
                    }}
                    options={(
                      ['yellow', 'white', 'red', 'orange', 'green', 'blue'] as const
                    ).map((v) => ({
                      value: v,
                      label: intl.formatMessage({ id: `algs.twisty.bottomFace.${v}` }),
                    }))}
                  />
                </Space>
              </Space>
            </div>
            <AlgsTwisty333
              alg={displayFormula}
              viewMode={cube333ViewMode}
              experimentalStickering={twistyStickering}
              panelTone={twistyPanelTone}
              bottomFaceColor={twistyBottomFace}
              style={{ marginTop: 0, marginBottom: 20 }}
            />
          </>
        ) : (
          <SvgRenderer svg={alg.image} maxHeight={180} style={{ marginTop: 12, marginBottom: 20 }} />
        )}

        {currentScramble && (
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>
              {intl.formatMessage({ id: 'algs.modal.scramble' })}
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 14,
                color: 'var(--ant-color-text)',
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              {currentScramble}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
              {intl.formatMessage({ id: 'algs.modal.formulaList' })}
            </span>
            <Segmented
              size="small"
              options={[
                { label: intl.formatMessage({ id: 'algs.modal.library' }), value: 'library' },
                { label: intl.formatMessage({ id: 'algs.modal.custom' }), value: 'custom' },
              ]}
              value={activeTab}
              onChange={handleTabChange}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: currentFormulas.length > 5 ? 280 : undefined,
              overflowY: currentFormulas.length > 5 ? 'auto' : undefined,
            }}
          >
            {activeTab === 'library'
              ? alg.algs.map((formula, idx) => (
                  <div
                    key={idx}
                    onClick={() => hasMultiple && handleIndexChange(idx)}
                    style={{
                      padding: 12,
                      background:
                        selectedIndex === idx ? 'rgba(82, 196, 26, 0.2)' : token.colorPrimaryBg,
                      border: `2px solid ${
                        selectedIndex === idx ? 'rgb(82, 196, 26)' : token.colorPrimaryBorder
                      }`,
                      borderRadius: 8,
                      fontFamily: 'monospace',
                      fontSize: 16,
                      color: 'var(--ant-color-text)',
                      cursor: hasMultiple ? 'pointer' : 'default',
                      whiteSpace: 'normal',
                      wordBreak: 'break-all',
                    }}
                  >
                    {formula}
                  </div>
                ))
              : customAlgs.length === 0
                ? (
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
                  )
                : (
                    customAlgs.map((formula, idx) => (
                      <div
                        key={idx}
                        onClick={() => customAlgs.length > 1 && handleIndexChange(idx)}
                        style={{
                          padding: 12,
                          background:
                            selectedIndex === idx ? 'rgba(82, 196, 26, 0.2)' : token.colorPrimaryBg,
                          border: `2px solid ${
                            selectedIndex === idx ? 'rgb(82, 196, 26)' : token.colorPrimaryBorder
                          }`,
                          borderRadius: 8,
                          fontFamily: 'monospace',
                          fontSize: 16,
                          color: 'var(--ant-color-text)',
                          cursor: customAlgs.length > 1 ? 'pointer' : 'default',
                          whiteSpace: 'normal',
                          wordBreak: 'break-all',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ flex: 1 }}>{formula}</span>
                        <Popconfirm
                          title={intl.formatMessage({ id: 'algs.modal.deleteCustomConfirm' })}
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteCustom(idx);
                          }}
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
          {activeTab === 'custom' && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Input
                size="small"
                placeholder={intl.formatMessage({ id: 'algs.modal.addCustomPlaceholder' })}
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                onPressEnter={handleAddCustom}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
              <Button size="small" icon={<PlusOutlined />} onClick={handleAddCustom}>
                {intl.formatMessage({ id: 'algs.modal.addCustom' })}
              </Button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
            {intl.formatMessage({ id: 'algs.proficiencyCard.title' })}:
          </span>
          <ProficiencySelect value={proficiency} onChange={handleProficiencyChange} size="small" />
        </div>

        <Space style={{ marginTop: 20, width: '100%', justifyContent: 'space-between' }}>
          <Button
            icon={<LeftOutlined />}
            disabled={!canPrev}
            onClick={() => onNavigate?.(currentIndex - 1)}
          >
            {intl.formatMessage({ id: 'algs.modal.prev' })}
          </Button>
          <Button type="primary" onClick={onClose}>
            {intl.formatMessage({ id: 'algs.modal.close' })}
          </Button>
          <Button
            icon={<RightOutlined />}
            disabled={!canNext}
            onClick={() => onNavigate?.(currentIndex + 1)}
          >
            {intl.formatMessage({ id: 'algs.modal.next' })}
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default AlgsModal;
