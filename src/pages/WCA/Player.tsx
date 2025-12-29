import React, { useEffect, useState } from 'react';
import { useParams } from '@@/exports';
import { Col, Row, Spin } from 'antd';
import WCAPlayerDetails from '@/pages/WCA/PlayerComponents/PlayerDetails';
import WCAPlayerResultTable from '@/pages/WCA/PlayerComponents/PlayerResultTable';
import WCAPlayerStaticsTab from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTab';
import {
  GetPlayerRankTimers,
  getWCAPersonCompetitions,
  getWCAPersonProfile,
  getWCAPersonResults,
} from '@/services/cubing-pro/wca/player';
import { StaticWithTimerRank, WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';

const notAvatarUrl = "https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png";
const banAvatarKey = ["2016XUWE02"];

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

      if (banAvatarKey.includes(wcaId)) {
        profileRes.thumb_url = notAvatarUrl;
      }
      // ⚠️ 注意：下面这行会覆盖所有头像！确认是否需要
      // profileRes.thumb_url = notAvatarUrl;

      setWcaProfile(profileRes);
      setComps(compsRes);
      setWcaResults(resultsRes);
      setWcaRankTimer(rankTimers);
      setIs404(false);
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
    fetchPlayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wcaId]);

  // ❌ 所有 return 必须在所有 hooks 之后
  if (is404) {
    return (
      <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
        未找到该选手信息
      </div>
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
