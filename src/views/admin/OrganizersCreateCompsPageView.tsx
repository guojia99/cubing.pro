"use client";

import "antd/dist/reset.css";

import BackButton from "@/components/Buttons/back_button";
import { Alert, Card, Col, DatePicker, Form, Input, InputNumber, Row, Switch } from "antd";
import React from "react";

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
import { useAdminExtra } from './useAdminExtra';
import { adminExtraZhCN } from '@/i18n/messages/admin-extra';

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
  const { t, text, eventName } = useAdminExtra();
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
      title: t('adminExtra.index'),
      dataIndex: 'index',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 100,
    },
    {
      title: t('adminExtra.event'),
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
              {eventName(option)}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('adminExtra.roundCount'),
      dataIndex: 'Schedule',
      key: 'ScheduleCount',
      render: (schedule: CompAPI.Schedule[]) => schedule.length,
      width: 100,
    },
    {
      title: t('adminExtra.actions'),
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
            {t('adminExtra.schedule')}
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={
              () => deleteEvent(record.Key)
            }
          >
            {t('adminExtra.delete')}
          </Button>
        </>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: t('adminExtra.round'),
      dataIndex: 'Round',
      key: 'Round',
      width: 100,
      render: (_text: string, _record: CompAPI.Schedule, index: number) =>
        text(getRoundName(index, modalSchedules.length)),
    },
    {
      title: t('adminExtra.eligibility'), key: 'NoRestrictions', width: 210,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => index === 0 ? t('adminExtra.firstRoundEligibility') : <Select aria-label={t('adminExtra.roundEligibility', { count: index + 1 })} style={{ width: 190 }} value={roundNoRestrictions(record, index) ? 'unrestricted' : 'qualified'} options={[{ value: 'qualified', label: t('adminExtra.byAdvancement') }, { value: 'unrestricted', label: t('adminExtra.unrestricted') }]} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, NoRestrictions: value === 'unrestricted' } : s))} />,
    },
    {
      title: t('adminExtra.advancementCount'), key: 'Competitors', width: 170,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <><InputNumber aria-label={t('adminExtra.roundAdvancement', { count: index + 1 })} min={0} precision={0} value={record.Competitors ?? 0} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, Competitors: value ?? 0 } : s))} />{index > 0 && roundNoRestrictions(record, index) && (record.Competitors ?? 0) > 0 && <Alert type="warning" title={t('adminExtra.unrestrictedHint')} />}</>,
    },
    {
      title: t('adminExtra.timeLimit'), key: 'TimeLimit', width: 170,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <InputNumber min={0} value={record.TimeLimit} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, TimeLimit: value ?? 0 } : s))} />,
    },
    {
      title: t('adminExtra.cutoff'), key: 'Cutoff', width: 170,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <InputNumber min={0} value={record.Cutoff} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, Cutoff: value ?? 0 } : s))} />,
    },
    {
      title: t('adminExtra.cutoffAttempts'), key: 'CutoffNumber', width: 130,
      render: (_: unknown, record: CompAPI.Schedule, index: number) => <InputNumber min={0} max={5} precision={0} value={record.CutoffNumber} onChange={(value) => setModalSchedules((previous) => previous.map((s, i) => i === index ? { ...s, CutoffNumber: value ?? 0 } : s))} />,
    },
    {
      title: t('adminExtra.actions'),
      key: 'action',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteSchedule(index)}
          disabled={index === 0}
        >
          {t('adminExtra.delete')}
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
      message.warning(t('adminExtra.allEventsAdded')).then();
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
    // Round names are persisted API data. Keep the original values in every locale.
    const final = adminExtraZhCN['adminExtra.final'];
    const preliminary = adminExtraZhCN['adminExtra.preliminary'];
    const second = adminExtraZhCN['adminExtra.secondRound'];
    const semiFinal = adminExtraZhCN['adminExtra.semiFinal'];
    if (totalRounds === 1) return final;
    if (totalRounds === 2) return index === 0 ? preliminary : final;
    if (totalRounds === 3) return [preliminary, second, final][index];
    if (totalRounds === 4) return [preliminary, second, semiFinal, final][index];
    if (index === 0) return preliminary;
    if (index === totalRounds - 1) return final;
    if (index === totalRounds - 2) return semiFinal;
    return adminExtraZhCN['adminExtra.intermediateRound'].replace('{count}', String(index));
  };

  const importEvents = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedEvents: CompAPI.Event[] = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedEvents) || !importedEvents.length || importedEvents.some((event) => !eventOptions.includes(event.EventID) || !Array.isArray(event.Schedule)) || new Set(importedEvents.map((event) => event.EventID)).size !== importedEvents.length) throw new Error(t('adminExtra.invalidEventConfig'));
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

        message.success(t('adminExtra.imported')).then();
      } catch {
        message.error(t('adminExtra.importFailed')).then();
      }
    };
    reader.onerror = () => { void message.error(t('adminExtra.fileReadFailed')); };
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
    Round: adminExtraZhCN['adminExtra.final'],
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
      message.warning(t('adminExtra.duplicateEvent', { event: value })).then();
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
          {t('adminExtra.addEvent')}
        </Button>
        <Upload accept=".json" beforeUpload={importEvents} showUploadList={false}>
          <Button icon={<UploadOutlined />} style={{ marginRight: 8 }}>
            {t('adminExtra.importSchedule')}
          </Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={exportEvents}>
          {t('adminExtra.exportSchedule')}
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
        title={t('adminExtra.schedule')}
        okText={t('adminExtra.confirm')}
        cancelText={t('adminExtra.cancel')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Alert type="info" showIcon title={t('adminExtra.scheduleHint')} style={{ marginBottom: 16 }} />
            <Form.Item name="EventName" label={t('adminExtra.eventName')}>
            <Select disabled>
              {eventOptions.map((option) => (
                <Option key={option} value={option}>
                  {eventName(option)}
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
            {t('adminExtra.addRound')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

const OtherDataForm = () => {
  const { t } = useAdminExtra();
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="startDate"
            label={t('adminExtra.startDate')}
            rules={[{ required: true, message: t('adminExtra.requireStart') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="endDate"
            label={t('adminExtra.endDate')}
            rules={[{ required: true, message: t('adminExtra.requireEnd') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

function CreateCompetitionContent() {
  const { t } = useAdminExtra();
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
      void message.warning(t('adminExtra.joinBeforeCreate'));
      router.replace("/admin/organizers");
    }
  }, [org, router, t]);

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
        if (!events.length) { void message.warning(t('adminExtra.requireEvent')); return; }
        if (values.endDate.format('YYYY-MM-DD') < values.startDate.format('YYYY-MM-DD')) { void message.warning(t('adminExtra.endBeforeStart')); return; }
        if (!groups?.data.items.some((group) => group.id === values.groupsID)) { void message.warning(t('adminExtra.requireValidGroup')); return; }
        submitLock.current = true;
        modal.confirm({
          title: t('adminExtra.confirmSubmit'),
          okText: t('adminExtra.confirmCreate'),
          cancelText: t('adminExtra.cancel'),
          content: (
            <>
              <p>{t('adminExtra.submitHint')}</p>
              <Alert title={t('adminExtra.scrambleWait')} showIcon type="warning" />
            </>
          ),
          onOk: async () => {
            setSubmitting(true);
            try {
            const configuredEvents = events.map((event) => {
              const base = baseEvents.find((value) => value.id === event.EventID);
              if (!base) throw new Error(t('adminExtra.invalidNamedEvent', { event: event.EventID }));
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
            void message.success(t('adminExtra.created'));
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
          void message.warning(t('adminExtra.requireFields'));
          return;
        }
        void message.error(competitionError(errorInfo));
      });
  };

  return (
    <GroupCompetitionShell title={t('adminExtra.create')} description={t('adminExtra.createDescription')}>
      {modalContext}
      {BackButton(t('adminExtra.back'))}
      <Form layout="vertical" form={form} disabled={submitting} initialValues={{ maxParticipants: 500, canPreResult: true, apply: true }}>
        <Card title={t('adminExtra.basicInfo')}>
          <>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="competitionName"
                  label={t('adminExtra.competitionName')}
                  rules={[{ required: true, whitespace: true, message: t('adminExtra.requireName') }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="maxParticipants" label={t('adminExtra.maxParticipants')}>
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="organizersID"
                  label={t('adminExtra.yourTeam')}
                  // style={{ width: '50%' }}
                  rules={[{ required: true, message: t('adminExtra.selectTeam') }]}
                >
                  <Select
                    placeholder={t('adminExtra.selectTeam')}
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
                  label={t('adminExtra.group')}
                  // style={{ width: '50%' }}
                  rules={[{ required: true, message: t('adminExtra.selectGroup') }]}
                >
                  <Select placeholder={t('adminExtra.selectGroup')} disabled={!curOrg || !groups} loading={!!curOrg && !groups}>
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
                <p>{t('adminExtra.onlineType')}</p>
              </Col>
              <Col xs={24} md={12}><Form.Item name="canPreResult" label={t('adminExtra.playerRobotPreEntry')} valuePropName="checked"><Switch /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="apply" label={t('adminExtra.applyOnSave')} valuePropName="checked"><Switch /></Form.Item></Col>
            </Row>
          </>
        </Card>
        <Card title={t('adminExtra.timeConfig')} style={{ marginTop: 20 }}>
          <Alert type="info" showIcon title={t('adminExtra.timeConfigHint')} style={{ marginBottom: 16 }} />
          <OtherDataForm />
        </Card>
        <Card title={t('adminExtra.eventConfig')} style={{ marginTop: 20 }}>
          <Form.Item name="events" valuePropName="value" getValueFromEvent={(e) => e}>
            <EventTable onChange={setEvents} />
          </Form.Item>
        </Card>
        <Card title={t('adminExtra.description')} style={{ marginTop: 20 }}>
          <Form.Item name="description" valuePropName={'value'} getValueFromEvent={(e) => e}>
            <MarkdownEditor />
          </Form.Item>
        </Card>
        {/*提交按钮 */}
        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!baseEvents.length}>
            {t('adminExtra.submit')}
          </Button>
        </Form.Item>
      </Form>
    </GroupCompetitionShell>
  );
}

export function OrganizersCreateCompsPageView() {
  return <OrganizersGuard><CreateCompetitionContent /></OrganizersGuard>;
}
