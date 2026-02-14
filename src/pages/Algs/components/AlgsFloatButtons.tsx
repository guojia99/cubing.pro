import React from 'react';
import { FloatButton } from 'antd';
import { FilterOutlined, PlayCircleOutlined, QuestionCircleOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';

export interface AlgsFloatButtonsProps {
  onScrollTop: () => void;
  onOpenFilter: () => void;
  onOpenUsageInstructions?: () => void;
  onOpenFormulaPractice?: () => void;
}

const AlgsFloatButtons: React.FC<AlgsFloatButtonsProps> = ({
  onScrollTop,
  onOpenFilter,
  onOpenUsageInstructions,
  onOpenFormulaPractice,
}) => {
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
      {onOpenFormulaPractice && (
        <FloatButton
          icon={<PlayCircleOutlined />}
          tooltip={intl.formatMessage({ id: 'algs.formulaPractice.title' })}
          onClick={onOpenFormulaPractice}
        />
      )}
      {onOpenUsageInstructions && (
        <FloatButton
          icon={<QuestionCircleOutlined />}
          tooltip={intl.formatMessage({ id: 'algs.usageInstructions.title' })}
          onClick={onOpenUsageInstructions}
        />
      )}
    </FloatButton.Group>
  );
};

export default AlgsFloatButtons;
