import { Avatar, Badge, Card, Divider, Image, Space, Table, Typography } from 'antd';
import 'flag-icons/css/flag-icons.min.css';
import React from 'react';
import { useIntl } from '@@/plugin-locale';
import './PlayerDetails.css';
import { getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';
import { WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';

interface WCAPlayerDetailsProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
}

const { Title, Text } = Typography;

const WCAPlayerDetails: React.FC<WCAPlayerDetailsProps> = ({ wcaProfile, wcaResults }) => {
  const intl = useIntl();

  // 计算总复原次数（有 single 或 average 都计数一次）
  let totalSolves = 0;
  let totalAttempts = 0;

 if (wcaResults){
   for (let i = 0; i < wcaResults.length; i++) {
     const res = wcaResults[i];

     if (!res.attempts) {
       continue;
     }
     for (let j = 0; j < res.attempts.length; j++) {
       const attp = res.attempts[j];
       if (attp === 0){
         continue;
       }
       totalAttempts += 1
       if (attp !== -1){
         totalSolves += 1
       }
     }
   }
 }


  // 表格列定义
  const columns = [
    {
      title: intl.formatMessage({ id: 'wca.playerDetails.country' }),
      dataIndex: 'country_iso2',
      key: 'country_iso2',
      align: 'center' as const,
      render: (country_iso2:string) => {
        let ct = `fi-${country_iso2.toLowerCase()}`;
        if (country_iso2 === 'TW') {
          ct = `fi-cn`;
        }
        return (
          <Space>
            <span
              className={`fi ${ct} fi-3x`}
              style={{ marginRight: 8, minWidth: 20 }}
              title={getCountryNameByIso2(country_iso2)}
            />
            {getCountryNameByIso2(country_iso2)}
          </Space>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'wca.playerDetails.gender' }),
      dataIndex: 'gender',
      key: 'gender',
      align: 'center' as const,
      render: (g: string) =>
        g === 'm'
          ? intl.formatMessage({ id: 'wca.playerDetails.genderMale' })
          : g === 'f'
          ? intl.formatMessage({ id: 'wca.playerDetails.genderFemale' })
          : intl.formatMessage({ id: 'wca.playerDetails.genderOther' }),
    },
    {
      title: intl.formatMessage({ id: 'wca.playerDetails.wcaId' }),
      dataIndex: 'wcaId',
      key: 'wcaId',
      align: 'center' as const,
      render: (id: string) => (
        <Space>
          <a href={wcaProfile.thumb_url} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://cubing.com/f/images/wca.png"
              alt="WCA Logo"
              width={16}
              height={16}
              preview={false}
            />
          </a>
          <a href={`https://cubing.com/results/person/${wcaProfile.wcaId}`} target="_blank" rel="noopener noreferrer">
            <Image
              src=" https://cubing.com/f/images/icon196.png"
              alt="Cubing China Logo"
              width={16}
              height={16}
              preview={false}
            />
          </a>


          <Text>{id}</Text>
        </Space>
      ),
    },

    {
      title: intl.formatMessage({ id: 'wca.playerDetails.competitionCount' }),
      dataIndex: 'competition',
      key: 'competition',
      align: 'center' as const,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} overflowCount={99999} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'wca.playerDetails.solvesAttempts' }),
      dataIndex: 'solves',
      key: 'solves',
      align: 'center' as const,
      render: (solves: number, res: any) => (
        <Space>
          <Badge count={res.totalSolves} style={{ backgroundColor: '#25659f' }} overflowCount={9999999} />
          /
          <Badge count={res.totalAttempts} style={{ backgroundColor: '#e67a4c' }} overflowCount={9999999} />
        </Space>
      ),
    },
  ];

  // 根据国家代码决定显示的名字
  const displayName = (() => {
    const iso2 = wcaProfile.country_iso2?.toUpperCase() || '';
    if (['CN', 'HK', 'TW'].includes(iso2)) {
      // 提取中文字符部分（含“·”）
      return wcaProfile.name.match(/[\u4e00-\u9fa5·]+/g)?.join('') || wcaProfile.name;
    }
    return wcaProfile.name;
  })();

  // 表格数据（只有一行）
  const data = [
    {
      key: '1',
      name: displayName,
      gender: wcaProfile.gender,
      country_iso2: wcaProfile.country_iso2,
      competition: wcaProfile.competition_count,
      totalSolves: totalSolves,
      totalAttempts: totalAttempts,
      wcaId: wcaProfile.wcaId,
      career: "",
    },
  ];

  return (
    <div className="wca-player-container">
      <Card
        hoverable
        style={{ width: '100%', margin: '0 auto', borderRadius: 16 }}
        bordered={false}
      >
        {/* 头像与姓名 */}
        <div className="header-section">
          <Avatar
            src={wcaProfile.thumb_url}
            alt={intl.formatMessage({ id: 'wca.playerDetails.avatarAlt' }, { name: wcaProfile.name })}
            size={100}
          />
          <Title level={3} style={{ margin: '8px 0 8px 0' }}>
            {displayName}
          </Title>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* 横向信息表格 - 手机端可横向滚动 */}
        <div style={{ overflowX: 'auto', margin: '0 -1px' }}>
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: 'max-content' }}
            style={{
              borderRadius: 8,
              background: '#fff',
              textAlign: 'center',
              minWidth: 500,
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default WCAPlayerDetails;
