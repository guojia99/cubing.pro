import { CopyOutlined } from '@ant-design/icons';
import { Button, notification } from 'antd';
// @ts-ignore
const CopyButton = ({ textToCopy }) => {
  const [api, contextHolder] = notification.useNotification();
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      api.open({
        message: '拷贝成功',
        description: "",
        duration: 2,
      });
    });
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
