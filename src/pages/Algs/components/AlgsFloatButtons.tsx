import React from 'react';
import { FloatButton } from 'antd';
import { FilterOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';

export interface AlgsFloatButtonsProps {
  onScrollTop: () => void;
  onOpenFilter: () => void;
}

const AlgsFloatButtons: React.FC<AlgsFloatButtonsProps> = ({ onScrollTop, onOpenFilter }) => {
  const intl = useIntl();

  return (
    <FloatButton.Group shape="circle" style={{ right: 24, bottom: 100, zIndex: 1000 }}>
      <FloatButton
        icon={<VerticalAlignTopOutlined />}
        tooltip={intl.formatMessage({ id: 'algs.detail.scrollTop' })}
        onClick={onScrollTop}
      />
      <FloatButton
        icon={<FilterOutlined />}
        tooltip={intl.formatMessage({ id: 'algs.detail.filterDrawer' })}
        onClick={onOpenFilter}
      />
    </FloatButton.Group>
  );
};

export default AlgsFloatButtons;
