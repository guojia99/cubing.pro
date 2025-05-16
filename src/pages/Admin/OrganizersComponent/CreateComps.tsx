import BackButton from '@/components/Buttons/back_button';
import {Alert, Card, Col, DatePicker, Form, Input, InputNumber, Row} from 'antd';
import React from 'react';

import { CubesCn } from '@/components/CubeIcon/cube';
import MarkdownEditor from '@/components/Markdown/editer';
import {
  apiCreateComps,
  apiGetGroups,
  apiMeOrganizers,
} from '@/services/cubing-pro/auth/organizers';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
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
import { v4 as uuidv4 } from 'uuid';

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
      updateEvents(events.map((e) => (e.Key === updatedEvent.Key ? updatedEvent : e)));
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

    if (unusedEvents.length === 0) {
      message.warning('所有项目已全部加入，无法继续加载').then();
      return;
    }

    const newEventName = unusedEvents[0];
    const newEvent: CompAPI.Event = {
      Key: uuidv4(),
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
    ScrambleNums: 1,
    Scrambles: [],
    NotScramble: false,
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
        event.Key === key ? { ...event, ...{ EventName: value, EventID: value } } : event,
      ),
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
  const [curOrg, setCurOrg] = useState<number>(0);
  const [groups, setGroups] = useState<OrganizersAPI.GetGroupsResp | null>(null);

  const [form] = Form.useForm(); // 使用 Ant Design 的 Form
  const [events, setEvents] = useState<CompAPI.Event[]>([]);
  const [baseEvents, setBaseEvents] = useState<EventsAPI.Event[]>([]);

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

  useEffect(() => {
    if (curOrg === 0) {
      return;
    }
    apiGetGroups(curOrg).then((value) => {
      setGroups(value);
    });
  }, [curOrg]);

  useEffect(() => {
    apiEvents().then((value) => {
      setBaseEvents(value.data.Events);
    });
  }, []);

  // 提交表单数据
  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        Modal.confirm({
          title: '确认提交',
          content: (
            <>
              <p>你确定要提交比赛信息吗？</p>
              <Alert message={"生成打乱可能要等待 2 ~ 20秒"} showIcon={true} type={"warning"}  />
            </>
          ),
          onOk: async () => {
            for (let i = 0; i < events.length; i++) {
              const f = baseEvents.find((value) => value.id === events[i].EventID);
              if (f === undefined) {
                message.warning('项目错误').then();
                return;
              }
              events[i].EventRoute = f.base_route_typ;
            }
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
              GroupID: values.groupsID,
              CanStartedAddEvent: true,
              Apply: true,
            };
            console.log(req);
            console.log(values);
            await apiCreateComps(values.organizersID, req)
              .then((value) => {
                console.log(value);
                message.success('创建成功');
                window.location.href = '/user/organizers';
              })
              .catch((values) => {
                message.error('创建失败: ' + values);
              });
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
        <Card title={'基础信息'}>
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
              <Col span={12}>
                <Form.Item name="maxParticipants" label="最大参与人数">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
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
                      setCurOrg(value);
                      // todo 这里有bug， 多个群组同时存在时，切换主办这里要清空，但是这里清空不了
                    }}
                  >
                    {org?.data.items.map((o) => (
                      <Select.Option key={o.id} value={o.id}>
                        {o.Name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="groupsID"
                  label="群组"
                  // style={{ width: '50%' }}
                  rules={[{ required: true, message: '选择群组' }]}
                >
                  <Select placeholder="选择群组">
                    {groups?.data.items.map((o) => (
                      <Select.Option key={o.id} value={o.id}>
                        {o.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <p>比赛类型: 线上</p>
              </Col>
            </Row>
          </>
        </Card>
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
