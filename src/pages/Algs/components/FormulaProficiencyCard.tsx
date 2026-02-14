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
}

const FormulaProficiencyCard: React.FC<FormulaProficiencyCardProps> = ({
  cube,
  classId,
  flatAlgs,
  onOpenFormulaPractice,
  refreshKey = 0,
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
                        background: 'rgba(0,0,0,0.02)',
                        borderRadius: 8,
                      }}
                    >
                      <SvgRenderer svg={item.alg.image ?? ''} maxWidth={40} maxHeight={56} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.alg.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)' }}>
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
            <FlagOutlined style={{ color: 'rgba(100,149,237,0.8)' }} />
            <span style={{ fontWeight: 500 }}>{intl.formatMessage({ id: 'algs.proficiencyCard.title' })}</span>
            {markedCount > 0 && (
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
                ({markedCount})
              </span>
            )}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
          {intl.formatMessage({ id: 'algs.proficiencyCard.desc' })}
        </div>
        {onOpenFormulaPractice && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(100,149,237,0.9)' }}>
            {intl.formatMessage({ id: 'algs.proficiencyCard.practiceHint' })}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={intl.formatMessage({ id: 'algs.proficiencyCard.modalTitle' })}
        footer={null}
        width={760}
        styles={{ body: { maxHeight: 560, overflowY: 'auto' } }}
      >
        <div style={{ marginBottom: 12, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
          {intl.formatMessage({ id: 'algs.proficiencyCard.modalDesc' })}
        </div>
        <Collapse items={collapseItems} defaultActiveKey={Object.keys(groupedBySetAndGroup)} />
      </Modal>
    </>
  );
};

export default FormulaProficiencyCard;
