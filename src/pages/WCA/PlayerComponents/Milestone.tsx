// MilestoneTimeline.tsx
import React, { useState } from 'react';
import { Timeline, Tag, Card, Space, Button, Typography, Badge } from 'antd';
import { getCompName, GetMilestones, Milestone, MilestoneType } from './player_milestone';
import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { WCACompetition, WcaProfile, WCAResult } from '@/services/wca/types';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';

const { Text } = Typography;

// 颜色映射：每种里程碑类型对应一个 Ant Design 预设颜色
const MILESTONE_COLOR_MAP: Record<MilestoneType, string> = {
  first_competition: 'blue',
  significant_improvement: 'green',
  grand_slam: 'gold',
  comeback: 'purple',
  first_blindfolded_success: 'volcano',
  first_podium: 'orange',
  record_breaker: 'red',
  nth_competition: 'lime',
};

// 气泡颜色映射
const BUBBLE_COLOR_MAP: Record<MilestoneType, { bg: string; border: string; text: string }> = {
  first_competition: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  significant_improvement: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  grand_slam: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  comeback: { bg: '#e9d5ff', border: '#a855f7', text: '#7e22ce' },
  first_blindfolded_success: { bg: '#ffedd5', border: '#f4bc94', text: '#c2410c' },
  first_podium: { bg: '#f8d7da', border: '#c92a2a', text: '#801b1b' },
  record_breaker: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
  nth_competition: { bg: '#f6f6f6', border: '#ff0000', text: '#e2134e' },
};
// 获取显示用的年月（YYYY-MM）
const getYearMonth = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  // 支持 YYYY-MM-DD 或 ISO 8601
  const match = dateStr.match(/^(\d{4}-\d{2})/);
  return match ? match[1] : null;
};

// 排序工具函数
const sortMilestones = (milestones: Milestone[], ascending: boolean): Milestone[] => {
  return [...milestones].sort((a, b) => {
    const dateA = a.date || a.achieved_on || a.new_competition_date || a.last_competition_date || a.date_achieved || '';
    const dateB = b.date || b.achieved_on || b.achieved_on || b.new_competition_date || b.last_competition_date || b.date_achieved || '';

    if (!dateA && !dateB) return 0;
    if (!dateA) return ascending ? 1 : -1;
    if (!dateB) return ascending ? -1 : 1;

    return ascending
      ? dateA.localeCompare(dateB)
      : dateB.localeCompare(dateA);
  });
};

interface MilestoneTimelineProps {
  wcaProfile: WcaProfile;
  wcaResults: WCAResult[];
  comps: WCACompetition[];
}

const MilestoneTimelines: React.FC<MilestoneTimelineProps> = ({
                                                                wcaProfile,
                                                                wcaResults,
                                                                comps,
                                                              }) => {
  const [ascending, setAscending] = useState<boolean>(false);

  const milestones = GetMilestones(wcaProfile, wcaResults, comps);
  console.log(milestones)

  const sortedMilestones = sortMilestones(milestones, ascending);

  return (
    <Card
      title={
        <Space>
          <Text strong>选手里程碑</Text>
          <Button size="small" onClick={() => setAscending(!ascending)}>
            {ascending ? '倒序' : '正序'}
          </Button>
        </Space>
      }
    >
      <Timeline mode="alternate">
        {sortedMilestones.map((m, index) => {
          const yearMonth = getYearMonth(
            m.date || m.achieved_on || m.new_competition_date || m.last_competition_date || m.date_achieved
          );

          const bubbleStyle = BUBBLE_COLOR_MAP[m.type] || { bg: '#f5f5f5', border: '#d9d9d9', text: '#000' };

          // 根据索引判断气泡位置（左或右）
          const isLeft = index % 2 === 1;

          return (
            <Timeline.Item
              key={index}
              dot={
                <Badge
                  color={MILESTONE_COLOR_MAP[m.type]}
                  style={{ boxShadow: '0 0 0 2px #fff', width: 16, height: 16 }}
                />
              }
              label={yearMonth ? <Text type="secondary">{yearMonth}</Text> : null}
            >
              <div
                style={{
                  backgroundColor: bubbleStyle.bg,
                  border: `1px solid ${bubbleStyle.border}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  maxWidth: '100%',
                  display: 'inline-block',
                  position: 'relative',
                }}
              >
                {/* 三角形箭头 - 根据位置显示在左侧或右侧 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    [isLeft ? 'right' : 'left']: '-8px',
                    width: 0,
                    height: 0,
                    borderTop: `6px solid transparent`,
                    borderBottom: `6px solid transparent`,
                    [isLeft ? 'borderLeft' : 'borderRight']: `8px solid ${bubbleStyle.border}`,
                  }}
                />
                <Text style={{ color: bubbleStyle.text, fontWeight: 800 }}>{m.description}</Text>
                <Space direction="horizontal" size={4} style={{ display: 'flex', marginTop: 2}}>
                  {/*{m.event_id && (*/}
                  {/*  <Tag color="cyan" style={{ marginRight: 4, marginTop: 4 }}>*/}
                  {/*    {m.event_id}*/}
                  {/*  </Tag>*/}
                  {/*)}*/}
                  {m.record_type && (
                    <Tag color={MILESTONE_COLOR_MAP[m.type]} style={{ marginTop: 4 }}>
                      {m.record_type} 记录
                    </Tag>
                  )}

                  {m.position && m.round_type_id === 'f' && (
                    <Tag
                      color={
                        m.position === 1
                          ? '#ffd700' // 金牌 - 金色
                          : m.position === 2
                            ? '#c0c0c0' // 银牌 - 银色
                            : '#cd7f32' // 铜牌 - 青铜色
                      }
                      style={{
                        color: m.position === 1 ? '#000' : '#fff', // 金牌用黑色文字更清晰，银/铜用白色
                        fontWeight: 'bold',
                      }}
                    >
                      {m.position === 1 ? '🥇 金牌' : m.position === 2 ? '🥈 银牌' : '🥉 铜牌'}
                    </Tag>
                  )}
                  {(m.competition_id || m.competition_name) && (
                    <Tag color={"cyan"} style={{fontSize: 14}}>{getCompName(m.competition_id || m.competition_name || '')}</Tag>
                  )}
                  {(m.old_best_time !== undefined || m.new_best_time !== undefined) && (
                    <>

                      <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 4 }}>
                        {m.best_is_average? <Tag color={"red"}>平均</Tag> : <Tag color={"blue"}>单次</Tag>}
                        {m.old_best_time && m.new_best_time
                          ? `从 ${resultsTimeFormat(m.new_best_time, m.event_id || '333', true)} → ${resultsTimeFormat(m.old_best_time, m.event_id || '333', true)}`
                          : m.result !== undefined
                            ? `成绩: ${resultsTimeFormat(m.result, m.event_id || '333', true)}`
                            : ''}
                      </Text>
                    </>
                  )}
                </Space>
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Card>
  );
};

export default MilestoneTimelines;



