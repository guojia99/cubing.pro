import { CopyOutlined } from '@ant-design/icons';
import { Button, notification } from 'antd';

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const [api, contextHolder] = notification.useNotification();

  const handleCopy = () => {
    if (navigator.clipboard) {
      // 使用 navigator.clipboard 复制
      navigator.clipboard.writeText(textToCopy).then(() => {
        api.open({
          message: '拷贝成功',
          description: '',
          duration: 2,
        });
      }).catch((err) => {
        console.error('Copy failed', err);
        api.open({
          message: '拷贝失败',
          description: '请手动复制',
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
        document.execCommand('copy');
        document.body.removeChild(textarea);

        api.open({
          message: '拷贝成功',
          description: '',
          duration: 2,
        });
      } catch (err) {
        console.error('Fallback copy failed', err);
        api.open({
          message: '拷贝失败',
          description: '请手动复制',
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
