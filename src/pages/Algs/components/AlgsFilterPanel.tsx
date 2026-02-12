import React from 'react';
import { Button, Card } from 'antd';
import { useIntl } from '@@/plugin-locale';
import type { AlgorithmClass } from '@/services/cubing-pro/algs/typings';

function buildGroupKey(setName: string, groupName: string): string {
  return `${setName}:${groupName}`;
}

export interface AlgsFilterPanelProps {
  data: AlgorithmClass;
  selectedSets: string[];
  selectedGroups: string[];
  onSetToggle: (name: string) => void;
  onGroupToggle: (key: string) => void;
  onSetSelectAll: () => void;
  onSetDeselectAll: () => void;
  onGroupSelectAll: () => void;
  onGroupDeselectAll: () => void;
  compact?: boolean;
}

const AlgsFilterPanel: React.FC<AlgsFilterPanelProps> = ({
  data,
  selectedSets,
  selectedGroups,
  onSetToggle,
  onGroupToggle,
  onSetSelectAll,
  onSetDeselectAll,
  onGroupSelectAll,
  onGroupDeselectAll,
  compact = false,
}) => {
  const intl = useIntl();
  const sets = data.sets ?? [];
  const setKeys = data.setKeys ?? [];

  return (
    <>
      <Card size="small" style={{ marginBottom: compact ? 12 : 16 }}>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
            {intl.formatMessage({ id: 'algs.detail.set' })}
          </span>
          <Button size="small" onClick={onSetSelectAll}>
            {intl.formatMessage({ id: 'algs.detail.selectAll' })}
          </Button>
          <Button size="small" onClick={onSetDeselectAll}>
            {intl.formatMessage({ id: 'algs.detail.deselectAll' })}
          </Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {setKeys.map((name) => (
            <Button
              key={name}
              type={selectedSets.includes(name) ? 'primary' : 'default'}
              size="small"
              onClick={() => onSetToggle(name)}
              style={{
                borderRadius: 20,
                ...(selectedSets.includes(name)
                  ? { backgroundColor: 'rgba(100, 149, 237, 0.85)', borderColor: 'rgba(100, 149, 237, 0.85)' }
                  : {}),
              }}
            >
              {name}
            </Button>
          ))}
        </div>
      </Card>

      <Card size="small" style={{ marginBottom: 0 }}>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
            {intl.formatMessage({ id: 'algs.detail.group' })}
          </span>
          <Button size="small" onClick={onGroupSelectAll}>
            {intl.formatMessage({ id: 'algs.detail.selectAll' })}
          </Button>
          <Button size="small" onClick={onGroupDeselectAll}>
            {intl.formatMessage({ id: 'algs.detail.deselectAll' })}
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {setKeys
            .filter((setName) => selectedSets.includes(setName))
            .map((setName) => {
              const set = sets.find((s) => s.name === setName);
              const groupKeys = set?.groups_keys ?? [];
              if (groupKeys.length === 0) return null;
              return (
                <div key={setName}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>
                    {setName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {groupKeys.map((gName) => {
                      const key = buildGroupKey(setName, gName);
                      return (
                        <Button
                          key={key}
                          type={selectedGroups.includes(key) ? 'primary' : 'default'}
                          size="small"
                          onClick={() => onGroupToggle(key)}
                          style={{
                            borderRadius: 16,
                            ...(selectedGroups.includes(key)
                              ? {
                                  backgroundColor: 'rgba(100, 149, 237, 0.85)',
                                  borderColor: 'rgba(100, 149, 237, 0.85)',
                                }
                              : {}),
                          }}
                        >
                          {gName}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </>
  );
};

export default AlgsFilterPanel;
