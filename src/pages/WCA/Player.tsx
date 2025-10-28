import React, { useEffect, useState } from 'react';
import { useParams } from '@@/exports';
import { getWCAPersonCompetitions, getWCAPersonProfile, WCACompetition, WcaProfile } from '@/services/wca/player';
import { Spin } from 'antd';
import WCAPlayerDetails from '@/pages/WCA/PlayerComponents/PlayerDetails';
import { getWCAPersonResults, WCAResult } from '@/services/wca/playerResults';
import WCAPlayerResultTable from '@/pages/WCA/PlayerComponents/PlayerResultTable';
import WCAPlayerStaticsTab from '@/pages/WCA/PlayerComponents/WCAPlayerStaticsTab';

const WCAPlayer: React.FC = () => {
  const { wcaId } = useParams();
  const [is404, setIs404] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [wcaProfile, setWcaProfile] = useState<WcaProfile>();
  const [wcaResults, setWcaResults] = useState<WCAResult[]>([])
  const [comps, setComps] = useState<WCACompetition[]>([]);



  const fetchPlayer = async () => {
    if (!wcaId) {
      setIs404(true);
      return; // 提前返回，不再继续
    }

    try {
      // 并行发起三个请求（效率更高），并等待全部完成
      const [profileRes, compsRes, resultsRes] = await Promise.all([
        getWCAPersonProfile(wcaId),
        getWCAPersonCompetitions(wcaId),
        getWCAPersonResults(wcaId),
      ]);

      // 所有请求成功
      setWcaProfile(profileRes);
      setComps(compsRes);
      setWcaResults(resultsRes);
      setIs404(false);

    } catch (error) {
      // 任何一个请求失败，都视为 404
      console.error('Failed to fetch player data:', error);
      setIs404(true);
      setWcaProfile(undefined);
      setComps([]);
      setWcaResults([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPlayer().finally(() => {
      setLoading(false); // 无论成功或失败，都结束 loading
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wcaId]);


  if (loading || (!wcaProfile)) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (is404){
    return (
      <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>未找到该选手信息</div>
    )
  }

  if (wcaResults){
    document.title = `${wcaProfile.person.name} 的WCA成绩页`
  }


  return (
    <div>
      <WCAPlayerDetails wcaProfile={wcaProfile} wcaResults={wcaResults} />
      <WCAPlayerResultTable wcaProfile={wcaProfile} wcaResults={wcaResults} />
      <WCAPlayerStaticsTab wcaProfile={wcaProfile} wcaResults={wcaResults} comps={comps}/>
    </div>
  );
};

export default WCAPlayer;
// 个人详情数据
//   头像、国家地区
// 个人最佳成绩
// 奖牌统计
// 记录统计
// 排名总和
// 领奖台
// 1.个人比赛数据统计页
//    1.1按比赛
//    1.2按项目
// 2.个人成长路线统计页
// 3.年度统计
// 4. 赛事列表
