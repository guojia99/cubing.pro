import React from 'react';
import { Modal } from 'antd';
import { useIntl } from '@@/plugin-locale';

export interface UsageInstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

const UsageInstructionsModal: React.FC<UsageInstructionsModalProps> = ({ open, onClose }) => {
  const intl = useIntl();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={intl.formatMessage({ id: 'algs.usageInstructions.title' })}
      footer={null}
      width={420}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            {intl.formatMessage({ id: 'algs.usageInstructions.clickSwitch' })}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.6 }}>
            {intl.formatMessage({ id: 'algs.usageInstructions.clickSwitchDesc' })}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            {intl.formatMessage({ id: 'algs.usageInstructions.randomFunc' })}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.6 }}>
            {intl.formatMessage({ id: 'algs.usageInstructions.randomFuncDesc' })}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            {intl.formatMessage({ id: 'algs.usageInstructions.formulaPractice' })}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.6 }}>
            {intl.formatMessage({ id: 'algs.usageInstructions.formulaPracticeDesc' })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UsageInstructionsModal;
