import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Form,
  InputNumber,
  Modal,
  Select,
  SelectProps,
  Slider,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { TimelineProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '@/hooks/useIntlMessage';

import 'antd/dist/reset.css';

import MilestoneItemContent, {
  MILESTONE_COLOR_MAP,
  defaultMilestoneTypeOptions,
} from '@/views/Wca/PlayerComponents/MilestoneContent';
import {
  GetMilestones,
  MILESTONE_TYPE_PRIORITY,
  Milestone,
  MilestoneType,
} from './player_milestone';
import { WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';
import './Milestone.css';

const { Text } = Typography;
type TagRender = SelectProps['tagRender'];

const MILESTONE_HELP_ORDER: MilestoneType[] = (
  Object.entries(MILESTONE_TYPE_PRIORITY) as [MilestoneType, number][]
)
  .sort((a, b) => a[1] - b[1])
  .map(([k]) => k);

const TIMELINE_ZOOM_MIN = 0.5;
const TIMELINE_ZOOM_MAX = 1.75;
const TIMELINE_ZOOM_DEFAULT = 1;
/** 双指间距过小则忽略，避免误触与除零 */
const MIN_PINCH_START_DIST = 28;

function touchPairDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

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
  const intl = useIntl();
  const [ascending, setAscending] = useState<boolean>(false);
  const [excludedTypes, setExcludedTypes] = useState<MilestoneType[]>([]);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [milestoneTypeOptions, setMilestoneTypeOptions] = useState<
    { label: string; value: MilestoneType }[]
  >([]);
  const [improvementNumber, setImprovementNumber] = useState(33);
  const [helpOpen, setHelpOpen] = useState(false);
  /** 仅作用于 Card 内时间轴区域；默认 1 */
  const [timelineZoom, setTimelineZoom] = useState(TIMELINE_ZOOM_DEFAULT);
  const timelineZoomRef = useRef(timelineZoom);
  const scaleViewportRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  timelineZoomRef.current = timelineZoom;

  useEffect(() => {
    const el = scaleViewportRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) {
        pinchRef.current = null;
        return;
      }
      const d = touchPairDistance(e.touches);
      if (d < MIN_PINCH_START_DIST) {
        pinchRef.current = null;
        return;
      }
      pinchRef.current = {
        startDist: d,
        startScale: timelineZoomRef.current,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const d = touchPairDistance(e.touches);
      if (!pinchRef.current) {
        if (d >= MIN_PINCH_START_DIST) {
          pinchRef.current = {
            startDist: d,
            startScale: timelineZoomRef.current,
          };
        }
        return;
      }
      e.preventDefault();
      const { startDist, startScale } = pinchRef.current;
      if (startDist < 1e-3) return;
      const raw = (startScale * d) / startDist;
      const next = Math.min(
        TIMELINE_ZOOM_MAX,
        Math.max(TIMELINE_ZOOM_MIN, Math.round(raw * 100) / 100),
      );
      setTimelineZoom(next);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
      } else if (e.touches.length === 2) {
        const d = touchPairDistance(e.touches);
        if (d >= MIN_PINCH_START_DIST) {
          pinchRef.current = {
            startDist: d,
            startScale: timelineZoomRef.current,
          };
        } else {
          pinchRef.current = null;
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      setTimelineZoom((z) => {
        const n = Math.round((z + delta) * 100) / 100;
        return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, n));
      });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    const milestones = GetMilestones(
      wcaProfile,
      wcaResults,
      comps,
      improvementNumber,
      (descriptor, values) => intl.formatMessage(descriptor, values),
    );
    setAllMilestones(milestones);
    const sortedMilestones = sortMilestones(milestones, ascending);
    const fs = sortedMilestones.filter((m) => !excludedTypes.includes(m.type));
    setFilteredMilestones(fs);

    const milestoneTypesPresent = new Set(milestones.map((m) => m.type));
    const mOpt = defaultMilestoneTypeOptions
      .filter((opt) => milestoneTypesPresent.has(opt.value))
      .sort((a, b) => MILESTONE_TYPE_PRIORITY[a.value] - MILESTONE_TYPE_PRIORITY[b.value])
      .map((opt) => ({
        ...opt,
        label: intl.formatMessage({ id: `wca.milestone.type.${opt.value}` }),
      }));
    setMilestoneTypeOptions(mOpt);
  }, [excludedTypes, ascending, improvementNumber, intl, wcaProfile, wcaResults, comps]);

  const timelineItems: TimelineProps['items'] = useMemo(
    () =>
      filteredMilestones.map((m, index) => {
        const yearMonthDay = getYearMonthDay(
          m.date ||
            m.achieved_on ||
            m.new_competition_date ||
            m.last_competition_date ||
            m.date_achieved,
        );
        const isLeft = index % 2 === 1;

        return {
          key: `${m.type}-${yearMonthDay ?? 'nodate'}-${index}`,
          icon: (
            <Badge
              color={MILESTONE_COLOR_MAP[m.type as MilestoneType]}
              style={{ boxShadow: '0 0 0 2px #fff', marginTop: 8, width: 16, height: 16 }}
            />
          ),
          title: yearMonthDay ? (
            <Text type="secondary" style={{ position: 'relative', top: 3 }}>
              {yearMonthDay}
            </Text>
          ) : undefined,
          content: <MilestoneItemContent milestone={m} isLeft={isLeft} />,
        };
      }),
    [filteredMilestones],
  );

  const helpModalBody = useMemo(
    () => (
      <div style={{ maxHeight: 'min(70vh, 520px)', overflowY: 'auto', paddingRight: 4 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {intl.formatMessage({ id: 'wca.milestone.helpIntro' })}
        </Text>
        {MILESTONE_HELP_ORDER.map((type) => (
          <div key={type} style={{ marginBottom: 14 }}>
            <Text strong>{intl.formatMessage({ id: `wca.milestone.type.${type}` })}</Text>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              {intl.formatMessage({ id: `wca.milestone.help.${type}` })}
            </Text>
          </div>
        ))}
      </div>
    ),
    [intl],
  );

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
    <>
      <Card
      title={
        <div style={{ paddingTop: 16, paddingBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Space wrap>
              <Text strong>{intl.formatMessage({ id: 'wca.milestone.title' })}</Text>
              <Text type="secondary">
                {intl.formatMessage({ id: 'wca.milestone.count' }, { count: filteredMilestones.length })}
              </Text>
            </Space>
            <Space size={4} wrap>
              <Button
                type="text"
                size="small"
                icon={<QuestionCircleOutlined />}
                aria-label={intl.formatMessage({ id: 'wca.milestone.helpAria' })}
                onClick={() => setHelpOpen(true)}
              />
              <Button size="small" onClick={() => setAscending(!ascending)}>
                {ascending
                  ? intl.formatMessage({ id: 'wca.milestone.descOrder' })
                  : intl.formatMessage({ id: 'wca.milestone.ascOrder' })}
              </Button>
            </Space>
          </div>

          <div style={{ marginTop: 16 }}>
            <Form.Item label={intl.formatMessage({ id: 'wca.milestone.excludeLabel' })}>
              <Select
                mode="multiple"
                allowClear
                maxTagCount="responsive"
                placeholder={intl.formatMessage({ id: 'wca.milestone.excludePlaceholder' })}
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
          <div style={{ marginTop: 16, minWidth: 0, width: '100%', maxWidth: 400 }}>
            <Form.Item label={intl.formatMessage({ id: 'wca.milestone.improvementThreshold' })}>
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
      <div className="milestone-scale-hint">
        <Text type="secondary" style={{ fontSize: 12 }}>
          {intl.formatMessage({ id: 'wca.milestone.timelinePinchHint' })}
          {timelineZoom !== TIMELINE_ZOOM_DEFAULT ? (
            <>
              {' '}
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto', fontSize: 12 }}
                onClick={() => setTimelineZoom(TIMELINE_ZOOM_DEFAULT)}
              >
                {intl.formatMessage({ id: 'wca.milestone.timelineScaleReset' })}
              </Button>
            </>
          ) : null}
        </Text>
      </div>
      <div
        ref={scaleViewportRef}
        className="milestone-scale-viewport"
        aria-label={intl.formatMessage({ id: 'wca.milestone.timelineScale' })}
      >
        <div
          className="milestone-timeline-wrapper"
          style={{ zoom: timelineZoom } as React.CSSProperties}
        >
          <Timeline mode="alternate" items={timelineItems} />
        </div>
      </div>
    </Card>
    <Modal
      title={intl.formatMessage({ id: 'wca.milestone.helpTitle' })}
      open={helpOpen}
      onCancel={() => setHelpOpen(false)}
      footer={
        <Button type="primary" onClick={() => setHelpOpen(false)}>
          {intl.formatMessage({ id: 'wca.milestone.helpClose' })}
        </Button>
      }
      width={560}
      destroyOnHidden
    >
      {helpModalBody}
    </Modal>
    </>
  );
};

export default MilestoneTimelines;
