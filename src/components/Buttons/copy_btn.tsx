"use client";

import { useIntlMessage } from '@/hooks/useIntlMessage';
import { CopyOutlined } from '@ant-design/icons';
import { Button, notification } from 'antd';

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const { formatMessage: t } = useIntlMessage();
  const [api, contextHolder] = notification.useNotification();

  const handleCopy = () => {
    if (navigator.clipboard) {
      // 使用 navigator.clipboard 复制
      navigator.clipboard.writeText(textToCopy).then(() => {
        api.open({
          title: t({ id: 'shared.copy.success' }),
          duration: 2,
        });
      }).catch((err) => {
        console.error('Copy failed', err);
        api.open({
          title: t({ id: 'shared.copy.failed' }),
          description: t({ id: 'shared.copy.manual' }),
          duration: 2,
        });
      });
    } else {
      // 使用手动复制的回退机制
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed'; // 防止影响页面布局
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          if (!document.execCommand('copy')) throw new Error('Copy command failed');
        } finally {
          document.body.removeChild(textarea);
        }

        api.open({
          title: t({ id: 'shared.copy.success' }),
          duration: 2,
        });
      } catch (err) {
        console.error('Fallback copy failed', err);
        api.open({
          title: t({ id: 'shared.copy.failed' }),
          description: t({ id: 'shared.copy.manual' }),
          duration: 2,
        });
      }
    }
  };

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        icon={<CopyOutlined />}
        aria-label={t({ id: 'shared.copy' })}
        title={t({ id: 'shared.copy' })}
        onClick={handleCopy}
        style={{
          float: 'right',
          marginBottom: '30px',
        }}
      ></Button>
    </>
  );
};

export default CopyButton;
