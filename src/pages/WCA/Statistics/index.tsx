import { HistoryOutlined, UnorderedListOutlined, CalendarOutlined, RiseOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import { useLocation, useNavigate } from '@@/exports';
import FullRank from './FullRank';
import HistoricalRank from './HistoricalRank';
import YearlyFullRank from './YearlyFullRank';
import SuccessRateRank from './SuccessRateRank';
import AllEventsAchievementRank from './AllEventsAchievementRank';
import './index.less';

const { Title } = Typography;

type StatsTabKey = 'historical' | 'full' | 'yearlyFull' | 'successRate' | 'allEventsAchievement';

const TAB_PARAM = 'tab';
const VALID_TAB_KEYS: StatsTabKey[] = ['historical', 'full', 'yearlyFull', 'successRate', 'allEventsAchievement'];

const getTabFromSearch = (search: string): StatsTabKey => {
  const params = new URLSearchParams(search);
  const tab = params.get(TAB_PARAM);
  return tab && VALID_TAB_KEYS.includes(tab as StatsTabKey) ? (tab as StatsTabKey) : 'historical';
};

const Statistics: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<StatsTabKey>(() => getTabFromSearch(location.search));

  // URL 变化时同步 activeKey（如浏览器前进/后退）
  useEffect(() => {
    setActiveKey(getTabFromSearch(location.search));
  }, [location.search]);

  const handleTabChange = (key: StatsTabKey) => {
    setActiveKey(key);
    const params = new URLSearchParams(location.search);
    params.set(TAB_PARAM, key);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

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
    {
      key: 'allEventsAchievement' as StatsTabKey,
      icon: <TrophyOutlined />,
      title: intl.formatMessage({ id: 'wca.stats.allEventsAchievement' }),
      desc: intl.formatMessage({ id: 'wca.stats.allEventsAchievementDesc' }),
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
            onClick={() => handleTabChange(card.key)}
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
        {activeKey === 'allEventsAchievement' && <AllEventsAchievementRank />}
      </div>
    </div>
  );
};

export default Statistics;
