import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Select, Space, theme } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
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
  const savedIndex = getAlgsSelection(storageKey);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedIndex, setSelectedIndex] = React.useState(savedIndex ?? 0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    const saved = getAlgsSelection(buildAlgsKey(cube, classId, setName, groupName, alg.name));
    setSelectedIndex(saved ?? 0);
  }, [cube, classId, setName, groupName, alg.name]);
  const currentScramble = alg.scrambles?.[selectedIndex] ?? alg.scrambles?.[0] ?? '';
  const hasMultiple = alg.algs.length > 1;

  const handleIndexChange = (idx: number) => {
    setSelectedIndex(idx);
    setAlgsSelection(storageKey, idx);
  };

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < items.length - 1;
  const showTwisty333 = isTwisty333Cube(cube);
  const displayFormula = alg.algs[selectedIndex] ?? alg.algs[0] ?? '';
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
                /* 恢复浅底 + 内阴影的「凹陷」层次，避免仅 fill-quaternary 发灰无纵深 */
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
          <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 8 }}>
            {intl.formatMessage({ id: 'algs.modal.formulaList' })}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: alg.algs.length > 5 ? 280 : undefined,
              overflowY: alg.algs.length > 5 ? 'auto' : undefined,
            }}
          >
            {alg.algs.map((formula, idx) => (
              <div
                key={idx}
                onClick={() => hasMultiple && handleIndexChange(idx)}
                style={{
                  padding: 12,
                  /* 选中：绿色；未选中：用 token 主色浅底/边框，深色模式下不会过亮 */
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
            ))}
          </div>
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
