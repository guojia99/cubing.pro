import { FormattedMessage, getIntl } from '@@/exports';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Image, theme } from 'antd';
import React from 'react';

const intl = getIntl();
type CardProps = {
  title: string;
  index: number;
  desc: string;
  href: string;
};

/**
 * 每个单独的卡片，为了复用样式抽成了组件
 * @param param0
 * @returns
 */
const InfoCard: React.FC<CardProps> = ({ title, href, index, desc }) => {
  const { useToken } = theme;

  const { token } = useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        boxShadow: token.boxShadow,
        borderRadius: '8px',
        fontSize: '14px',
        color: token.colorTextSecondary,
        lineHeight: '22px',
        padding: '16px 19px',
        minWidth: '220px',
        flex: 1,
      }}
    >
      <a href={href} target="_blank" rel="noreferrer">
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              lineHeight: '22px',
              backgroundSize: '100%',
              textAlign: 'center',
              padding: '8px 16px 16px 12px',
              color: '#FFF',
              fontWeight: 'bold',
              backgroundImage:
                "url('https://gw.alipayobjects.com/zos/bmw-prod/daaf8d50-8e6d-4251-905d-676a24ddfa12.svg')",
            }}
          >
            {index}
          </div>
          <div style={{ fontSize: '16px', color: token.colorText, paddingBottom: 8 }}>{title}</div>
        </div>
        <div
          style={{
            fontSize: '14px',
            color: token.colorTextSecondary,
            textAlign: 'justify',
            lineHeight: '22px',
            marginBottom: 8,
          }}
        >
          {desc}
        </div>
        <a href={href} target="_blank" rel="noreferrer">
          <FormattedMessage id="home.learn_more" /> {'>'}
        </a>
      </a>
    </div>
  );
};

/**
 * 请作者喝咖啡 - 主页快捷跳转组件（图片可点击放大）
 */
const BuyCoffeeQuickJump: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <Card
      style={{
        borderRadius: 8,
        background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        <Image
          src="/coffee-icon.svg"
          alt="请作者喝咖啡"
          width={120}
          height={120}
          preview={{ mask: '点击放大' }}
          style={{ cursor: 'pointer', borderRadius: 12 }}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '20px', color: token.colorTextHeading, marginBottom: 8 }}>
            ☕ {intl.formatMessage({ id: 'home.buyCoffee.title' })}
          </div>
          <p
            style={{
              fontSize: '14px',
              color: token.colorTextSecondary,
              lineHeight: '22px',
              marginBottom: 16,
            }}
          >
            {intl.formatMessage({ id: 'home.buyCoffee.cardDesc' })}
          </p>
          <a href="./buy-coffee" style={{ color: token.colorPrimary, fontWeight: 500 }}>
            <FormattedMessage id="home.learn_more" /> {'>'}
          </a>
        </div>
      </div>
    </Card>
  );
};

const GroupInfoCards: React.FC<{
  groupName: string;
  title: string;
  desc: string;
  childrens: CardProps[];
}> = ({ groupName, title, desc, childrens }) => {
  const { token } = theme.useToken();
  return (
    <>
      <Card
        key={groupName}
        style={{
          borderRadius: 8,
        }}
        // bodyStyle={{
        //   backgroundImage:
        //     initialState?.settings?.navTheme === 'realDark'
        //       ? 'background-image: linear-gradient(75deg, #1A1B1F 0%, #191C1F 100%)'
        //       : 'background-image: linear-gradient(75deg, #FBFDFF 0%, #F5F7FF 100%)',
        // }}
      >
        <div
          style={{
            backgroundPosition: '100% -30%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '274px auto',
            backgroundImage:
              "url('https://gw.alipayobjects.com/mdn/rms_a9745b/afts/img/A*BuFmQqsB2iAAAAAAAAAAAAAAARQnAQ')",
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: token.colorTextHeading,
            }}
          >
            {title}
          </div>
          <p
            style={{
              fontSize: '14px',
              color: token.colorTextSecondary,
              lineHeight: '22px',
              marginTop: 16,
              marginBottom: 32,
              width: '100%',
            }}
          >
            {desc}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {childrens.map((item, index) => (
              <InfoCard
                key={index + title}
                index={item.index}
                href={item.href}
                title={item.title}
                desc={item.desc}
              />
            ))}
          </div>
        </div>
      </Card>
    </>
  );
};

const Welcome: React.FC = () => {
  // @ts-ignore
  // const {initialState} = useModel('@@initialState');
  return (
    <PageContainer>
      <GroupInfoCards
        groupName={'welcome'}
        title={intl.formatMessage({ id: 'home.welcome.title' })}
        desc={intl.formatMessage({ id: 'home.welcome.desc' })}
        childrens={[
          {
            index: 1,
            href: './groupCompetitions/competitions',
            title: intl.formatMessage({ id: 'home.welcome.competitions.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.competitions.desc' }),
          },
          {
            index: 2,
            href: './groupCompetitions/static',
            title: intl.formatMessage({ id: 'home.welcome.static.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.static.desc' }),
          },
          {
            index: 3,
            title: intl.formatMessage({ id: 'home.welcome.players.title' }),
            href: './groupCompetitions/players',
            desc: intl.formatMessage({ id: 'home.welcome.players.desc' }),
          },
        ]}
      />

      <div style={{ marginTop: 30 }} />
      <GroupInfoCards
        groupName={'algs'}
        title={intl.formatMessage({ id: 'home.welcome.algs.title' })}
        desc={intl.formatMessage({ id: 'home.welcome.algs.desc' })}
        childrens={[
          {
            index: 1,
            href: './algs',
            title: intl.formatMessage({ id: 'home.welcome.algs.list.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.algs.list.desc' }),
          },
          {
            index: 2,
            href: './algs/222/EG',
            title: intl.formatMessage({ id: 'home.welcome.algs.eg.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.algs.eg.desc' }),
          },
          {
            index: 3,
            href: './algs/333/PLL',
            title: intl.formatMessage({ id: 'home.welcome.algs.pll.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.algs.pll.desc' }),
          },
        ]}
      />

      <div style={{ marginTop: 30 }} />
      <GroupInfoCards
        groupName={'draw_tool'}
        title={intl.formatMessage({ id: 'home.welcome.draw.title' })}
        desc={intl.formatMessage({ id: 'home.welcome.draw.desc' })}
        childrens={[
          {
            index: 0,
            href: 'https://visualcubeplus.com/',
            title: intl.formatMessage({ id: 'home.welcome.draw.cube.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.draw.cube.desc' }),
          },
          {
            index: 1,
            href: './draw_tools/sq1-d',
            title: intl.formatMessage({ id: 'home.welcome.draw.sq.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.draw.sq.desc' }),
          },
          {
            index: 2,
            href: './draw_tools/minx-d',
            title: intl.formatMessage({ id: 'home.welcome.draw.minx.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.draw.minx.desc' }),
          },
          {
            index: 3,
            href: './draw_tools/sk-d',
            title: intl.formatMessage({ id: 'home.welcome.draw.sk.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.draw.sk.desc' }),
          },
          {
            index: 4,
            href: './draw_tools/py-d',
            title: intl.formatMessage({ id: 'home.welcome.draw.py.title' }),
            desc: intl.formatMessage({ id: 'home.welcome.draw.py.desc' }),
          },
        ]}
      />

      <div style={{ marginTop: 30 }} />
      <BuyCoffeeQuickJump />
    </PageContainer>
  );
};

export default Welcome;
