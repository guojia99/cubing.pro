import { apiGetAllPlayers } from '@/services/cubing-pro/auth/organizers';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import {
  apiCreateSportResult,
  apiDeleteSportResult,
  apiGetSportEvents,
  apiGetSportResults,
} from '@/services/cubing-pro/sports/sports';
import { CreateSportResultReq, SportEvent, SportResult } from '@/services/cubing-pro/sports/types';
import { ActionType, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, message } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';

function parseTimeToSeconds(inputTime: string): number {
  const input = inputTime.trim();
  const parts = input.split(':');

  // 支持：ss.SSS
  if (parts.length === 1) {
    return parseFloat(parts[0]);
  }

  // 支持：mm:ss.SSS、hh:mm:ss.SSS
  let seconds = 0;
  const reversed = parts.reverse();

  if (reversed[0]) seconds += parseFloat(reversed[0]); // 秒（含毫秒）
  if (reversed[1]) seconds += parseInt(reversed[1]) * 60; // 分
  if (reversed[2]) seconds += parseInt(reversed[2]) * 3600; // 时

  return seconds;
}

const formatSecondsToTime = (s: number) => {
  const minutes = Math.floor(s / 60);
  const seconds = (s % 60).toFixed(2).padStart(5, '0'); // 保留两位小数
  return `${minutes}:${seconds}`;
};

const SportResultList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [players, setPlayers] = useState<PlayersAPI.Player[]>();

  useEffect(() => {
    // 获取事件列表用于下拉框
    apiGetSportEvents().then((res) => {
      setEvents(res.data.events);
    });

    apiGetAllPlayers('1', '1').then((value) => {
      setPlayers(value.data.items);
    });
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const params: CreateSportResultReq = {
        ...values,
        result: parseTimeToSeconds(values.result), // 使用新解析函数
        date: values.date.format('YYYY-MM-DD'),
      };
      await apiCreateSportResult(params);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    await apiDeleteSportResult(id);
    message.success('删除成功');
    actionRef.current?.reload();
  };

  return (
    <>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 10 }}>
        添加成绩
      </Button>

      <ProTable<SportResult>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={[
          { title: '项目名称', dataIndex: 'event_name' },
          { title: '选手', dataIndex: 'user_name' },
          {
            title: '成绩',
            dataIndex: 'Result',
            render: (text, record) => {
              return formatSecondsToTime(record.Result);
            },
          },
          { title: '日期', dataIndex: 'Date' },
          {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
              <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
                <a>删除</a>
              </Popconfirm>,
            ],
          },
        ]}
        request={async (params) => {
          const query = {
            page: params.current || 1,
            page_size: params.pageSize || 10,
            event_name: params.event_name,
            user_id: params.user_id,
            date: params.date ? dayjs(params.date).format('YYYY-MM-DD') : undefined,
          };
          const data = await apiGetSportResults(query);
          return {
            data: data.data.items,
            success: true,
            total: data.data.items.length, // 如果支持分页，请替换成后端返回的总数
          };
        }}
        columnsState={{}}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="添加运动成绩"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="event_id" label="项目" rules={[{ required: true }]}>
            <Select
              showSearch
              options={events.map((event) => ({
                label: event.name,
                value: event.id,
              }))}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="user_id"
            label="用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="请输入姓名搜索用户"
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
              options={(players || []).map((player) => ({
                label: `${player.Name}（ID: ${player.CubeID}）`,
                value: player.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="result"
            label="成绩时间"
            rules={[{ required: true, message: '请输入成绩时间' }]}
          >
            <Input placeholder="支持格式：12.345, 01:23.45, 01:02:03.123 等" />
          </Form.Item>

          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SportResultList;
