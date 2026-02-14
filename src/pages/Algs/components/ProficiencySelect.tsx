import React from 'react';
import { Select } from 'antd';
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  MinusCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import type { ProficiencyLevel } from '@/services/cubing-pro/algs/formulaPracticeProficiency';

const PROFICIENCY_CONFIG: { value: ProficiencyLevel; icon: React.ReactNode; color?: string }[] = [
  { value: 'mastered', icon: <CheckCircleOutlined />, color: '#52c41a' },
  { value: 'skilled', icon: <ThunderboltOutlined />, color: '#1890ff' },
  { value: 'average', icon: <MinusCircleOutlined />, color: 'rgba(0,0,0,0.65)' },
  { value: 'unskilled', icon: <ExclamationCircleOutlined />, color: '#faad14' },
  { value: 'unknown', icon: <CloseCircleOutlined />, color: '#ff4d4f' },
];

interface ProficiencySelectProps {
  value: ProficiencyLevel;
  onChange: (v: ProficiencyLevel) => void;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
}

const ProficiencySelect: React.FC<ProficiencySelectProps> = ({
  value,
  onChange,
  size = 'small',
  style = {},
  dropdownStyle = {},
}) => {
  const intl = useIntl();
  return (
    <Select
      value={value}
      onChange={onChange}
      size={size}
      style={{ minWidth: 140, ...style }}
      dropdownStyle={{ minWidth: 200, ...dropdownStyle }}
      optionLabelProp="label"
      options={PROFICIENCY_CONFIG.map((opt) => ({
        value: opt.value,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: opt.color }}>{opt.icon}</span>
            {intl.formatMessage({ id: `algs.formulaPractice.proficiency.${opt.value}` })}
          </span>
        ),
      }))}
    />
  );
};

export default ProficiencySelect;
