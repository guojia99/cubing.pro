import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ScheduleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Upload,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';

interface Schedule {
  Round: string;
  Stage: string;
  Event: string;
  IsComp: boolean;
  StartTime: Date | null;
  EndTime: Date | null;
  Format: string;
  Competitors: number;
  NoRestrictions: boolean;
  Cutoff: number;
  CutoffNumber: number;
  TimeLimit: number;
  RoundNum: number;
  IsRunning: boolean;
  FirstRound: boolean;
  FinalRound: boolean;
}

interface CompetitionEvent {
  EventName: string;
  EventID: string;
  EventRoute: string;
  SingleQualify: number;
  AvgQualify: number;
  HasResultsQualify: boolean;
  Schedule: Schedule[];
  Done: boolean;
}

const { Option } = Select;

const EventTable: React.FC = () => {
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CompetitionEvent | null>(null);
  const [form] = Form.useForm();

  const eventOptions = ['333', '222', '444', 'sq1', 'skewb', 'clock'];

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
      render: (text: string, record: CompetitionEvent) => (
        <Select
          value={text}
          style={{ width: 120 }}
          onChange={(value) => handleEventChange(record.EventID, 'EventName', value)}
        >
          {eventOptions.map((option) => (
            <Option key={option} value={option}>
              {option}
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
      render: (text: number, record: CompetitionEvent) => (
        <InputNumber
          value={text}
          onChange={(value) => handleEventChange(record.EventID, 'SingleQualify', value)}
        />
      ),
    },
    {
      title: '全局平均资格线',
      dataIndex: 'AvgQualify',
      key: 'AvgQualify',
      width: 150,
      render: (text: number, record: CompetitionEvent) => (
        <InputNumber
          value={text}
          onChange={(value) => handleEventChange(record.EventID, 'AvgQualify', value)}
        />
      ),
    },
    {
      title: '赛程数',
      dataIndex: 'Schedule',
      key: 'ScheduleCount',
      render: (schedule: Schedule[]) => schedule.length,
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: CompetitionEvent) => (
        <>
          <Button
            type="primary"
            icon={<ScheduleOutlined />}
            onClick={() => showScheduleModal(record)}
            style={{ marginRight: 8 }}
          >
            安排赛程
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => deleteEvent(record.EventID)}>
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
      render: (text: string, record: Schedule, index: number) =>
        getRoundName(index, form.getFieldValue('Schedule').length),
    },
    {
      title: '赛台',
      dataIndex: 'Stage',
      key: 'Stage',
      width: 100,
      render: (text: string, record: Schedule, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleScheduleChange(index, 'Stage', e.target.value)}
        />
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'StartTime',
      key: 'StartTime',
      width: 200,
      render: (time: Date | null, record: Schedule, index: number) => (
        <DatePicker
          showTime
          value={time ? dayjs(time) : null}
          onChange={(value) =>
            handleScheduleChange(index, 'StartTime', value ?value.format("YYYY/MM/DD HH:mm") : null)
          }
        />
      ),
    },
    {
      title: '结束时间',
      dataIndex: 'EndTime',
      key: 'EndTime',
      width: 200,
      render: (time: Date | null, record: Schedule, index: number) => (
        <DatePicker
          showTime
          value={time ? dayjs(time) : null}
          onChange={(value) => {
            handleScheduleChange(index, 'EndTime', value ? value.format("YYYY/MM/DD HH:mm") : null);
          }}
        />
      ),
    },
    {
      title: '赛制',
      dataIndex: 'Format',
      key: 'Format',
      width: 100,
      render: (text: string, record: Schedule, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleScheduleChange(index, 'Format', e.target.value)}
        />
      ),
    },
    {
      title: '人数',
      dataIndex: 'Competitors',
      key: 'Competitors',
      width: 100,
      render: (text: number, record: Schedule, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) => handleScheduleChange(index, 'Competitors', value)}
        />
      ),
    },
    {
      title: '无限制',
      dataIndex: 'NoRestrictions',
      key: 'NoRestrictions',
      width: 100,
      render: (value: boolean, record: Schedule, index: number) => (
        <Switch
          checked={value}
          onChange={(checked) => handleScheduleChange(index, 'NoRestrictions', checked)}
        />
      ),
    },
    {
      title: '及格线',
      dataIndex: 'Cutoff',
      key: 'Cutoff',
      width: 100,
      render: (text: number, record: Schedule, index: number) => (
        <InputNumber
          value={text}
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
      render: (text: number, record: Schedule, index: number) => (
        <InputNumber
          value={text}
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
      render: (text: number, record: Schedule, index: number) => (
        <InputNumber
          value={text}
          onChange={(value) => {
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
          onClick={() => deleteSchedule(index)}
          disabled={index === 0}
        >
          删除
        </Button>
      ),
    },
  ];

  const showScheduleModal = (event: CompetitionEvent) => {
    setCurrentEvent(event);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...event,
      Schedule:
        event.Schedule.length > 0
          ? event.Schedule.map((s, index) => ({
              ...s,
              Round: getRoundName(index, event.Schedule.length),
              StartTime: s.StartTime ? dayjs(s.StartTime) : null,
              EndTime: s.EndTime ? dayjs(s.EndTime) : null,
            }))
          : [createDefaultSchedule(event.EventName)],
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const updatedEvent = {
        ...currentEvent!,
        ...values,
        Schedule: values.Schedule.map((s: any, index: number) => ({
          ...s,
          Round: getRoundName(index, values.Schedule.length),
          StartTime: s.StartTime ? s.StartTime.toDate() : null,
          EndTime: s.EndTime ? s.EndTime.toDate() : null,
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
    const newEvent: CompetitionEvent = {
      EventName: newEventName,
      EventID: Date.now().toString(),
      EventRoute: '',
      SingleQualify: 0,
      AvgQualify: 0,
      HasResultsQualify: false,
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
        const importedEvents: CompetitionEvent[] = JSON.parse(e.target?.result as string);
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
                : [createDefaultSchedule(event.EventName)],
          })),
        );
        message.success('数据导入成功');
      } catch (error) {
        message.error('数据导入失败，请检查文件格式');
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

  const createDefaultSchedule = (eventName: string): Schedule => ({
    Round: '决赛',
    Stage: '',
    Event: eventName,
    IsComp: true,
    StartTime: null,
    EndTime: null,
    Format: 'ao5',
    Competitors: 0,
    NoRestrictions: true,
    Cutoff: 0,
    CutoffNumber: 0,
    TimeLimit: 0,
    RoundNum: 1,
    IsRunning: false,
    FirstRound: true,
    FinalRound: true,
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
    const newSchedules = schedules.map((s: Schedule, i: number) =>
      i === index ? { ...s, [field]: value } : s,
    );
    form.setFieldsValue({
      Schedule: newSchedules.map((s, i) => ({
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
        Schedule: newSchedules.map((s: Schedule, i: number) => ({
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
            导入数据
          </Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={exportEvents}>
          导出数据
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
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="SingleQualify" label="单次资格线">
            <InputNumber />
          </Form.Item>
          <Form.Item name="AvgQualify" label="平均资格线">
            <InputNumber />
          </Form.Item>
          <Form.List name="Schedule">
            {(fields, { add, remove }) => (
              <>
                <Table
                  dataSource={fields}
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

export default EventTable;
