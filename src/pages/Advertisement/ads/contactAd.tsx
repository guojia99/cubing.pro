import { theme } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import React from 'react';

/** 内置广告：欢迎联系定制打广告 */
export const ContactAdThumbnail: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
        // padding: 24,
      }}
    >
      <MailOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
      <div style={{ fontSize: 18, color: token.colorTextHeading, marginBottom: 8, fontWeight: 500 }}>
        欢迎联系广告定制
      </div>
      <a
        href="mailto:guojia09900@gmail.com"
        style={{ color: token.colorPrimary, fontSize: 15, fontWeight: 500 }}
      >
        guojia09900@gmail.com
      </a>
    </div>
  );
};

/** 详情页（内置广告一般不单独展示，可复用缩略图内容） */
export const ContactAdFullContent: React.FC = () => {
  return <ContactAdThumbnail />;
};
