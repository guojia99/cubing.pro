import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Collapse, Modal } from 'antd';
import { FlagOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import {
  getFormulaProficiency,
  setFormulaProficiency,
  type ProficiencyLevel,
} from '@/services/cubing-pro/algs/formulaPracticeProficiency';
import { buildFormulaKey } from '@/services/cubing-pro/algs/formulaPracticeSelection';
import SvgRenderer from './SvgRenderer';
import ProficiencySelect from './ProficiencySelect';
import { ALGS_COLORS } from '../constants';
import '../index.less';

export interface FormulaItem {
  alg: Algorithm;
  setName: string;
  groupName: string;
}

interface FormulaProficiencyCardProps {
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
  onOpenFormulaPractice?: () => void;
  refreshKey?: number;
  embedded?: boolean;
}

const FormulaProficiencyCard: React.FC<FormulaProficiencyCardProps> = ({
  cube,
  classId,
  flatAlgs,
  onOpenFormulaPractice,
  refreshKey = 0,
  embedded = false,
}) => {
  const intl = useIntl();
  const [modalOpen, setModalOpen] = useState(false);
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, ProficiencyLevel>>(() =>
    getFormulaProficiency(cube, classId),
  );

  useEffect(() => {
    setProficiencyMap(getFormulaProficiency(cube, classId));
  }, [cube, classId, refreshKey]);

  const refreshProficiency = useCallback(() => {
    setProficiencyMap(getFormulaProficiency(cube, classId));
  }, [cube, classId]);

  const handleProficiencyChange = useCallback(
    (formulaKey: string, level: ProficiencyLevel) => {
      setFormulaProficiency(cube, classId, formulaKey, level);
      setProficiencyMap((prev) => ({ ...prev, [formulaKey]: level }));
    },
    [cube, classId],
  );

  const markedCount = useMemo(() => {
    return Object.keys(proficiencyMap).filter((key) =>
      flatAlgs.some((f) => buildFormulaKey(f.setName, f.groupName, f.alg.name) === key),
    ).length;
  }, [proficiencyMap, flatAlgs]);

  const groupedBySetAndGroup = useMemo(() => {
    const map: Record<string, Record<string, FormulaItem[]>> = {};
    for (const item of flatAlgs) {
      if (!map[item.setName]) map[item.setName] = {};
      if (!map[item.setName][item.groupName]) map[item.setName][item.groupName] = [];
      map[item.setName][item.groupName].push(item);
    }
    return map;
  }, [flatAlgs]);

  const collapseItems = useMemo(() => {
    return Object.entries(groupedBySetAndGroup).map(([setName, groups]) => ({
      key: setName,
      label: (
        <span>
          {intl.formatMessage({ id: 'algs.detail.set' })}: {setName}
        </span>
      ),
      children: (
        <Collapse
          size="small"
          ghost
          defaultActiveKey={Object.keys(groups).map((gn) => `${setName}-${gn}`)}
          items={Object.entries(groups).map(([groupName, items]) => ({
            key: `${setName}-${groupName}`,
            label: (
              <span>
                {intl.formatMessage({ id: 'algs.detail.group' })}: {groupName} ({items.length})
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                {items.map((item) => {
                  const key = buildFormulaKey(item.setName, item.groupName, item.alg.name);
                  const level = proficiencyMap[key] ?? 'average';
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 12px',
                        background: 'var(--ant-color-fill-quaternary)',
                        borderRadius: 8,
                      }}
                    >
                      <SvgRenderer svg={item.alg.image ?? ''} maxWidth={40} maxHeight={56} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--ant-color-text)' }}>
                          {item.alg.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)' }}>
                          {item.setName} · {item.groupName}
                        </div>
                      </div>
                      <ProficiencySelect
                        value={level}
                        onChange={(v) => handleProficiencyChange(key, v)}
                        size="small"
                      />
                    </div>
                  );
                })}
              </div>
            ),
          }))}
        />
      ),
    }));
  }, [groupedBySetAndGroup, proficiencyMap, intl, handleProficiencyChange]);

  const summary = (
    <>
      <div className="algs-practice-tool-cell-header">
        <FlagOutlined className="algs-practice-tool-cell-icon" />
        <span className="algs-practice-tool-cell-title">
          {intl.formatMessage({ id: 'algs.proficiencyCard.title' })}
          {markedCount > 0 && (
            <span className="algs-practice-tool-cell-badge"> ({markedCount})</span>
          )}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">{intl.formatMessage({ id: 'algs.proficiencyCard.desc' })}</p>
      {onOpenFormulaPractice && (
        <p className="algs-practice-tool-cell-hint">
          {intl.formatMessage({ id: 'algs.proficiencyCard.practiceHint' })}
        </p>
      )}
    </>
  );

  return (
    <>
      {embedded ? (
        <button
          type="button"
          className="algs-practice-tool-cell algs-practice-tool-cell--proficiency"
          onClick={() => setModalOpen(true)}
        >
          {summary}
        </button>
      ) : (
        <Card
          size="small"
          style={{
            borderRadius: 12,
            backgroundColor: ALGS_COLORS.cardBg,
            borderColor: ALGS_COLORS.cardBorder,
            cursor: 'pointer',
            height: '100%',
          }}
          bodyStyle={{ padding: 16, height: '100%', boxSizing: 'border-box' }}
          onClick={() => setModalOpen(true)}
        >
          {summary}
        </Card>
      )}

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={intl.formatMessage({ id: 'algs.proficiencyCard.modalTitle' })}
        footer={null}
        width={760}
        styles={{ body: { maxHeight: 560, overflowY: 'auto' } }}
      >
        <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
          {intl.formatMessage({ id: 'algs.proficiencyCard.modalDesc' })}
        </div>
        <Collapse items={collapseItems} defaultActiveKey={Object.keys(groupedBySetAndGroup)} />
      </Modal>
    </>
  );
};

export default FormulaProficiencyCard;
