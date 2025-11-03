
import { Avatar, Badge, Card, Divider, Image, Space, Table, Typography } from 'antd';
import 'flag-icons/css/flag-icons.min.css';
import React from 'react';
import './PlayerDetails.css';
import { WcaProfile, WCAResult } from '@/services/wca/types';

interface WCAPlayerDetailsProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
}

const { Title, Text } = Typography;

const WCAPlayerDetails: React.FC<WCAPlayerDetailsProps> = ({ wcaProfile, wcaResults }) => {
  const { person, competition_count } = wcaProfile;

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
      title: '国家 / 地区',
      dataIndex: 'country',
      key: 'country',
      align: 'center' as const,
      render: (country: { iso2: string; name: string }) => {
        let ct = `fi-${country.iso2.toLowerCase()}`;
        if (country.iso2 === 'TW') {
          ct = `fi-cn`;
        }
        return (
          <Space>
            <span
              className={`fi ${ct} fi-3x`}
              style={{ marginRight: 8, minWidth: 20 }}
              title={country.name}
            />
            {country.name}
          </Space>
        );
      },
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      align: 'center' as const,
      render: (g: string) => (g === 'm' ? '男' : g === 'f' ? '女' : '其他'),
    },
    {
      title: 'WCA ID',
      dataIndex: 'wcaId',
      key: 'wcaId',
      align: 'center' as const,
      render: (id: string) => (
        <Space>
          <a href={person.url} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://cubing.com/f/images/wca.png"
              alt="WCA Logo"
              width={16}
              height={16}
              preview={false}
            />
          </a>
          <a href={`https://cubing.com/results/person/${person.wca_id}`} target="_blank" rel="noopener noreferrer">
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
      title: '比赛次数',
      dataIndex: 'competition',
      key: 'competition',
      align: 'center' as const,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} overflowCount={99999} />
      ),
    },
    {
      title: '复原次数 / 尝试次数',
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
    const iso2 = person.country.iso2?.toUpperCase() || '';
    if (['CN', 'HK', 'TW'].includes(iso2)) {
      // 提取中文字符部分（含“·”）
      return person.name.match(/[\u4e00-\u9fa5·]+/g)?.join('') || person.name;
    }
    return person.name;
  })();

  // 表格数据（只有一行）
  const data = [
    {
      key: '1',
      name: displayName,
      gender: person.gender,
      country: person.country,
      competition: competition_count,
      totalSolves: totalSolves,
      totalAttempts: totalAttempts,
      wcaId: person.wca_id,
      career: "",
    },
  ];

  return (
    <div className="wca-player-container">
      <Card
        hoverable
        style={{ minWidth: 900, margin: '0 auto', borderRadius: 16 }}
        bordered={false}
      >
        {/* 头像与姓名 */}
        <div className="header-section">
          <Avatar src={person.avatar.thumb_url} alt={`${person.name} 的头像`} size={100} />
          <Title level={3} style={{ margin: '8px 0 8px 0' }}>
            {displayName}
          </Title>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* 横向信息表格 */}
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          size="middle"
          style={{
            borderRadius: 8,
            background: '#fff',
            textAlign: 'center',
          }}
        />
      </Card>
    </div>
  );
};

export default WCAPlayerDetails;
