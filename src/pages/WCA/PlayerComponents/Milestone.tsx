
import { WCACompetition, WCAResult, WcaProfile } from '@/services/wca/types';
import { SelectProps, Typography } from 'antd';
import { Badge, Button, Card, Select, Space, Tag, Timeline } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  GetMilestones,
  MILESTONE_TYPE_PRIORITY,
  Milestone,
  MilestoneType,
} from './player_milestone';
import MilestoneItemContent, {
  defaultMilestoneTypeOptions,
  MILESTONE_COLOR_MAP,
} from '@/pages/WCA/PlayerComponents/MilestoneContent';
const { Text } = Typography;
type TagRender = SelectProps['tagRender'];

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
    const priorityA = MILESTONE_TYPE_PRIORITY[a.type];
    const priorityB = MILESTONE_TYPE_PRIORITY[b.type];

    // 2. 同类型内按日期排序
    const dateA =
      a.date ||
      a.achieved_on ||
      a.new_competition_date ||
      a.last_competition_date ||
      a.date_achieved ||
      '';

    const dateB =
      b.date ||
      b.achieved_on ||
      b.new_competition_date ||
      b.last_competition_date ||
      b.date_achieved ||
      '';

    // 处理缺失日期：空日期排在后面（如果升序）或前面（如果降序）
    if (!dateA && !dateB) return 0;
    if (!dateA) return ascending ? 1 : -1;
    if (!dateB) return ascending ? -1 : 1;

    if (dateA === dateB) {
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 始终 type 优先，固定顺序，不受 ascending 影响
      }
    }

    // 比较日期字符串（假设格式为 ISO 8601 如 '2023-05-01'）
    return ascending ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
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

  const [excludedTypes, setExcludedTypes] = useState<MilestoneType[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    const sortedMilestones = sortMilestones(milestones, ascending);
    const fs = sortedMilestones.filter((m) => !excludedTypes.includes(m.type));
    setFilteredMilestones(fs);
  }, [excludedTypes, milestones, ascending]);

  const milestoneTypesPresent = new Set(milestones.map((m) => m.type));
  const milestoneTypeOptions = defaultMilestoneTypeOptions
    .filter((opt) => milestoneTypesPresent.has(opt.value))
    .sort((a, b) => MILESTONE_TYPE_PRIORITY[a.value] - MILESTONE_TYPE_PRIORITY[b.value]);

  const tagRender: TagRender = (props) => {
    const { label, value, closable, onClose } = props;

    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    return (
      <Tag
        color={MILESTONE_COLOR_MAP[value as MilestoneType]}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginInlineEnd: 4 }}
      >
        {label}
      </Tag>
    );
  };

  return (
    <Card
      title={
        <div style={{ paddingTop: 16, paddingBottom: 16 }}>
          <Space>
            <Text strong>选手里程碑</Text>
            <Text type="secondary">共有 {filteredMilestones.length} 条里程碑</Text>
          </Space>

          <Button size="small" onClick={() => setAscending(!ascending)} style={{ float: 'right' }}>
            {ascending ? '倒序' : '正序'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ marginRight: 8 }}>
              不看里程碑{' '}
            </Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="选择要排除的里程碑类型"
              value={excludedTypes}
              onChange={(value) => setExcludedTypes(value as MilestoneType[])}
              style={{ width: '100%', maxWidth: 200 }}
              options={milestoneTypeOptions}
              tagRender={tagRender}
              optionRender={(option) => {
                return (
                  <>
                    <Tag color={MILESTONE_COLOR_MAP[option.data.value as MilestoneType]}>
                      {option.data.label}(
                      {milestones.filter((r) => r.type === option.data.value).length})
                    </Tag>
                  </>
                );
              }}
            ></Select>
          </div>
        </div>
      }
    >
      <Timeline mode="alternate">
        {filteredMilestones.map((m, index) => {
          const yearMonth = getYearMonth(
            m.date ||
            m.achieved_on ||
            m.new_competition_date ||
            m.last_competition_date ||
            m.date_achieved
          );

          const isLeft = index % 2 === 1;

          return (
            <Timeline.Item
              key={`${m.type}-${index}`} // 更健壮的 key
              dot={
                <Badge
                  color={MILESTONE_COLOR_MAP[m.type as MilestoneType]}
                  style={{ boxShadow: '0 0 0 2px #fff', width: 16, height: 16 }}
                />
              }
              label={yearMonth ? <Text type="secondary">{yearMonth}</Text> : null}
            >
              <MilestoneItemContent milestone={m} isLeft={isLeft} />
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Card>
  );
};

export default MilestoneTimelines;
