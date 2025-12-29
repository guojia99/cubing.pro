import WCAPlayerDetails from '@/pages/WCA/PlayerComponents/PlayerDetails';
import WCAPlayerResultTable from '@/pages/WCA/PlayerComponents/PlayerResultTable';
import WCAPlayerStaticsTab from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTab';
import {
  GetPlayerRankTimers,
  getWCAPersonCompetitions,
  getWCAPersonProfile,
  getWCAPersonResults,
} from '@/services/cubing-pro/wca/player';
import {
  StaticWithTimerRank,
  WCACompetition,
  WCAResult,
  WcaProfile,
} from '@/services/cubing-pro/wca/types';
import { apiGetWCAPersonProfile } from '@/services/cubing-pro/wca/wca_api';
import { useParams } from '@@/exports';
import { Col, Row, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

const notAvatarUrl =
  'https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png';
const banAvatarKey = ['2016XUWE02'];

const WCAPlayer: React.FC = () => {
  const { wcaId } = useParams();
  const [is404, setIs404] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [wcaProfile, setWcaProfile] = useState<WcaProfile>();
  const [wcaResults, setWcaResults] = useState<WCAResult[]>([]);
  const [comps, setComps] = useState<WCACompetition[]>([]);
  const [wcaRankTimer, setWcaRankTimer] = useState<StaticWithTimerRank[]>([]);

  // ✅ 设置页面标题的 useEffect —— 必须放在 return 之前，且无条件调用
  useEffect(() => {
    if (!loading && wcaProfile?.name) {
      document.title = `${wcaProfile.name} 的WCA成绩页`;
    }
  }, [loading, wcaProfile?.name]); // 依赖项确保只在必要时更新

  const fetchPlayer = async () => {
    if (!wcaId) {
      setLoading(false);
      setIs404(true);
      return;
    }

    try {
      const [profileRes, compsRes, resultsRes, rankTimers] = await Promise.all([
        getWCAPersonProfile(wcaId),
        getWCAPersonCompetitions(wcaId),
        getWCAPersonResults(wcaId),
        GetPlayerRankTimers(wcaId),
      ]);

      // 处理 banAvatarKey
      if (banAvatarKey.includes(wcaId)) {
        profileRes.thumb_url = notAvatarUrl;
      }

      // 先设置基础 profile
      setWcaProfile(profileRes);
      setComps(compsRes);
      setWcaResults(resultsRes);
      setWcaRankTimer(rankTimers);
      setIs404(false);

      // ✅ 异步获取更准确的头像 URL（不阻塞主流程）
      apiGetWCAPersonProfile(wcaId)
        .then(res => {
          // 安全更新：基于当前状态创建新对象
          setWcaProfile(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              thumb_url: res.person.avatar.thumb_url || prev.thumb_url, // fallback to existing
            };
          });
        })
        .catch(err => {
          console.warn('Failed to fetch updated avatar from WCA API:', err);
          // 可选：保留原头像，或设为默认
        });

    } catch (error) {
      console.error('Failed to fetch player data:', error);
      setIs404(true);
      setWcaProfile(undefined);
      setComps([]);
      setWcaResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPlayer().then()
  }, [wcaId]);

  // ❌ 所有 return 必须在所有 hooks 之后
  if (is404) {
    return (
      <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>未找到该选手信息</div>
    );
  }

  if (loading || !wcaProfile) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // ✅ 正常渲染
  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[0, 24]} style={{ padding: '0 16px' }}>
        <Col span={24}>
          <WCAPlayerDetails wcaProfile={wcaProfile} wcaResults={wcaResults} />
        </Col>
        <Col span={24}>
          <WCAPlayerResultTable wcaProfile={wcaProfile} wcaResults={wcaResults} />
        </Col>
        <Col span={24}>
          <WCAPlayerStaticsTab
            wcaProfile={wcaProfile}
            wcaResults={wcaResults}
            comps={comps}
            wcaRankTimer={wcaRankTimer}
          />
        </Col>
      </Row>
    </div>
  );
};
export default WCAPlayer;
