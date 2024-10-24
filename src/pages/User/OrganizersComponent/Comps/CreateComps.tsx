import BackButton from '@/components/Buttons/back_button';
import { Card, DatePicker, Form, Input, InputNumber } from 'antd';
import React from 'react';

import { CubesCn } from '@/components/CubeIcon/cube';
import MarkdownEditor from '@/components/Markdown/editer';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ScheduleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Select, Switch, Table, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Option } = Select;

const EventTable: React.FC = () => {
  const [events, setEvents] = useState<CompAPI.Event[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CompAPI.Event | null>(null);
  const [form] = Form.useForm();

  const [eventOptions, setEventOptions] = useState<string[]>([]);

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
      title: '全局单次资格线',
      dataIndex: 'SingleQualify',
      key: 'SingleQualify',
      width: 150,
      render: (text: number, record: CompAPI.Event) => (
        <InputNumber
          value={text}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(value) => handleEventChange(record.EventID, 'SingleQualify', value)}
        />
      ),
    },
    {
      title: '全局平均资格线',
      dataIndex: 'AvgQualify',
      key: 'AvgQualify',
      width: 150,
      render: (text: number, record: CompAPI.Event) => (
        <InputNumber
          value={text}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(value) => handleEventChange(record.EventID, 'AvgQualify', value)}
        />
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
      title: '无限制',
      dataIndex: 'NoRestrictions',
      key: 'NoRestrictions',
      width: 100,
      render: (value: boolean, record: CompAPI.Schedule, index: number) => (
        <Switch
          checked={value}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(checked) => handleScheduleChange(index, 'NoRestrictions', checked)}
        />
      ),
    },
    {
      title: '人数',
      dataIndex: 'Competitors',
      key: 'Competitors',
      width: 100,
      render: (text: number, record: CompAPI.Schedule, index: number) => (
        <InputNumber
          value={text}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(value) => handleScheduleChange(index, 'Competitors', value)}
        />
      ),
    },
    {
      title: '及格线',
      dataIndex: 'Cutoff',
      key: 'Cutoff',
      width: 100,
      render: (text: number, record: CompAPI.Schedule, index: number) => (
        <InputNumber
          value={text}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(value) => handleScheduleChange(index, 'Cutoff', value)}
          disabled={record.NoRestrictions}
        />
      ),
    },
    {
      title: '及格线把数',
      dataIndex: 'CutoffNumber',
      key: 'CutoffNumber',
      width: 100,
      render: (text: number, record: CompAPI.Schedule, index: number) => (
        <InputNumber
          value={text}
          /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
          onChange={(value) => handleScheduleChange(index, 'CutoffNumber', value)}
          disabled={record.NoRestrictions}
        />
      ),
    },
    {
      title: '还原时限',
      dataIndex: 'TimeLimit',
      key: 'TimeLimit',
      width: 100,
      render: (text: number, record: CompAPI.Schedule, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) => {
            /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
            handleScheduleChange(index, 'TimeLimit', value);
          }}
          disabled={record.NoRestrictions}
        />
      ),
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
          // StartTime: s.StartTime ? s.StartTime : null,
          // EndTime: s.EndTime ? s.EndTime : null,
        })),
      };
      setEvents(events.map((e) => (e.EventID === updatedEvent.EventID ? updatedEvent : e)));
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
    setEvents([...events, newEvent]);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.EventID !== eventId));
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
        setEvents(
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
    setEvents(
      events.map((event) => (event.EventID === eventId ? { ...event, [field]: value } : event)),
    );
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const schedules = form.getFieldValue('Schedule');
    const newSchedules = schedules.map((s: CompAPI.Schedule, i: number) =>
      i === index ? { ...s, [field]: value } : s,
    );
    form.setFieldsValue({
      Schedule: newSchedules.map((s: any, i: number) => ({
        ...s,
        Round: getRoundName(i, newSchedules.length),
        FirstRound: i === 0,
        FinalRound: i === newSchedules.length - 1,
      })),
    });
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
          <Form.Item name="SingleQualify" label="全局单次资格线">
            <InputNumber />
          </Form.Item>
          <Form.Item name="AvgQualify" label="全局平均资格线">
            <InputNumber />
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

const BaseDataForm = () => {
  return (
    <>
      <Form.Item
        name="competitionName"
        label="比赛名称"
        rules={[{ required: true, message: '请输入比赛名称！' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="organizersID"
        label="所在团队"
        rules={[{ required: true, message: '选择所在团队名称' }]}
      >
        <Input />
      </Form.Item>
    </>
  );
};

const OtherDataForm = () => {
  return (
    <>
      <Form.Item
        name="startDate"
        label="开始日期"
        rules={[{ required: true, message: '请选择开始日期！' }]}
      >
        <DatePicker />
      </Form.Item>
      <Form.Item
        name="endDate"
        label="结束日期"
        rules={[{ required: true, message: '请选择结束日期！' }]}
      >
        <DatePicker />
      </Form.Item>
      <Form.Item
        name="maxParticipants"
        label="最大参与人数"
        rules={[{ required: true, message: '请输入最大参与人数！' }]}
      >
        <InputNumber min={1} defaultValue={1000} />
      </Form.Item>
    </>
  );
};

const CreateCompsPage: React.FC = () => {
  // todo 获取一次本人所在团队，判断是否有可操作的权限， 只有leader可以创建比赛
  // todo 无权限则跳转回去

  return (
    <>
      {BackButton('返回上层')}
      <Form layout="vertical">
        <Card>{BaseDataForm()}</Card>
        <Card style={{ marginTop: 20 }}>{OtherDataForm()}</Card>
        <Card style={{ marginTop: 20 }}>
          <EventTable />
        </Card>
        <Card style={{ marginTop: 20 }}>
          <Form.Item>
            <MarkdownEditor title={'比赛描述'} onChange={() => {}} />
          </Form.Item>
        </Card>
      </Form>
    </>
  );
};
export default CreateCompsPage;
