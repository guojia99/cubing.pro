import { FlagOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Empty, List, message, Progress, Tabs, Tag, Typography } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const { Title, Text, Link } = Typography;

interface WcaCompetition {
  id: string;
  name: string;
  venue: string;
  registration_open: string;
  registration_close: string;
  start_date: string;
  end_date: string;
  short_display_name: string;
  city: string;
  country_iso2: string;
  event_ids: string[];
  latitude_degrees: number;
  longitude_degrees: number;
  announced_at: string;
  class: string;
}

const COUNTRY_MAP: { [key: string]: { label: string; code: string; icon: React.ReactNode } } = {
  CN: {
    label: '中国',
    code: 'CN',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/cn.svg" size="small" shape="square" />
    ),
  },
  HK: {
    label: '中国香港',
    code: 'HK',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/hk.svg" size="small" shape="square" />
    ),
  },
  TW: {
    label: '中国台湾',
    code: 'TW',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/cn.svg" size="small" shape="square" />
    ),
  },
  KR: {
    label: '韩国',
    code: 'KR',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/kr.svg" size="small" shape="square" />
    ),
  },
  MY: {
    label: '马来西亚',
    code: 'MY',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/my.svg" size="small" shape="square" />
    ),
  },
  SG: {
    label: '新加坡',
    code: 'SG',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/sg.svg" size="small" shape="square" />
    ),
  },
  VN: {
    label: '越南',
    code: 'VN',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/vn.svg" size="small" shape="square" />
    ),
  },
  TH: {
    label: '泰国',
    code: 'TH',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/th.svg" size="small" shape="square" />
    ),
  },
  JP: {
    label: '日本',
    code: 'JP',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/jp.svg" size="small" shape="square" />
    ),
  },
  ID: {
    label: '印尼',
    code: 'ID',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/id.svg" size="small" shape="square" />
    ),
  },
  PH: {
    label: '菲律宾',
    code: 'PH',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/ph.svg" size="small" shape="square" />
    ),
  },
  NP: {
    label: '尼泊尔',
    code: 'NP',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/np.svg" size="small" shape="square" />
    ),
  },
  AU: {
    label: '澳大利亚',
    code: 'AU',
    icon: (
      <Avatar style={{ width: 32 }} src="https://flagcdn.com/au.svg" size="small" shape="square" />
    )
  }
};

const extractVenue = (venue: string): { text: string; url?: string } => {
  const match = venue.match(/\[(.*?)\]\((.*?)\)/);
  if (match) {
    return { text: match[1], url: match[2] };
  }
  return { text: venue };
};

const isRegistrationNotStarted = (open: string) => {
  const now = new Date();
  const openDate = new Date(open);
  return now < openDate;
};

const isRegistrationClosed = (close: string) => {
  const now = new Date();
  const closeDate = new Date(close);
  return now > closeDate;
};

const isRegistrationOpen = (open: string, close: string) => {
  const now = new Date();
  const openDate = new Date(open);
  const closeDate = new Date(close);
  return now >= openDate && now <= closeDate;
};

const formatToBeijingTime = (utcString: string) => {
  return new Date(utcString).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WcaCompetitionList: React.FC = () => {
  const [data, setData] = useState<{ [key: string]: WcaCompetition[] }>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allFetched, setAllFetched] = useState(false);


  const fetchSingleCountry = async (key: string) => {
    if (!data[key]) { // 如果数据不存在，则请求
      try {
        const params = new URLSearchParams({
          country_iso2: key,
          include_cancelled: 'false',
          ongoing_and_future: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          page: '1',
        });
        const res = await axios.get(
          `https://www.worldcubeassociation.org/api/v0/competition_index?${params}`,
        );
        setData((prevData) => ({ ...prevData, [key]: res.data || [] }));
      } catch (e) {
        setData((prevData) => ({ ...prevData, [key]: [] }));
      }
    }
  };

  const fetchDataForAllCountries = async () => {
    if (!allFetched) { // 如果还没有获取过所有国家的数据，则发起请求
      if (allFetched) return; // 已经加载过就不再重复请求

      const countries = Object.keys(COUNTRY_MAP);
      const notLoadedCountries = countries.filter(key => !(key in data));

      if (notLoadedCountries.length === 0) return;

      setLoading(true);
      setProgress(0);

      await Promise.all(
        notLoadedCountries.map(async (key, index) => {
          await fetchSingleCountry(key); // 复用 fetchSingleCountry 的逻辑
          setProgress(Math.round(((index + 1) / notLoadedCountries.length) * 100));
        })
      );

      setLoading(false);
      setAllFetched(true);
    }
  };


  useEffect(() => {
    fetchSingleCountry('CN');
  }, []);

  const renderItem = (item: WcaCompetition) => {
    const start = new Date(item.start_date);
    const end = new Date(item.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const venueParsed = extractVenue(item.venue);

    let openTag = <Tag color="red">不可报名</Tag>;

    if (isRegistrationNotStarted(item.registration_open)) {
      openTag = <Tag color="orange">未开始报名</Tag>;
    } else if (isRegistrationOpen(item.registration_open, item.registration_close)) {
      openTag = <Tag color="green">可报名</Tag>;
    } else if (isRegistrationClosed(item.registration_close)) {
      openTag = <Tag color="red">报名已结束</Tag>;
    }

    return (
      <List.Item>
        <Card
          title={
            <a
              href={`https://www.worldcubeassociation.org/competitions/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.name}
            </a>
          }
        >
          <p>
            <Text strong>城市：</Text>
            {item.city}
          </p>
          <p>
            <Text strong>比赛日期：</Text>
            {item.start_date} 至 {item.end_date} <Tag color="blue">{days} 天</Tag>
          </p>
          <p>
            <Text strong>比赛地点：</Text>
            {venueParsed.url ? (
              <Link href={venueParsed.url} target="_blank" rel="noopener noreferrer">
                {venueParsed.text}
              </Link>
            ) : (
              venueParsed.text
            )}
          </p>
          <p>
            <Text strong>项目列表：</Text>
            {item.event_ids.map((eid) => (
              <Tag key={eid}>{eid}</Tag>
            ))}
          </p>
          <p>
            <Text strong>
              报名时间(北京时间): {formatToBeijingTime(item.registration_open)} ~{' '}
              {formatToBeijingTime(item.registration_close)}
            </Text>
          </p>
          <p>
            <Text strong>报名状态：</Text>
            {openTag}
          </p>
        </Card>
      </List.Item>
    );
  };

  const renderList = (comps: WcaCompetition[], key: string) => {
    return (
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 1,
          md: 2, // 中等屏幕及以上为两列
          lg: 3,
          xl: 3,
          xxl: 3,
        }}
        dataSource={comps}
        renderItem={renderItem}
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Empty description="暂无比赛" />
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={() => {
                  fetchSingleCountry(key).then(() => {
                    message.success("刷新成功").then()
                  })
                }}
              >
                刷新
              </Button>
            </div>
          ),
        }}
      />
    );
  };

  const tabItems = [
    ...Object.entries(COUNTRY_MAP).map(([key, { label, icon }]) => ({
      key,
      label: (
        <span>
          {icon} {label}
        </span>
      ),
      children: renderList(data[key], key),
    })),
    {
      key: 'ALL',
      label: (
        <>
          <FlagOutlined /> 全部
        </>
      ),
      children: loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Progress percent={progress} status="active" />
          <div style={{ marginTop: 8 }}>正在加载比赛数据…</div>
        </div>
      ) : (
        Object.entries(data).map(([key, comps]) => (
          <div key={key} style={{ marginBottom: 24 }}>
            <Title level={4}>
              {COUNTRY_MAP[key].icon} {COUNTRY_MAP[key].label}
            </Title>
            {renderList(comps, key)}
          </div>
        ))
      ),
    },
  ];

  return (
    <Tabs
      items={tabItems}
      defaultActiveKey="CN"
      destroyInactiveTabPane
      onChange={(activeKey) => {
        if (activeKey === 'ALL') {
          fetchDataForAllCountries().then()
        } else {
          fetchSingleCountry(activeKey).then()
        }
      }}
    />
  );
};

export default WcaCompetitionList;
