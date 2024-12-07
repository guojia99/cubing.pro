import BackButton from '@/components/Buttons/back_button';
import { Card, Col, DatePicker, Form, Input, InputNumber, Row } from 'antd';
import React from 'react';

import { CubesCn } from '@/components/CubeIcon/cube';
import MarkdownEditor from '@/components/Markdown/editer';
import { apiCreateComps, apiMeOrganizers } from '@/services/cubing-pro/auth/organizers';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { history } from '@@/exports';
import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ScheduleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Select, Table, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Option } = Select;

const EventTable: React.FC<{ onChange?: (val: any) => void }> = ({ onChange }) => {
  const [events, setEvents] = useState<CompAPI.Event[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CompAPI.Event | null>(null);
  const [form] = Form.useForm();

  const [eventOptions, setEventOptions] = useState<string[]>([]);

  const updateEvents = (newEvents: CompAPI.Event[]) => {
    setEvents(newEvents);
    onChange?.(newEvents);
  };

  useEffect(() => {
    apiEvents().then((value) => {
      let o: string[] = [];
      for (let i = 0; i < value.data.Events.length; i++) {
        const ev = value.data.Events[i];
        if (!ev.isComp) {
          continue;
        }
        o.push(ev.id);
      }
      setEventOptions(o);
    });
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
          value={text}
          style={{ width: 120 }}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(value) => handleEventChange(record.EventID, 'EventName', value)}
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
            /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
            onClick={() => showScheduleModal(record)}
            style={{ marginRight: 8 }}
          >
            安排赛程
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={
              /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
              () => deleteEvent(record.EventID)
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
      render: (text: string, record: CompAPI.Schedule, index: number) =>
        /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
        getRoundName(index, form.getFieldValue('Schedule').length),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
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
    form.setFieldsValue({
      ...event,
      Schedule:
        event.Schedule.length > 0
          ? event.Schedule.map((s, index) => ({
              ...s,
              /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
              Round: getRoundName(index, event.Schedule.length),
              StartTime: s.StartTime ? dayjs(s.StartTime) : null,
              EndTime: s.EndTime ? dayjs(s.EndTime) : null,
            }))
          : /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
            [createDefaultSchedule(event.EventName)],
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const updatedEvent = {
        ...currentEvent!,
        ...values,
        Schedule: values.Schedule.map((s: any, index: number) => ({
          ...s,
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          Round: getRoundName(index, values.Schedule.length),
        })),
      };
      updateEvents(events.map((e) => (e.EventID === updatedEvent.EventID ? updatedEvent : e)));
      setIsModalVisible(false);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const addEvent = () => {
    const unusedEvents = eventOptions.filter(
      (option) => !events.some((e) => e.EventName === option),
    );
    const newEventName = unusedEvents.length > 0 ? unusedEvents[0] : eventOptions[0];
    const newEvent: CompAPI.Event = {
      EventName: newEventName,
      EventID: newEventName,
      EventRoute: 0,
      SingleQualify: 0,
      AvgQualify: 0,
      IsComp: true,
      HasResultsQualify: false,
      /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
      Schedule: [createDefaultSchedule(newEventName)],
      Done: false,
    };
    updateEvents([...events, newEvent]);
  };

  const deleteEvent = (eventId: string) => {
    updateEvents(events.filter((e) => e.EventID !== eventId));
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
        updateEvents(
          importedEvents.map((event) => ({
            ...event,
            Schedule:
              event.Schedule.length > 0
                ? event.Schedule.map((s, index) => ({
                    ...s,
                    Round: getRoundName(index, event.Schedule.length),
                    StartTime: s.StartTime ? new Date(s.StartTime) : null,
                    EndTime: s.EndTime ? new Date(s.EndTime) : null,
                  }))
                : /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
                  [createDefaultSchedule(event.EventName)],
          })),
        );

        message.success('数据导入成功').then();
      } catch (error) {
        message.error('数据导入失败，请检查文件格式').then();
      }
    };
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

  const createDefaultSchedule = (eventName: string): CompAPI.Schedule => ({
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
    IsRunning: false,
    FirstRound: true,
    FinalRound: true,
    AdvancedToNextRound: null,
    Cutoff: 0,
    CutoffNumber: 0,
    TimeLimit: 0,
    Competitors: 0,
    NoRestrictions: true,
  });

  const addSchedule = () => {
    const schedules = form.getFieldValue('Schedule') || [];
    const newSchedule = {
      ...createDefaultSchedule(currentEvent?.EventName || ''),
      Round: getRoundName(schedules.length, schedules.length + 1),
      RoundNum: schedules.length + 1,
      FirstRound: false,
      FinalRound: true,
    };
    const newSchedules = [...schedules, newSchedule];
    form.setFieldsValue({
      Schedule: newSchedules.map((s, index) => ({
        ...s,
        Round: getRoundName(index, newSchedules.length),
        FirstRound: index === 0,
        FinalRound: index === newSchedules.length - 1,
      })),
    });
  };

  const handleEventChange = (eventId: string, field: string, value: any) => {
    updateEvents(
      events.map((event) => (event.EventID === eventId ? { ...event, [field]: value } : event)),
    );
  };
  const deleteSchedule = (index: number) => {
    const schedules = form.getFieldValue('Schedule');
    if (schedules.length > 1) {
      const newSchedules = schedules.filter((_: any, i: number) => i !== index);
      form.setFieldsValue({
        Schedule: newSchedules.map((s: CompAPI.Schedule, i: number) => ({
          ...s,
          Round: getRoundName(i, newSchedules.length),
          RoundNum: i + 1,
          FirstRound: i === 0,
          FinalRound: i === newSchedules.length - 1,
        })),
      });
    }
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
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={'100%'}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="EventName" label="项目名称">
            <Select>
              {eventOptions.map((option) => (
                <Option key={option} value={option}>
                  {CubesCn(option)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.List name="Schedule">
            {(fields) => (
              <>
                <Table
                  dataSource={fields}
                  // @ts-ignore
                  columns={scheduleColumns}
                  size={'small'}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={addSchedule}
                    // block
                    icon={<PlusOutlined />}
                    disabled={fields.length >= 99}
                    style={{ marginTop: '20px', float: 'right' }}
                  >
                    添加轮次
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

const BaseDataForm = (org: OrganizersAPI.MeOrganizersResp | null) => {
  if (org === null) {
    return <></>;
  }
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="competitionName"
            label="比赛名称"
            rules={[{ required: true, message: '请输入比赛名称！' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Form.Item
          name="organizersID"
          label="所在团队"
          style={{ width: '50%' }}
          rules={[{ required: true, message: '选择所在团队名称' }]}
        >
          <Select placeholder="选择所在团队名称">
            {org.data.items.map((o) => (
              <Select.Option key={o.id} value={o.id}>
                {o.Name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Col span={12}>
          <Form.Item name="maxParticipants" label="最大参与人数">
            <InputNumber min={1} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

const OtherDataForm = () => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期！' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="endDate"
            label="结束日期"
            rules={[{ required: true, message: '请选择结束日期！' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

const CreateCompsPage: React.FC = () => {
  const [org, setOrg] = useState<OrganizersAPI.MeOrganizersResp | null>(null);
  const [form] = Form.useForm(); // 使用 Ant Design 的 Form
  const [events, setEvents] = useState<CompAPI.Event[]>([]);
  // 获取团队信息
  useEffect(() => {
    if (org === null) {
      apiMeOrganizers().then((value: OrganizersAPI.MeOrganizersResp) => {
        setOrg(value);
      });
    }
  }, []);

  // 检查用户是否加入了团队
  useEffect(() => {
    if (org?.data.items === null || org?.data.items?.length === 0) {
      message.warning('你还未加入任何团队，请加入后再创建比赛').then();
      history.replace({ pathname: '/user/organizers' });
    }
  }, [org]);

  // 提交表单数据
  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        Modal.confirm({
          title: '确认提交',
          content: '你确定要提交比赛信息吗？',
          onOk: async () => {
            const compJson: CompAPI.CompJson = {
              Events: events,
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
              Name: values.competitionName,
              StrId: values.competitionName,
              Illustrate: '',
              IllustrateHTML: values.description,
              RuleMD: '',
              RuleHTML: '',
              CompJSON: compJson,
              Count: values.maxParticipants | 500,
              CanPreResult: true,
              Genre: 0,
              CompStartTime: values.startDate.toISOString(),
              CompEndTime: values.endDate.toISOString(),
              GroupID: 0,
              CanStartedAddEvent: true,
              Apply: true,
            };
            console.log(req);
            console.log(values)
            apiCreateComps(values.organizersID, req).then((value) => {
              console.log(value)
              message.success("创建成功")
              // window.location.href = '/user/organizers';
            }).catch((values) => {
              message.error("创建失败: " + values)
            })
          },
        });
      })
      .catch((errorInfo) => {
        console.error('验证失败:', errorInfo);
      });
  };

  return (
    <>
      {BackButton('返回上层')}
      <Form layout="vertical" form={form}>
        <Card title={'基础信息'}>{BaseDataForm(org)}</Card>
        <Card title={'时间配置'} style={{ marginTop: 20 }}>
          {OtherDataForm()}
        </Card>
        <Card title={'项目配置'} style={{ marginTop: 20 }}>
          <Form.Item name="events" valuePropName="value" getValueFromEvent={(e) => e}>
            <EventTable onChange={(newEvents) => setEvents(newEvents)} />
          </Form.Item>
        </Card>
        <Card title={'比赛描述'} style={{ marginTop: 20 }}>
          <Form.Item name="description" valuePropName={'value'} getValueFromEvent={(e) => e}>
            <MarkdownEditor />
          </Form.Item>
        </Card>
        {/*提交按钮 */}
        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" onClick={handleSubmit}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CreateCompsPage;
