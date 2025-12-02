import { WCACompetition, WCAResult, WcaProfile } from '@/services/wca/types';
import {
  Badge,
  Button,
  Card,
  Form, InputNumber,
  Select,
  SelectProps,
  Slider,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

import 'antd/dist/reset.css'; // 如果你使用的是 antd v5，请用这个引入样式

import MilestoneItemContent, {
  MILESTONE_COLOR_MAP,
  defaultMilestoneTypeOptions,
} from '@/pages/WCA/PlayerComponents/MilestoneContent';
import {
  GetMilestones,
  MILESTONE_TYPE_PRIORITY,
  Milestone,
  MilestoneType,
} from './player_milestone';

const { Text } = Typography;
type TagRender = SelectProps['tagRender'];

// 获取显示用的年月（YYYY-MM-DD）
const getYearMonthDay = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  // 支持 YYYY-MM-DD 或 ISO 8601
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
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
  const [excludedTypes, setExcludedTypes] = useState<MilestoneType[]>([]);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [milestoneTypeOptions, setMilestoneTypeOptions] = useState<
    { label: string; value: MilestoneType }[]
  >([]);
  const [improvementNumber, setImprovementNumber] = useState(33);

  useEffect(() => {
    const milestones = GetMilestones(wcaProfile, wcaResults, comps, improvementNumber);
    setAllMilestones(milestones);
    const sortedMilestones = sortMilestones(milestones, ascending);
    const fs = sortedMilestones.filter((m) => !excludedTypes.includes(m.type));
    setFilteredMilestones(fs);

    const milestoneTypesPresent = new Set(milestones.map((m) => m.type));
    const mOpt = defaultMilestoneTypeOptions
      .filter((opt) => milestoneTypesPresent.has(opt.value))
      .sort((a, b) => MILESTONE_TYPE_PRIORITY[a.value] - MILESTONE_TYPE_PRIORITY[b.value]);
    setMilestoneTypeOptions(mOpt);
  }, [excludedTypes, ascending, improvementNumber]);

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
            <Form.Item label="不看里程碑">
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
                        {allMilestones.filter((r) => r.type === option.data.value).length})
                      </Tag>
                    </>
                  );
                }}
              ></Select>
            </Form.Item>
          </div>
          <div style={{ marginTop: 16, minWidth: '200px', width: '33%' }}>
            <Form.Item label="进步阈值">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Slider
                  min={10}
                  max={100}
                  value={improvementNumber}
                  onChange={setImprovementNumber}
                  tooltip={{ formatter: (value) => `${value}%` }}
                  style={{ flex: 1 }}
                />
                <InputNumber
                  min={10}
                  max={100}
                  value={improvementNumber}
                  onChange={(value) => {
                    if (value !== null) {
                      setImprovementNumber(value);
                    }
                  }}
                  formatter={(value) => `${value}%`}
                  // @ts-ignore
                  parser={(displayValue) => (displayValue || '')?.replace('%', '') || ''}
                  style={{ width: '90px' }}
                />
              </div>
            </Form.Item>
          </div>
        </div>
      }
    >
      <Timeline mode="alternate">
        {filteredMilestones.map((m, index) => {
          const yearMonthDay = getYearMonthDay(
            m.date ||
              m.achieved_on ||
              m.new_competition_date ||
              m.last_competition_date ||
              m.date_achieved,
          );

          const isLeft = index % 2 === 1;

          return (
            <Timeline.Item
              key={`${m.type}-${index}`} // 更健壮的 key
              dot={
                <Badge
                  color={MILESTONE_COLOR_MAP[m.type as MilestoneType]}
                  style={{ boxShadow: '0 0 0 2px #fff', marginTop: 8, width: 16, height: 16 }}
                />
              }
              label={yearMonthDay ? <Text type="secondary" style={{position: 'relative', top: 3}}>{yearMonthDay}</Text> : null}
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
