import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import { getAlgsSelection, setAlgsSelection, buildAlgsKey } from '../utils/storage';
import {
  getFormulaProficiency,
  setFormulaProficiency,
  type ProficiencyLevel,
} from '@/services/cubing-pro/algs/formulaPracticeProficiency';
import { buildFormulaKey } from '@/services/cubing-pro/algs/formulaPracticeSelection';
import SvgRenderer from './SvgRenderer';
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
  const item = items[currentIndex];
  const formulaKey = item ? buildFormulaKey(item.setName, item.groupName, item.alg.name) : '';
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(() =>
    item ? (getFormulaProficiency(cube, classId)[formulaKey] ?? 'average') : 'average',
  );

  useEffect(() => {
    if (item) {
      const key = buildFormulaKey(item.setName, item.groupName, item.alg.name);
      setProficiency(getFormulaProficiency(cube, classId)[key] ?? 'average');
    }
  }, [open, cube, classId, currentIndex]);

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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      title={
        <Space>
          <span>{alg.name}</span>
          {items.length > 1 && (
            <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.5)' }}>
              ({currentIndex + 1} / {items.length})
            </span>
          )}
        </Space>
      }
      styles={{ body: { paddingTop: 8 } }}
    >
      <div style={{ textAlign: 'center' }}>
        <SvgRenderer svg={alg.image} maxHeight={180} style={{ marginTop: 12, marginBottom: 20 }} />

        {currentScramble && (
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', marginBottom: 4 }}>
              {intl.formatMessage({ id: 'algs.modal.scramble' })}
            </div>
            <div
              style={{
                padding: 12,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 14,
              }}
            >
              {currentScramble}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12, textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>
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
                  background: selectedIndex === idx ? 'rgba(82, 196, 26, 0.2)' : 'rgba(240, 248, 255, 0.8)',
                  border: `2px solid ${selectedIndex === idx ? 'rgb(82, 196, 26)' : 'rgba(100, 149, 237, 0.3)'}`,
                  borderRadius: 8,
                  fontFamily: 'monospace',
                  fontSize: 16,
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
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
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
