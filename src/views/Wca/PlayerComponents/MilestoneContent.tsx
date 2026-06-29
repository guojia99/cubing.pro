import { resultsTimeFormat } from '@/views/Wca/utils/wca_results';
import { getCountryDisplayName } from '@/views/Wca/PlayerComponents/region/all_contiry';
import { Tag, Typography } from 'antd';
import React from 'react';
import './MilestoneContent.css';
import { useIntl } from '@/hooks/useIntlMessage';
import {
  getChartSeriesColors,
  getThemeColors,
  mixCssColors,
} from '@/theme/chartColors';
import { MEDAL_COLORS } from '@/theme/domainColors';
import { Milestone, MilestoneType, getCompName } from './player_milestone';

const { Text } = Typography;

export const defaultMilestoneTypeOptions: { label: string; value: MilestoneType }[] = [
  { label: '首次比赛', value: 'first_competition' },
  { label: '首次出国赛', value: 'first_overseas_competition' },
  { label: '参赛周年', value: 'competing_anniversary' },
  { label: '巨大进步', value: 'significant_improvement' },
  { label: '全项目达成', value: 'grand_slam' },
  { label: '回归', value: 'comeback' },
  { label: '盲拧首成', value: 'first_blindfolded_success' },
  { label: '领奖台', value: 'first_podium' },
  { label: '破纪录', value: 'record_breaker' },
  { label: '百次参赛', value: 'nth_competition' },
  { label: '三阶 sub-10 平均', value: 'first_333_average_sub10' },
  { label: '单届多领奖台', value: 'first_triple_podium_competition' },
  { label: '单年高频参赛', value: 'busy_competition_year' },
  { label: '单届多金', value: 'multi_gold_single_comp' },
];

// 颜色映射：每种里程碑类型对应一个 Ant Design 预设颜色
export const MILESTONE_COLOR_MAP: Record<MilestoneType, string> = {
  first_competition: 'blue',
  first_overseas_competition: 'geekblue',
  competing_anniversary: 'cyan',
  significant_improvement: 'green',
  grand_slam: 'gold',
  comeback: 'purple',
  first_blindfolded_success: 'volcano',
  first_podium: 'orange',
  record_breaker: 'red',
  nth_competition: 'lime',
  first_333_average_sub10: 'magenta',
  first_triple_podium_competition: 'orange',
  busy_competition_year: 'processing',
  multi_gold_single_comp: 'gold',
};

function bubbleStyle(accent: string, background: string, text: string) {
  return {
    bg: mixCssColors(accent, background, 12),
    border: accent,
    text,
  };
}

// 气泡颜色映射（随主题派生）
export function getBubbleColorMap(): Record<
  MilestoneType,
  { bg: string; border: string; text: string }
> {
  const c = getThemeColors();
  const s = getChartSeriesColors(14);
  const text = (color: string) => mixCssColors(color, c.foreground, 70);
  return {
    first_competition: bubbleStyle(s[0]!, c.background, text(s[0]!)),
    first_overseas_competition: bubbleStyle(s[3]!, c.background, text(s[3]!)),
    competing_anniversary: bubbleStyle(c.accent, c.background, text(c.accent)),
    significant_improvement: bubbleStyle(c.signalSuccess, c.background, text(c.signalSuccess)),
    grand_slam: bubbleStyle(c.signalWarning, c.background, text(c.signalWarning)),
    comeback: bubbleStyle(s[3]!, c.background, text(s[3]!)),
    first_blindfolded_success: bubbleStyle(c.signalWarning, c.background, text(c.signalWarning)),
    first_podium: bubbleStyle(c.destructive, c.background, text(c.destructive)),
    record_breaker: bubbleStyle(c.destructive, c.background, text(c.destructive)),
    nth_competition: bubbleStyle(c.destructive, c.background, text(c.destructive)),
    first_333_average_sub10: bubbleStyle(s[6]!, c.background, text(s[6]!)),
    first_triple_podium_competition: bubbleStyle(c.signalWarning, c.background, text(c.signalWarning)),
    busy_competition_year: bubbleStyle(c.signalInfo, c.background, text(c.signalInfo)),
    multi_gold_single_comp: bubbleStyle(c.signalWarning, c.background, text(c.signalWarning)),
  };
}

interface MilestoneItemContentProps {
  milestone: Milestone;
  isLeft: boolean; // 控制三角箭头方向
}

const MilestoneItemContent: React.FC<MilestoneItemContentProps> = ({ milestone, isLeft }) => {
  const intl = useIntl();
  const theme = getThemeColors();
  const bubbleStyleMap = getBubbleColorMap();
  const bubbleStyleEntry = bubbleStyleMap[milestone.type] || {
    bg: mixCssColors(theme.foreground, theme.background, 4),
    border: theme.border,
    text: theme.foreground,
  };

  const overseasDestinationLabel =
    milestone.type === 'first_overseas_competition'
      ? getCountryDisplayName(
          milestone.overseas_country_iso2,
          milestone.overseas_country_id,
        ).trim()
      : '';

  return (
    <div
      className="milestone-item-bubble"
      style={{
        backgroundColor: bubbleStyleEntry.bg,
        border: `1px solid ${bubbleStyleEntry.border}`,
        borderRadius: '12px',
        padding: '12px 16px',
        position: 'relative',
        wordBreak: 'break-word',
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
          [isLeft ? 'borderLeft' : 'borderRight']: `8px solid ${bubbleStyleEntry.border}`,
        }}
      />

      <Text style={{ color: bubbleStyleEntry.text, fontWeight: 800, marginBottom: '6px' }}>
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
                  ? MEDAL_COLORS.gold
                  : milestone.position === 2
                  ? MEDAL_COLORS.silver
                  : MEDAL_COLORS.bronze
              }
              style={{
                color: milestone.position === 1 ? theme.foreground : theme.card,
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

        {overseasDestinationLabel ? (
          <Tag color="purple" style={{ fontSize: 14 }}>
            {intl.formatMessage(
              { id: 'wca.milestone.overseasDestinationTag' },
              { country: overseasDestinationLabel },
            )}
          </Tag>
        ) : null}

        {((milestone.old_best_time !== undefined || milestone.new_best_time !== undefined) ||
          ((milestone.best_is_average || milestone.best_is_single) && milestone.result !== undefined)) && (
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

        {milestone.podium_count != null && milestone.podium_count >= 3 ? (
          <Tag color="orange">
            {intl.formatMessage({ id: 'wca.milestone.triplePodiumTag' }, { count: milestone.podium_count })}
          </Tag>
        ) : null}

        {milestone.gold_count != null && milestone.gold_count >= 2 ? (
          <Tag color="gold" style={{ color: theme.foreground, fontWeight: 700 }}>
            {intl.formatMessage({ id: 'wca.milestone.multiGoldTag' }, { count: milestone.gold_count })}
          </Tag>
        ) : null}

        {milestone.busy_calendar_year != null && milestone.busy_year_comp_count != null ? (
          <Tag color="processing">
            {intl.formatMessage(
              { id: 'wca.milestone.busyYearTag' },
              { year: milestone.busy_calendar_year, count: milestone.busy_year_comp_count },
            )}
          </Tag>
        ) : null}
      </div>

      {milestone.prior_333_round_lines && milestone.prior_333_round_lines.length > 0 ? (
        <div
          style={{
            marginTop: 10,
            width: '100%',
            maxHeight: 220,
            overflowY: 'auto',
            textAlign: isLeft ? 'right' : 'left',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {intl.formatMessage({ id: 'wca.milestone.prior333RoundsTitle' })}: {milestone.prior_333_round_lines.length}
          </Text>
        </div>
      ) : null}
    </div>
  );
};

export default MilestoneItemContent;
