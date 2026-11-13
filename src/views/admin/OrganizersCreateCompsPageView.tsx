"use client";

import "antd/dist/reset.css";

import BackButton from "@/components/Buttons/back_button";
import { Alert, Card, Col, DatePicker, Form, Input, InputNumber, Row, Switch } from "antd";
import React from "react";

import { CubesCn } from '@/components/CubeIcon/cube';
import MarkdownEditor from '@/components/Markdown/editer';
import {
  apiCreateComps,
  apiGetGroups,
  apiMeOrganizers,
} from '@/services/cubing-pro/auth/organizers';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { competitionError } from '@/services/cubing-pro/auth/groupCompetition';
import { OrganizersGuard } from '@/components/admin/OrganizersGuard';
import { GroupCompetitionShell } from './GroupCompetitionShell';
import { beijingDateStart, roundNoRestrictions, validateEvents } from '@/lib/groupCompetition';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { useRouter } from "next/navigation";
import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ScheduleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Select, Table, Upload, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const { Option } = Select;

const normalizeSchedules = (
  schedules: CompAPI.Schedule[],
  getRoundName: (index: number, totalRounds: number) => string,
): CompAPI.Schedule[] =>
  schedules.map((s, index) => ({
    ...s,
    NoRestrictions: roundNoRestrictions(s, index),
    Round: getRoundName(index, schedules.length),
    RoundNum: index + 1,
    FirstRound: index === 0,
    FinalRound: index === schedules.length - 1,
  }));

export const EventTable: React.FC<{ value?: CompAPI.Event[]; onChange?: (val: CompAPI.Event[]) => void }> = ({ value, onChange }) => {
  const [localEvents, setEvents] = useState<CompAPI.Event[]>([]);
  const events = value ?? localEvents;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CompAPI.Event | null>(null);
  const [modalSchedules, setModalSchedules] = useState<CompAPI.Schedule[]>([]);
  const [form] = Form.useForm();

  const [eventOptions, setEventOptions] = useState<string[]>([]);
  const [baseEvents, setBaseEvents] = useState<EventsAPI.Event[]>([]);

  const updateEvents = (newEvents: CompAPI.Event[]) => {
    setEvents(newEvents);
    onChange?.(newEvents);
  };

  useEffect(() => {
    apiEvents().then((value) => {
      const o: string[] = [];
      for (let i = 0; i < value.data.Events.length; i++) {
        const ev = value.data.Events[i];
        if (!ev.isComp) {
          continue;
        }
        o.push(ev.id);
      }
      setEventOptions(o);
      setBaseEvents(value.data.Events);
    }).catch((e) => message.error(competitionError(e)));
  }, []);

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 100,
    },
    {
      title: '项目',
      dataIndex: 'EventName',
      key: 'EventName',
      width: 150,
      render: (text: string, record: CompAPI.Event) => (
        <Select
          value={record.EventID || text}
          style={{ width: 120 }}
          onChange={(value) => handleEventChangeEventName(record.Key, value)}
        >
          {eventOptions.map((option) => (
            <Option key={option} value={option}>
              {CubesCn(option)}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '赛程数',
      dataIndex: 'Schedule',
      key: 'ScheduleCount',
      render: (schedule: CompAPI.Schedule[]) => schedule.length,
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: CompAPI.Event) => (
        <>
          <Button
            type="primary"
            icon={<ScheduleOutlined />}
            onClick={() => showScheduleModal(record)}
            style={{ marginRight: 8 }}
          >
            安排赛程
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={
              () => deleteEvent(record.Key)
            }
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: '轮次',
      dataIndex: 'Round',
      key: 'Round',
      width: 100,
      render: (_text: string, _record: CompAPI.Schedule, index: number) =>
        getRoundName(index, modalSchedules.length),
    },
    {
      title: '参赛资格', key: 'NoRestrictions', width: 210,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => index === 0 ? '首轮报名资格' : <Select aria-label={`第 ${index + 1} 轮参赛资格`} style={{ width: 190 }} value={roundNoRestrictions(record, index) ? 'unrestricted' : 'qualified'} options={[{ value: 'qualified', label: '按晋级名单' }, { value: 'unrestricted', label: '无限制' }]} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, NoRestrictions: value === 'unrestricted' } : s))} />,
    },
    {
      title: '晋级人数（0 不限）', key: 'Competitors', width: 170,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <><InputNumber aria-label={`第 ${index + 1} 轮晋级人数`} min={0} precision={0} value={record.Competitors ?? 0} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, Competitors: value ?? 0 } : s))} />{index > 0 && roundNoRestrictions(record, index) && (record.Competitors ?? 0) > 0 && <Alert type="warning" title="无限制不会校验晋级名单；如需限制人数，请选择按晋级名单。" />}</>,
    },
    {
      title: '时限（秒，0 不限）', key: 'TimeLimit', width: 170,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <InputNumber min={0} value={record.TimeLimit} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, TimeLimit: value ?? 0 } : s))} />,
    },
    {
      title: '及格线（秒，0 无）', key: 'Cutoff', width: 170,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <InputNumber min={0} value={record.Cutoff} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, Cutoff: value ?? 0 } : s))} />,
    },
    {
      title: '及格尝试数', key: 'CutoffNumber', width: 130,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <InputNumber min={0} max={5} precision={0} value={record.CutoffNumber} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, CutoffNumber: value ?? 0 } : s))} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteSchedule(index)}
          disabled={index === 0}
        >
          删除
        </Button>
      ),
    },
  ];

  const showScheduleModal = (event: CompAPI.Event) => {
    setCurrentEvent(event);
    setIsModalVisible(true);
    const schedules =
      event.Schedule.length > 0
        ? event.Schedule
        : [createDefaultSchedule(event.EventID)];
    setModalSchedules(normalizeSchedules(schedules, getRoundName));
    form.setFieldsValue({ EventName: event.EventName });
  };

  const handleOk = () => {
    form.validateFields(['EventName']).then(() => {
      const updatedEvent = {
        ...currentEvent!,
        Schedule: normalizeSchedules(modalSchedules, getRoundName),
      };
      updateEvents(events.map((e) => (e.Key === updatedEvent.Key ? updatedEvent : e)));
      setIsModalVisible(false);
    }).catch(() => undefined);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const addEvent = () => {
    const unusedEvents = eventOptions.filter(
      (option) => !events.some((e) => e.EventName === option),
    );

    if (unusedEvents.length === 0) {
      message.warning('所有项目已全部加入，无法继续加载').then();
      return;
    }

    const newEventName = unusedEvents[0];
    const newEvent: CompAPI.Event = {
      Key: uuidv4(),
      EventName: newEventName,
      EventID: newEventName,
      EventRoute: baseEvents.find((event) => event.id === newEventName)?.base_route_typ ?? 0,
      SingleQualify: 0,
      AvgQualify: 0,
      IsComp: true,
      HasResultsQualify: false,
      Schedule: [createDefaultSchedule(newEventName)],
      Done: false,
    };
    updateEvents([...events, newEvent]);
  };

  const deleteEvent = (key: string) => {
    updateEvents(events.filter((e) => e.Key !== key));
  };

  const getRoundName = (index: number, totalRounds: number) => {
    if (totalRounds === 1) return '决赛';
    if (totalRounds === 2) return index === 0 ? '初赛' : '决赛';
    if (totalRounds === 3) return ['初赛', '复赛', '决赛'][index];
    if (totalRounds === 4) return ['初赛', '复赛', '半决赛', '决赛'][index];
    if (index === 0) return '初赛';
    if (index === totalRounds - 1) return '决赛';
    if (index === totalRounds - 2) return '半决赛';
    return `复赛第${index}轮`;
  };

  const importEvents = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedEvents: CompAPI.Event[] = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedEvents) || !importedEvents.length || importedEvents.some((event) => !eventOptions.includes(event.EventID) || !Array.isArray(event.Schedule)) || new Set(importedEvents.map((event) => event.EventID)).size !== importedEvents.length) throw new Error('项目配置无效');
        updateEvents(
          importedEvents.map((event) => ({
            ...event,
            Key: uuidv4(),
            EventRoute: baseEvents.find((base) => base.id === event.EventID)?.base_route_typ ?? 0,
            Schedule:
              event.Schedule.length > 0
                ? event.Schedule.map((s, index) => ({
                     ...s,
                    NoRestrictions: roundNoRestrictions(s, index),
                    RoundNum: index + 1,
                    FirstRound: index === 0,
                    FinalRound: index === event.Schedule.length - 1,
                    IsRunning: true,
                    ActualStartTime: null,
                    ActualEndTime: null,
                    AdvancedToNextRound: null,
                    Round: getRoundName(index, event.Schedule.length),
                    StartTime: s.StartTime ? new Date(s.StartTime) : null,
                    EndTime: s.EndTime ? new Date(s.EndTime) : null,
                  }))
                : [createDefaultSchedule(event.EventID)],
          })),
        );

        message.success('数据导入成功').then();
      } catch {
        message.error('数据导入失败，请检查文件格式').then();
      }
    };
    reader.onerror = () => { void message.error('读取文件失败，请重试'); };
    reader.readAsText(file);
    return false;
  };

  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'events_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const createDefaultSchedule = (eventName: string, roundNum = 1): CompAPI.Schedule => ({
    Event: eventName,
    Round: '决赛',
    Stage: '',
    EventName: eventName,
    IsComp: true,
    StartTime: null,
    EndTime: null,
    ActualStartTime: null,
    ActualEndTime: null,
    RoundNum: 1,
    Format: 'ao5',
    IsRunning: true,
    FirstRound: true,
    FinalRound: true,
    AdvancedToNextRound: null,
    Cutoff: 0,
    CutoffNumber: 0,
    TimeLimit: 0,
    Competitors: 0,
    NoRestrictions: roundNum === 1,
    ScrambleNums: 1,
    Scrambles: [],
    NotScramble: false,
  });

  const addSchedule = () => {
    setModalSchedules((schedules) =>
      normalizeSchedules(
        [
          ...schedules,
          createDefaultSchedule(currentEvent?.EventID || '', schedules.length + 1),
        ],
        getRoundName,
      ),
    );
  };

  const handleEventChangeEventName = (key: string, value: string) => {
    const find = events.filter((e) => {
      if (e.Key === key) {
        return false;
      }
      return e.EventID === value;
    });
    if (find.length !== 0) {
      message.warning('已存在' + value + '项目, 无法继续添加').then();
      return;
    }

    updateEvents(
      events.map((event) =>
        event.Key === key ? { ...event, EventName: value, EventID: value, EventRoute: baseEvents.find((base) => base.id === value)?.base_route_typ ?? 0, Schedule: event.Schedule.map((s) => ({ ...s, Event: value, EventName: value })) } : event,
      ),
    );
  };
  const deleteSchedule = (index: number) => {
    setModalSchedules((schedules) => {
      if (schedules.length <= 1) {
        return schedules;
      }
      return normalizeSchedules(
        schedules.filter((_, i) => i !== index),
        getRoundName,
      );
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addEvent}
          style={{ marginRight: 8 }}
        >
          添加项目
        </Button>
        <Upload accept=".json" beforeUpload={importEvents} showUploadList={false}>
          <Button icon={<UploadOutlined />} style={{ marginRight: 8 }}>
            导入赛程安排
          </Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={exportEvents}>
          导出赛程安排
        </Button>
      </div>
      <Table
        dataSource={events}
        columns={columns}
        pagination={false}
        size={'small'}
        rowKey="EventID"
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="安排赛程"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Alert type="info" showIcon title="后续轮次默认按晋级名单；本轮晋级人数由上一轮关闭时计算，0 表示不限制晋级人数。选择无限制会跳过名单校验，已有明确配置不会自动变更。" style={{ marginBottom: 16 }} />
            <Form.Item name="EventName" label="项目名称">
            <Select disabled>
              {eventOptions.map((option) => (
                <Option key={option} value={option}>
                  {CubesCn(option)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Table
            dataSource={modalSchedules}
            rowKey="RoundNum"
            // @ts-ignore
            columns={scheduleColumns}
            size={'small'}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
          <Button
            type="dashed"
            onClick={addSchedule}
            icon={<PlusOutlined />}
            disabled={modalSchedules.length >= 99}
            style={{ marginTop: 20 }}
          >
            添加轮次
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

const OtherDataForm = () => {
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="startDate"
            label="开始日期（00:00）"
            rules={[{ required: true, message: '请选择开始日期！' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="endDate"
            label="结束日期（含全天，次日 00:00 截止）"
            rules={[{ required: true, message: '请选择结束日期！' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

function CreateCompetitionContent() {
  const [modal, modalContext] = Modal.useModal();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizersAPI.MeOrganizersResp | null>(null);
  const [curOrg, setCurOrg] = useState<number>(0);
  const [groups, setGroups] = useState<OrganizersAPI.GetGroupsResp | null>(null);

  const [form] = Form.useForm(); // 使用 Ant Design 的 Form
  const [events, setEvents] = useState<CompAPI.Event[]>([]);
  const [baseEvents, setBaseEvents] = useState<EventsAPI.Event[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [groupError, setGroupError] = useState('');
  const submitLock = useRef(false);

  // 获取团队信息
  useEffect(() => {
    if (org === null) {
      apiMeOrganizers().then((value: OrganizersAPI.MeOrganizersResp) => {
        setOrg(value);
      }).catch((e) => message.error(competitionError(e)));
    }
  }, [org]);

  // 检查用户是否加入了团队
  useEffect(() => {
    if (org?.data.items === null || org?.data.items?.length === 0) {
      void message.warning("你还未加入任何团队，请加入后再创建比赛");
      router.replace("/admin/organizers");
    }
  }, [org, router]);

  useEffect(() => {
    if (curOrg === 0) {
      return;
    }
    let active = true;
    setGroupError('');
    apiGetGroups(curOrg).then((value) => { if (active) setGroups(value); })
      .catch((e) => { if (active) { setGroupError(competitionError(e)); setGroups({ data: { items: [], total: 0 } }); } });
    return () => { active = false; };
  }, [curOrg]);

  useEffect(() => {
    apiEvents().then((value) => {
      setBaseEvents(value.data.Events);
    }).catch((e) => message.error(competitionError(e)));
  }, []);

  // 提交表单数据
  const handleSubmit = () => {
    if (submitLock.current) return;
    form
      .validateFields()
      .then((values) => {
        if (submitLock.current) return;
        if (!events.length) { void message.warning('至少添加一个比赛项目'); return; }
        if (values.endDate.format('YYYY-MM-DD') < values.startDate.format('YYYY-MM-DD')) { void message.warning('结束日期不能早于开始日期'); return; }
        if (!groups?.data.items.some((group) => group.id === values.groupsID)) { void message.warning('请选择当前团队的有效群组'); return; }
        submitLock.current = true;
        modal.confirm({
          title: '确认提交',
          okText: '确认创建',
          cancelText: '取消',
          content: (
            <>
              <p>你确定要提交比赛信息吗？</p>
              <Alert title="生成打乱可能需要等待 2 ~ 20 秒，请勿重复提交" showIcon type="warning" />
            </>
          ),
          onOk: async () => {
            setSubmitting(true);
            try {
            const configuredEvents = events.map((event) => {
              const base = baseEvents.find((value) => value.id === event.EventID);
              if (!base) throw new Error(`项目 ${event.EventID} 配置无效`);
              return { ...event, EventRoute: base.base_route_typ, Schedule: event.Schedule.map((s) => ({ ...s, IsRunning: true, ActualStartTime: null, ActualEndTime: null, AdvancedToNextRound: null })) };
            });
            validateEvents(configuredEvents);
            const compJson: CompAPI.CompJson = {
              Events: configuredEvents,
              Cost: {
                BaseCost: {
                  Value: 0,
                  StartTime: null,
                  EndTime: null,
                },
                Costs: null,
                EventCost: null,
              },
            };
            const req: OrganizersAPI.CreateCompReq = {
              Name: values.competitionName.trim(),
              StrId: values.competitionName.trim(),
              Illustrate: '',
              IllustrateHTML: values.description ?? '',
              RuleMD: '',
              RuleHTML: '',
              CompJSON: compJson,
              Count: values.maxParticipants ?? 500,
              CanPreResult: values.canPreResult,
              Genre: 0,
              CompStartTime: beijingDateStart(values.startDate.format('YYYY-MM-DD')),
              CompEndTime: beijingDateStart(values.endDate.format('YYYY-MM-DD')),
              GroupID: values.groupsID,
              CanStartedAddEvent: true,
              Apply: values.apply,
            };
            await apiCreateComps(values.organizersID, req);
            void message.success('创建成功；审批通过后即可录入已配置轮次成绩');
            router.push(`/admin/organizers/comps?orgId=${values.organizersID}`);
            } catch (error) { void message.error(competitionError(error)); throw error; }
            finally { setSubmitting(false); }
          },
          afterClose: () => { submitLock.current = false; },
        });
      })
      .catch((errorInfo) => {
        if (errorInfo?.outOfDate) return;
        if (Array.isArray(errorInfo?.errorFields) && errorInfo.errorFields.length) {
          form.scrollToField(errorInfo.errorFields[0].name, { block: 'center' });
          void message.warning('请完善标红的必填信息后再提交');
          return;
        }
        void message.error(competitionError(errorInfo));
      });
  };

  return (
    <GroupCompetitionShell title="创建群赛" description="线上比赛轮次默认全部开放；审批通过后即可录入成绩，不受赛期或结束标记限制。">
      {modalContext}
      {BackButton('返回上层')}
      <Form layout="vertical" form={form} disabled={submitting} initialValues={{ maxParticipants: 500, canPreResult: true, apply: true }}>
        <Card title={'基础信息'}>
          <>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="competitionName"
                  label="比赛名称"
                  rules={[{ required: true, whitespace: true, message: '请输入比赛名称！' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="maxParticipants" label="最大参与人数">
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="organizersID"
                  label="所在团队"
                  // style={{ width: '50%' }}
                  rules={[{ required: true, message: '选择所在团队名称' }]}
                >
                  <Select
                    placeholder="选择所在团队名称"
                    onChange={(value) => {
                       setGroups(null);
                       form.setFieldValue('groupsID', undefined);
                       setCurOrg(value);
                    }}
                  >
                    {org?.data.items?.map((o) => (
                      <Select.Option key={o.id} value={o.id}>
                        {o.Name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="groupsID"
                  label="群组"
                  // style={{ width: '50%' }}
                  rules={[{ required: true, message: '选择群组' }]}
                >
                  <Select placeholder="选择群组" disabled={!curOrg || !groups} loading={!!curOrg && !groups}>
                    {groups?.data.items.map((o) => (
                      <Select.Option key={o.id} value={o.id}>
                        {o.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                {groupError && <Alert type="error" title={groupError} />}
              </Col>
              <Col xs={24} md={12}>
                <p>比赛类型: 线上</p>
              </Col>
              <Col xs={24} md={12}><Form.Item name="canPreResult" label="允许玩家 / 机器人预录入" valuePropName="checked"><Switch /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="apply" label="保存后立即提交审批（关闭则保存草稿）" valuePropName="checked"><Switch /></Form.Item></Col>
            </Row>
          </>
        </Card>
        <Card title={'时间配置'} style={{ marginTop: 20 }}>
          <Alert type="info" showIcon title="群赛审批通过后，赛前、赛后及标记结束后均可新增、覆盖、修改、删除成绩；配置轮次关闭时也可录入。权限、身份、项目轮次存在及成绩格式仍需校验。" style={{ marginBottom: 16 }} />
          {OtherDataForm()}
        </Card>
        <Card title={'项目配置'} style={{ marginTop: 20 }}>
          <Form.Item name="events" valuePropName="value" getValueFromEvent={(e) => e}>
            <EventTable onChange={setEvents} />
          </Form.Item>
        </Card>
        <Card title={'比赛描述'} style={{ marginTop: 20 }}>
          <Form.Item name="description" valuePropName={'value'} getValueFromEvent={(e) => e}>
            <MarkdownEditor />
          </Form.Item>
        </Card>
        {/*提交按钮 */}
        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!baseEvents.length}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </GroupCompetitionShell>
  );
}

export function OrganizersCreateCompsPageView() {
  return <OrganizersGuard><CreateCompetitionContent /></OrganizersGuard>;
}
