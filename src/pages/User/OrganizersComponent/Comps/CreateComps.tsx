import BackButton from '@/components/Buttons/back_button';
import { Card, DatePicker, Form, Input, InputNumber } from 'antd';
import React from 'react';
import EventTable from "@/pages/User/OrganizersComponent/Comps/CreateCompsEventTables";

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
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item name="description" label="比赛描述">
        <Input.TextArea />
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
        <Card style={{marginTop: 20}}><EventTable /></Card>
      </Form>
    </>
  );
};
export default CreateCompsPage;
