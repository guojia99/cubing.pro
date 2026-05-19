import { FormattedMessage } from '@@/exports';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Divider, Image, Space, Typography } from 'antd';
import React, { useState } from 'react';
import ThanksSection from '@/pages/Welcome/ThanksSection';
const { Title, Paragraph } = Typography;
const QRImage = ({ sources, alt }) => {
    const [imgSrc, setImgSrc] = useState(sources[0]);
    const nextIdxRef = React.useRef(1);
    return (<Image src={imgSrc} alt={alt} width={200} height={200} style={{ objectFit: 'contain' }} preview={{
            mask: (<div style={{ textAlign: 'center' }}>
            <div>点击放大</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
              <FormattedMessage id="home.buyCoffee.remarkTip"/>
            </div>
          </div>),
        }} onError={() => {
            if (nextIdxRef.current < sources.length) {
                const next = sources[nextIdxRef.current++];
                setImgSrc(next);
            }
        }}/>);
};
/**
 * 请作者喝咖啡页面
 * 二维码图片放置位置（将您的收款码替换以下文件）：
 * - 微信：public/qrcode/wechat.png（或 wechat.svg 占位图）
 * - 支付宝：public/qrcode/alipay.png（或 alipay.svg 占位图）
 */
const BuyCoffee = () => {
    return (<PageContainer header={{
            title: (<span>
            ☕ <FormattedMessage id="home.buyCoffee.title"/>
          </span>),
            subTitle: (<span>
            🙏 <FormattedMessage id="home.buyCoffee.subTitle"/>
          </span>),
        }}>
      <Card style={{
            borderRadius: 12,
            background: 'linear-gradient(180deg, #fff9f0 0%, #ffffff 100%)',
        }}>
        <Paragraph style={{
            fontSize: 16,
            marginBottom: 16,
            textAlign: 'center',
            color: 'rgba(0,0,0,0.65)',
        }}>
          ✨ <FormattedMessage id="home.buyCoffee.desc"/> 💝
        </Paragraph>
        <Paragraph style={{
            fontSize: 14,
            marginBottom: 32,
            textAlign: 'center',
            color: 'rgba(0,0,0,0.85)',
            fontWeight: 500,
        }}>
          📝 <FormattedMessage id="home.buyCoffee.remarkTip"/>
        </Paragraph>
        <Space size="large" wrap style={{ justifyContent: 'center', width: '100%' }}>
          <Card style={{
            width: 280,
            textAlign: 'center',
            borderRadius: 12,
            border: '1px solid #e8e8e8',
        }} bodyStyle={{ padding: '24px 20px' }}>
            <div style={{
            padding: 20,
            backgroundColor: '#f0f9f0',
            borderRadius: 12,
            marginBottom: 16,
        }}>
              <QRImage sources={['/qrcode/wechat.png', '/qrcode/wechat.jpg', '/qrcode/wechat.svg']} alt="微信收款码"/>
            </div>
            <Title level={4} style={{ marginBottom: 8 }}>
              💬 <FormattedMessage id="home.buyCoffee.wechat"/>
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              <FormattedMessage id="home.buyCoffee.wechat.desc"/>
            </Paragraph>
          </Card>
          <Card style={{
            width: 280,
            textAlign: 'center',
            borderRadius: 12,
            border: '1px solid #e8e8e8',
        }} bodyStyle={{ padding: '24px 20px' }}>
            <div style={{
            padding: 20,
            backgroundColor: '#e6f7ff',
            borderRadius: 12,
            marginBottom: 16,
        }}>
              <QRImage sources={['/qrcode/alipay.png', '/qrcode/alipay.jpg', '/qrcode/alipay.svg']} alt="支付宝收款码"/>
            </div>
            <Title level={4} style={{ marginBottom: 8 }}>
              💙 <FormattedMessage id="home.buyCoffee.alipay"/>
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              <FormattedMessage id="home.buyCoffee.alipay.desc"/>
            </Paragraph>
          </Card>
        </Space>
        <Divider />
        <Paragraph style={{
            fontSize: 14,
            textAlign: 'center',
            color: 'rgba(0,0,0,0.65)',
            marginBottom: 0,
        }}>
          📧 <FormattedMessage id="home.buyCoffee.contact"/>{' '}
          <a href="mailto:guojia09900@gmail.com">guojia09900@gmail.com</a>
        </Paragraph>
        <Paragraph style={{
            fontSize: 13,
            textAlign: 'center',
            color: 'rgba(0,0,0,0.45)',
            marginTop: 8,
            marginBottom: 0,
        }}>
          <FormattedMessage id="home.buyCoffee.feedback"/>
        </Paragraph>
      </Card>
      <div style={{ marginTop: 30 }}/>
      <ThanksSection />
    </PageContainer>);
};
export default BuyCoffee;
//# sourceMappingURL=index.jsx.map