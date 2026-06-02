import React from 'react';
import { Card } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import '../index.less';

export interface BatchCustomFormulaStartCardProps {
  onStart: () => void;
  embedded?: boolean;
}

const BatchCustomFormulaStartCard: React.FC<BatchCustomFormulaStartCardProps> = ({
  onStart,
  embedded = false,
}) => {
  const intl = useIntl();

  const content = (
    <>
      <div className="algs-practice-tool-cell-header">
        <FormOutlined className="algs-practice-tool-cell-icon algs-practice-tool-cell-icon--batch" />
        <span className="algs-practice-tool-cell-title">
          {intl.formatMessage({ id: 'algs.batchCustom.title' })}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">
        {intl.formatMessage({ id: 'algs.batchCustom.desc' })}
      </p>
    </>
  );

  if (embedded) {
    return (
      <button
        type="button"
        className="algs-practice-tool-cell algs-practice-tool-cell--batch"
        onClick={onStart}
      >
        {content}
      </button>
    );
  }

  return (
    <Card
      hoverable
      size="small"
      onClick={onStart}
      style={{
        borderRadius: 12,
        backgroundColor: 'rgba(114, 46, 209, 0.12)',
        borderColor: 'rgba(114, 46, 209, 0.45)',
        cursor: 'pointer',
        height: '100%',
      }}
      bodyStyle={{ padding: 16, height: '100%', boxSizing: 'border-box' }}
    >
      {content}
    </Card>
  );
};

export default BatchCustomFormulaStartCard;
