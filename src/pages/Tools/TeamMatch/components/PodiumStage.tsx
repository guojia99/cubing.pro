import { getPodiumTeamIds } from '@/pages/Tools/TeamMatch/bracketComplete';
import { useTeamMatchStore } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import { Typography } from 'antd';
import React, { useMemo } from 'react';
import '../TeamMatch.less';

const PodiumStage: React.FC = () => {
  const { state } = useTeamMatchStore();
  const { session } = state;
  const { teams } = session;

  const podium = useMemo(() => getPodiumTeamIds(session), [session]);

  const nameOf = (id: string | null) => {
    if (!id) return '—';
    return teams.find((t) => t.id === id)?.name ?? id;
  };

  if (!podium) {
    return (
      <div className="tmPodiumRoot">
        <Typography.Text type="secondary">暂无领奖台数据（比赛可能尚未全部结束）。</Typography.Text>
      </div>
    );
  }

  const { gold, silver, bronze } = podium;

  return (
    <div className="tmPodiumRoot">
      <Typography.Title level={4} className="tmPodiumTitle">
        比赛成绩
      </Typography.Title>
      <div className="tmPodiumStage" aria-label="领奖台">
        {/* 左：亚军 · 中：冠军 · 右：季军 — 高度中 > 左 > 右 */}
        <div className="tmPodiumLane tmPodiumLaneSecond">
          <div className="tmPodiumCard">
            <span className="tmPodiumMedal" aria-hidden>
              🥈
            </span>
            <Typography.Text className="tmPodiumLabel">亚军</Typography.Text>
            <Typography.Text strong className="tmPodiumTeam">
              {nameOf(silver)}
            </Typography.Text>
          </div>
          <div className="tmPodiumRiser tmPodiumRiserSecond" />
        </div>
        <div className="tmPodiumLane tmPodiumLaneFirst">
          <div className="tmPodiumCard tmPodiumCardChamp">
            <span className="tmPodiumMedal tmPodiumMedalGold" aria-hidden>
              🥇
            </span>
            <Typography.Text className="tmPodiumLabel">冠军</Typography.Text>
            <Typography.Text strong className="tmPodiumTeam">
              {nameOf(gold)}
            </Typography.Text>
          </div>
          <div className="tmPodiumRiser tmPodiumRiserFirst" />
        </div>
        <div className="tmPodiumLane tmPodiumLaneThird">
          <div className="tmPodiumCard">
            <span className="tmPodiumMedal" aria-hidden>
              🥉
            </span>
            <Typography.Text className="tmPodiumLabel">季军</Typography.Text>
            <Typography.Text strong className="tmPodiumTeam">
              {bronze ? nameOf(bronze) : '—'}
            </Typography.Text>
          </div>
          <div className="tmPodiumRiser tmPodiumRiserThird" />
        </div>
      </div>
    </div>
  );
};

export default PodiumStage;
