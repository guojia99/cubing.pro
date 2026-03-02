import { HistoryOutlined, UnorderedListOutlined, CalendarOutlined, RiseOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import React, { useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import FullRank from './FullRank';
import HistoricalRank from './HistoricalRank';
import YearlyFullRank from './YearlyFullRank';
import SuccessRateRank from './SuccessRateRank';
import './index.less';

const { Title } = Typography;

type StatsTabKey = 'historical' | 'full' | 'yearlyFull' | 'successRate';

const Statistics: React.FC = () => {
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState<StatsTabKey>('historical');

  const cards = [
    {
      key: 'historical' as StatsTabKey,
      icon: <HistoryOutlined />,
      title: intl.formatMessage({ id: 'wca.stats.historicalRank' }),
      desc: intl.formatMessage({ id: 'wca.stats.historicalRankDesc' }),
    },
    {
      key: 'full' as StatsTabKey,
      icon: <UnorderedListOutlined />,
      title: intl.formatMessage({ id: 'wca.stats.fullRank' }),
      desc: intl.formatMessage({ id: 'wca.stats.fullRankDesc' }),
    },
    {
      key: 'yearlyFull' as StatsTabKey,
      icon: <CalendarOutlined />,
      title: intl.formatMessage({ id: 'wca.stats.yearlyFullRank' }),
      desc: intl.formatMessage({ id: 'wca.stats.yearlyFullRankDesc' }),
    },
    {
      key: 'successRate' as StatsTabKey,
      icon: <RiseOutlined />,
      title: intl.formatMessage({ id: 'wca.stats.successRate' }),
      desc: intl.formatMessage({ id: 'wca.stats.successRateDesc' }),
    },
  ];

  return (
    <div className="stats-index">
      <Title level={3} className="stats-page-title">
        {intl.formatMessage({ id: 'wca.stats.title' })}
      </Title>
      <div className="stats-cards">
        {cards.map((card) => (
          <Card
            key={card.key}
            size="small"
            className={`stats-card ${activeKey === card.key ? 'active' : ''}`}
            hoverable
            onClick={() => setActiveKey(card.key)}
          >
            <div className="stats-card-content">
              <span className="stats-card-icon">{card.icon}</span>
              <div className="stats-card-text">
                <span className="stats-card-title">{card.title}</span>
                <span className="stats-card-desc">{card.desc}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="stats-content">
        {activeKey === 'historical' && <HistoricalRank />}
        {activeKey === 'full' && <FullRank />}
        {activeKey === 'yearlyFull' && <YearlyFullRank />}
        {activeKey === 'successRate' && <SuccessRateRank />}
      </div>
    </div>
  );
};

export default Statistics;
