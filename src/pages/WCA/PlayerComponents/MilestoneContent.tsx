import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { Tag, Typography } from 'antd';
import React from 'react';
import './MilestoneContent.less';
import { useIntl } from '@@/plugin-locale';
import { Milestone, MilestoneType, getCompName } from './player_milestone';

const { Text } = Typography;

export const defaultMilestoneTypeOptions: { label: string; value: MilestoneType }[] = [
  { label: '首次比赛', value: 'first_competition' },
  { label: '巨大进步', value: 'significant_improvement' },
  { label: '大满贯', value: 'grand_slam' },
  { label: '回归', value: 'comeback' },
  { label: '盲拧首成', value: 'first_blindfolded_success' },
  { label: '领奖台', value: 'first_podium' },
  { label: '破纪录', value: 'record_breaker' },
  { label: '百次参赛', value: 'nth_competition' },
];

// 颜色映射：每种里程碑类型对应一个 Ant Design 预设颜色
export const MILESTONE_COLOR_MAP: Record<MilestoneType, string> = {
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
export const BUBBLE_COLOR_MAP: Record<MilestoneType, { bg: string; border: string; text: string }> =
  {
    first_competition: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    significant_improvement: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    grand_slam: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
    comeback: { bg: '#e9d5ff', border: '#a855f7', text: '#7e22ce' },
    first_blindfolded_success: { bg: '#ffedd5', border: '#f4bc94', text: '#c2410c' },
    first_podium: { bg: '#f8d7da', border: '#c92a2a', text: '#801b1b' },
    record_breaker: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
    nth_competition: { bg: '#f6f6f6', border: '#ff0000', text: '#e2134e' },
  };

interface MilestoneItemContentProps {
  milestone: Milestone;
  isLeft: boolean; // 控制三角箭头方向
}

const MilestoneItemContent: React.FC<MilestoneItemContentProps> = ({ milestone, isLeft }) => {
  const intl = useIntl();
  const bubbleStyle = BUBBLE_COLOR_MAP[milestone.type] || {
    bg: '#f5f5f5',
    border: '#d9d9d9',
    text: '#000',
  };

  return (
    <div
      style={{
        backgroundColor: bubbleStyle.bg,
        border: `1px solid ${bubbleStyle.border}`,
        borderRadius: '12px',
        padding: '12px 16px',
        position: 'relative',
        wordBreak: 'break-word',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-end' : 'flex-start',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 三角形箭头 */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          [isLeft ? 'right' : 'left']: '-8px',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          [isLeft ? 'borderLeft' : 'borderRight']: `8px solid ${bubbleStyle.border}`,
        }}
      />

      <Text style={{ color: bubbleStyle.text, fontWeight: 800, marginBottom: '6px' }}>
        {milestone.description}
      </Text>

      {/* 使用 flex-wrap 容器让 Tag 自动换行，手机端防止溢出 */}
      <div
        className="milestone-tag-container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          justifyContent: isLeft ? 'flex-end' : 'flex-start',
          width: '100%',
          minWidth: 0,
        }}
      >
        {milestone.record_type && (
          <Tag color={MILESTONE_COLOR_MAP[milestone.type]}>
            {milestone.record_type} {intl.formatMessage({ id: 'wca.milestone.record' })}
          </Tag>
        )}

        {milestone.position &&
          (milestone.round_type_id === 'f' ||
            milestone.round_type_id === 'c' ||
            milestone.round_type_id === 'b') && (
            <Tag
              color={
                milestone.position === 1
                  ? '#ffd700'
                  : milestone.position === 2
                  ? '#c0c0c0'
                  : '#cd7f32'
              }
              style={{
                color: milestone.position === 1 ? '#000' : '#fff',
                fontWeight: 'bold',
              }}
            >
              {milestone.position === 1
                ? intl.formatMessage({ id: 'wca.milestone.gold' })
                : milestone.position === 2
                ? intl.formatMessage({ id: 'wca.milestone.silver' })
                : intl.formatMessage({ id: 'wca.milestone.bronze' })}
            </Tag>
          )}

        {(milestone.competition_id || milestone.competition_name) && (
          <Tag color="cyan" style={{ fontSize: 14 }}>
            {getCompName(milestone.competition_id || milestone.competition_name || '')}
          </Tag>
        )}

        {(milestone.old_best_time !== undefined || milestone.new_best_time !== undefined) && (
          <>
            {milestone.best_is_single && (
              <Tag color="red">
                {intl.formatMessage({ id: 'wca.milestone.single' })}{' '}
                {milestone.old_best_time && milestone.new_best_time
                  ? `${resultsTimeFormat(
                      milestone.old_best_time,
                      milestone.event_id || '333',
                      true,
                    )} → ${resultsTimeFormat(
                      milestone.new_best_time,
                      milestone.event_id || '333',
                      true,
                    )}`
                  : milestone.result !== undefined
                  ? `${intl.formatMessage({ id: 'wca.milestone.result' })}: ${resultsTimeFormat(
                      milestone.result,
                      milestone.event_id || '333',
                      true,
                    )}`
                  : ''}
              </Tag>
            )}
            {milestone.best_is_average && (
              <Tag color="blue">
                {intl.formatMessage({ id: 'wca.milestone.average' })}{' '}
                {milestone.old_best_avg_time && milestone.new_best_avg_time
                  ? `${resultsTimeFormat(
                      milestone.old_best_avg_time,
                      milestone.event_id || '333',
                      true,
                    )} → ${resultsTimeFormat(
                      milestone.new_best_avg_time,
                      milestone.event_id || '333',
                      true,
                    )}`
                  : milestone.result !== undefined
                  ? `${intl.formatMessage({ id: 'wca.milestone.result' })}: ${resultsTimeFormat(
                      milestone.result,
                      milestone.event_id || '333',
                      true,
                    )}`
                  : ''}
              </Tag>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MilestoneItemContent;
