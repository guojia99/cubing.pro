import {
  apiCreateSportEvent,
  apiDeleteSportEvent,
  apiGetSportEvents,
} from '@/services/cubing-pro/sports/sports';
import { ActionType, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Popconfirm, Select, message } from 'antd';
import React, { useState } from 'react';
import {
  GiRunningShoe,
  GiTrail,
  GiSprint,
  GiMountainClimbing,
  GiRoad,
  GiCycling,
  GiSwimfins,
} from 'react-icons/gi';
import {
  FaBiking,
  FaSwimmer,
  FaHiking,
  FaWalking,
} from 'react-icons/fa';
import { MdDirectionsBike } from 'react-icons/md';
import { IoFootstepsOutline } from 'react-icons/io5';
import { RiRunLine } from 'react-icons/ri';
import {FaPersonRunning} from "react-icons/fa6";

export type SportEvent = {
  id: string;
  name: string;
  icon?: string;
};

export const iconOptions = [
  // 跑步相关
  { label: '跑步鞋', value: 'GiRunningShoe', icon: <GiRunningShoe /> },
  { label: '奔跑', value: 'FaPersonRunning', icon: <FaPersonRunning /> },
  { label: '竞速', value: 'GiSprint', icon: <GiSprint /> },
  { label: '越野跑', value: 'GiTrail', icon: <GiTrail /> },
  { label: '慢走', value: 'FaWalking', icon: <FaWalking /> },
  { label: '马拉松', value: 'IoFootstepsOutline', icon: <IoFootstepsOutline /> },
  { label: '健身跑', value: 'RiRunLine', icon: <RiRunLine /> },

  // 铁人三项
  // { label: '铁人三项', value: 'GiTriathlete', icon: <GiTriathlete /> },

  // 骑行相关
  { label: '公路骑行', value: 'GiRoad', icon: <GiRoad /> },
  { label: '山地骑行', value: 'GiMountainClimbing', icon: <GiMountainClimbing /> },
  { label: '骑行者', value: 'GiCycling', icon: <GiCycling /> },
  { label: '骑车中', value: 'FaBiking', icon: <FaBiking /> },
  { label: '骑行（路线）', value: 'MdDirectionsBike', icon: <MdDirectionsBike /> },

  // 游泳
  { label: '游泳', value: 'FaSwimmer', icon: <FaSwimmer /> },
  { label: '蛙鞋', value: 'GiSwimfins', icon: <GiSwimfins /> },

  // 登山健走
  { label: '徒步', value: 'FaHiking', icon: <FaHiking /> },
];


export const iconMap: Record<string, React.ReactNode> = {
  GiRunningShoe: <GiRunningShoe />,
  FaPersonRunning: <FaPersonRunning />,
  GiSprint: <GiSprint />,
  GiTrail: <GiTrail />,
  FaWalking: <FaWalking />,
  IoFootstepsOutline: <IoFootstepsOutline />,
  RiRunLine: <RiRunLine />,

  // GiTriathlete: <GiTriathlete />,

  GiRoad: <GiRoad />,
  GiMountainClimbing: <GiMountainClimbing />,
  GiCycling: <GiCycling />,
  FaBiking: <FaBiking />,
  MdDirectionsBike: <MdDirectionsBike />,

  FaSwimmer: <FaSwimmer />,
  GiSwimfins: <GiSwimfins />,

  FaHiking: <FaHiking />,
};


const SportEventList: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const actionRef = React.useRef<ActionType>();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await apiCreateSportEvent(values);
      message.success('创建成功');
      setModalOpen(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    await apiDeleteSportEvent(id);
    message.success('删除成功');
    actionRef.current?.reload();
  };

  return (
    <>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{marginBottom: 10}}>
        新建项目
      </Button>

      <ProTable<SportEvent>
        rowKey="id"
        actionRef={actionRef}
        columns={[
          {
            title: '项目名',
            dataIndex: 'name',
            render: (text, record) => {
              return <>{iconMap[record.icon || ''] || '-'} {record.name}</>;
            },
          },
          {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
              <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} key="delete">
                <a style={{color: "red"}}>删除</a>
              </Popconfirm>,
            ],
          },
        ]}
        request={async () => {
          const data = await apiGetSportEvents();
          return {
            data: data.data.events,
            success: true,
          };
        }}
        search={false}
      />

      <Modal
        title="新建项目"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Select
              options={iconOptions.map((item) => ({
                label: (
                  <span>
                    {item.icon} {item.label}
                  </span>
                ),
                value: item.value,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SportEventList;
