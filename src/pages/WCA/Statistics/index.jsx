import { HistoryOutlined, UnorderedListOutlined, CalendarOutlined, RiseOutlined, TrophyOutlined, CrownOutlined, HourglassOutlined, AppstoreOutlined, } from '@ant-design/icons';
import { Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useIntl } from '@@/plugin-locale';
import { useLocation, useNavigate } from '@@/exports';
import GrandSlamRank from './GrandSlamRank';
import FullRank from './FullRank';
import HistoricalRank from './HistoricalRank';
import YearlyFullRank from './YearlyFullRank';
import SuccessRateRank from './SuccessRateRank';
import AllEventsAchievementRank from './AllEventsAchievementRank';
import CompYearRank from './CompYearRank';
import DiyEventsRank from './DiyEventsRank';
import './index.less';
const { Title } = Typography;
const TAB_PARAM = 'tab';
const VALID_TAB_KEYS = [
    'grandSlam',
    'historical',
    'full',
    'yearlyFull',
    'compYear',
    'successRate',
    'allEventsAchievement',
    'multiEventRank',
];
const getTabFromSearch = (search) => {
    const params = new URLSearchParams(search);
    const tab = params.get(TAB_PARAM);
    return tab && VALID_TAB_KEYS.includes(tab) ? tab : 'grandSlam';
};
const Statistics = () => {
    const intl = useIntl();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeKey, setActiveKey] = useState(() => getTabFromSearch(location.search));
    // URL 变化时同步 activeKey（如浏览器前进/后退）
    useEffect(() => {
        setActiveKey(getTabFromSearch(location.search));
    }, [location.search]);
    const handleTabChange = (key) => {
        setActiveKey(key);
        const params = new URLSearchParams(location.search);
        params.set(TAB_PARAM, key);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };
    const cards = [
        {
            key: 'grandSlam',
            icon: <CrownOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.grandSlam' }),
            desc: intl.formatMessage({ id: 'wca.stats.grandSlamDesc' }),
        },
        {
            key: 'historical',
            icon: <HistoryOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.historicalRank' }),
            desc: intl.formatMessage({ id: 'wca.stats.historicalRankDesc' }),
        },
        {
            key: 'full',
            icon: <UnorderedListOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.fullRank' }),
            desc: intl.formatMessage({ id: 'wca.stats.fullRankDesc' }),
        },
        {
            key: 'yearlyFull',
            icon: <CalendarOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.yearlyFullRank' }),
            desc: intl.formatMessage({ id: 'wca.stats.yearlyFullRankDesc' }),
        },
        {
            key: 'compYear',
            icon: <HourglassOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.compYearRank' }),
            desc: intl.formatMessage({ id: 'wca.stats.compYearRankDesc' }),
        },
        {
            key: 'successRate',
            icon: <RiseOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.successRate' }),
            desc: intl.formatMessage({ id: 'wca.stats.successRateDesc' }),
        },
        {
            key: 'allEventsAchievement',
            icon: <TrophyOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.allEventsAchievement' }),
            desc: intl.formatMessage({ id: 'wca.stats.allEventsAchievementDesc' }),
        },
        {
            key: 'multiEventRank',
            icon: <AppstoreOutlined />,
            title: intl.formatMessage({ id: 'wca.stats.multiEventRank' }),
            desc: intl.formatMessage({ id: 'wca.stats.multiEventRankDesc' }),
        },
    ];
    return (<div className="stats-index">
      <Title level={3} className="stats-page-title">
        {intl.formatMessage({ id: 'wca.stats.title' })}
      </Title>
      <div className="stats-tab-grid" role="tablist" aria-label={intl.formatMessage({ id: 'wca.stats.title' })}>
        {cards.map((card) => {
            const selected = activeKey === card.key;
            return (<button key={card.key} type="button" role="tab" aria-selected={selected} tabIndex={0} className={`stats-tab-item ${selected ? 'active' : ''}`} onClick={() => handleTabChange(card.key)}>
              <span className="stats-tab-item-head">
                <span className="stats-tab-icon" aria-hidden>
                  {card.icon}
                </span>
                <span className="stats-tab-title-text">{card.title}</span>
              </span>
              <span className="stats-tab-desc">{card.desc}</span>
            </button>);
        })}
      </div>
      <div className="stats-content">
        <h1 className="stats-tab-title">
          {cards.find((c) => c.key === activeKey)?.title}
        </h1>
        {activeKey === 'grandSlam' && <GrandSlamRank />}
        {activeKey === 'historical' && <HistoricalRank />}
        {activeKey === 'full' && <FullRank />}
        {activeKey === 'yearlyFull' && <YearlyFullRank />}
        {activeKey === 'compYear' && <CompYearRank />}
        {activeKey === 'successRate' && <SuccessRateRank />}
        {activeKey === 'allEventsAchievement' && <AllEventsAchievementRank />}
        {activeKey === 'multiEventRank' && <DiyEventsRank />}
      </div>
    </div>);
};
export default Statistics;
//# sourceMappingURL=index.jsx.map