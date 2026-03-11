import { Auth, checkAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import ThanksSection from '@/pages/Welcome/ThanksSection';
import {
  getAcknowledgmentsWithAdmin,
  setAcknowledgmentsWithAdmin,
} from '@/services/cubing-pro/auth/system';
import { Thank } from '@/services/cubing-pro/auth/typings';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';

const emptyThank = (): Thank => ({
  wcaID: '',
  nickname: '',
  amount: 0,
  avatar: '',
  other: '',
});

const AdminAcknowledgments: React.FC = () => {
  const user = checkAuth([Auth.AuthAdmin, Auth.AuthSuperAdmin]);


  const [list, setList] = useState<Thank[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByAmount, setSortByAmount] = useState<'asc' | 'desc' | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Thank | null>(null);
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form] = Form.useForm();


  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAcknowledgmentsWithAdmin();
      setList(data ?? []);
    } catch (err) {
      message.error('获取赞助列表失败');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);


  const displayList = React.useMemo(() => {
    if (sortByAmount === null) return list;
    return [...list].sort((a, b) => b.amount - a.amount); // 从大到小
  }, [list, sortByAmount]);

  if (user === null) {
    return <>无权限</>;
  }



  const handleApplySort = async () => {
    if (sortByAmount === null) return;
    try {
      await setAcknowledgmentsWithAdmin(displayList);
      message.success('排序已应用');
      setSortByAmount(null);
      fetchList();
    } catch {
      message.error('应用排序失败');
    }
  };

  const handleAdd = () => {
    setEditingItem(emptyThank());
    setEditIndex(-1);
    form.setFieldsValue({ nickname: '', amount: 0, wcaID: '', avatar: '', other: '' });
    setEditModalOpen(true);
  };

  const handleEdit = (record: Thank, index: number) => {
    setEditingItem({ ...record });
    setEditIndex(index);
    form.setFieldsValue({
      nickname: record.nickname,
      amount: record.amount,
      wcaID: record.wcaID ?? '',
      avatar: record.avatar ?? '',
      other: record.other ?? '',
    });
    setEditModalOpen(true);
  };

  const handleDelete = async (index: number) => {
    const newList = list.filter((_, i) => i !== index);
    try {
      await setAcknowledgmentsWithAdmin(newList);
      message.success('删除成功');
      fetchList();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const item: Thank = {
        nickname: values.nickname,
        amount: Number(values.amount),
        wcaID: values.wcaID?.trim?.() ?? '',
        avatar: values.avatar?.trim?.() ?? '',
        other: values.other?.trim?.() ?? '',
      };

      let newList: Thank[];
      if (editIndex >= 0) {
        newList = list.map((t, i) => (i === editIndex ? item : t));
      } else {
        newList = [...list, item];
      }

      await setAcknowledgmentsWithAdmin(newList);
      message.success(editIndex >= 0 ? '修改成功' : '添加成功');
      setEditModalOpen(false);
      fetchList();
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message);
      }
    }
  };

  const columns: ColumnsType<Thank> = [
    {
      title: '名称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      sorter: (a, b) => a.amount - b.amount,
      sortOrder: sortByAmount === 'desc' ? 'descend' : null,
      render: (v: number) => `¥${v}`,
    },
    {
      title: 'WCA ID',
      dataIndex: 'wcaID',
      key: 'wcaID',
      width: 130,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      ellipsis: true,
      render: (v: string) => (v ? '已设置' : '-'),
    },
    {
      title: '备注',
      dataIndex: 'other',
      key: 'other',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record, index) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record, index)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(index)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
          <Button onClick={() => setSortByAmount('desc')}>一键按金额从大到小排序</Button>
          {sortByAmount !== null && (
            <>
              <Button type="primary" onClick={handleApplySort}>
                应用排序
              </Button>
              <Button onClick={() => setSortByAmount(null)}>取消排序</Button>
            </>
          )}
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            预览展示效果
          </Button>
        </Space>

        <Table
          loading={loading}
          columns={columns}
          dataSource={displayList}
          rowKey={(_, i) => String(i)}
          pagination={false}
          onChange={(_, __, sorter: any) => {
            if (sorter?.columnKey === 'amount' && sorter?.order === 'descend') {
              setSortByAmount('desc');
            }
          }}
        />
      </Card>

      <Modal
        title={editIndex >= 0 ? '编辑赞助' : '新增赞助'}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nickname"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="赞助者名称" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="赞助金额" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="wcaID" label="WCA ID（可选）">
            <Input placeholder="如 2018LUOW01" />
          </Form.Item>
          <Form.Item name="avatar" label="头像 URL（可选）">
            <Input placeholder="头像图片链接" />
          </Form.Item>
          <Form.Item name="other" label="备注（可选）">
            <Input.TextArea placeholder="其他备注信息" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="预览展示效果"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={800}
      >
        {displayList.length > 0 ? (
          <ThanksSection data={displayList} />
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>暂无赞助数据</div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AdminAcknowledgments;
