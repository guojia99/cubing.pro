import React from 'react';
import { Card } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import '../index.less';

export interface FormulaPracticeStartCardProps {
  onStart: () => void;
  embedded?: boolean;
}

const FormulaPracticeStartCard: React.FC<FormulaPracticeStartCardProps> = ({
  onStart,
  embedded = false,
}) => {
  const intl = useIntl();

  const content = (
    <>
      <div className="algs-practice-tool-cell-header">
        <PlayCircleOutlined className="algs-practice-tool-cell-icon algs-practice-tool-cell-icon--practice" />
        <span className="algs-practice-tool-cell-title">
          {intl.formatMessage({ id: 'algs.formulaPractice.start' })}
        </span>
      </div>
      <p className="algs-practice-tool-cell-desc">
        {intl.formatMessage({ id: 'algs.formulaPractice.title' })}
      </p>
    </>
  );

  if (embedded) {
    return (
      <button type="button" className="algs-practice-tool-cell algs-practice-tool-cell--practice" onClick={onStart}>
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
        backgroundColor: 'rgba(0, 185, 204, 0.25)',
        borderColor: 'rgba(0, 185, 204, 0.5)',
        cursor: 'pointer',
        height: '100%',
      }}
      bodyStyle={{ padding: 16, height: '100%', boxSizing: 'border-box' }}
    >
      {content}
    </Card>
  );
};

export default FormulaPracticeStartCard;
