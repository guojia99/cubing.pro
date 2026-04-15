import { Auth, checkAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import {
  AdminCompetitionGroup,
  apiAdminCreateGroup,
  apiAdminDeleteGroup,
  apiAdminOrganizersList,
  apiAdminOrganizerGroups,
  apiAdminUpdateGroup,
} from '@/services/cubing-pro/auth/admin_organizers';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-table';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const MAX_GROUPS_PER_ORG = 3;

function asStringList(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t);
      if (Array.isArray(p)) return p.map(String).filter(Boolean);
    } catch {
      /* comma */
    }
    return t.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const AdminCompetitionGroups: React.FC = () => {
  const user = checkAuth([Auth.AuthAdmin, Auth.AuthSuperAdmin]);
  if (user === null) {
    return <>无权限</>;
  }

  const [orgOptions, setOrgOptions] = useState<{ label: string; value: number }[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

  const [groupModal, setGroupModal] = useState<{ mode: 'create' | 'edit'; group?: AdminCompetitionGroup } | null>(
    null,
  );
  const [groupForm] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [groupCount, setGroupCount] = useState(0);
  const tableActionRef = useRef<ActionType>();

  useEffect(() => {
    const load = async () => {
      setOrgLoading(true);
      try {
        const res = await apiAdminOrganizersList({ page: 1, size: 100 });
        setOrgOptions(
          res.items.map((o) => ({
            label: `${o.Name}（id: ${o.id}）`,
            value: o.id,
          })),
        );
      } finally {
        setOrgLoading(false);
      }
    };
    load();
  }, []);

  const deleteGroup = useCallback(async (g: AdminCompetitionGroup) => {
    setSubmitLoading(true);
    try {
      await apiAdminDeleteGroup(g.id);
      message.success('已删除');
      tableActionRef.current?.reload();
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  const columns: ProColumns<AdminCompetitionGroup>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, search: false },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    {
      title: 'QQ 群',
      search: false,
      ellipsis: true,
      render: (_, r) => asStringList(r.qq_groups).join('、') || '—',
    },
    {
      title: 'QQ UID',
      search: false,
      ellipsis: true,
      render: (_, r) => asStringList(r.qq_group_uid).join('、') || '—',
    },
    {
      title: '微信群',
      search: false,
      ellipsis: true,
      render: (_, r) => asStringList(r.wechat_groups).join('、') || '—',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, r) => [
        <Button
          key="e"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setGroupModal({ mode: 'edit', group: r });
            groupForm.setFieldsValue({
              name: r.name,
              qq_groups: asStringList(r.qq_groups),
              qq_group_uid: asStringList(r.qq_group_uid),
              wechat_groups: asStringList(r.wechat_groups),
            });
          }}
        >
          编辑
        </Button>,
        <Popconfirm key="d" title="确定删除该群组？" onConfirm={() => deleteGroup(r)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const submitGroup = async () => {
    if (!selectedOrgId) return;
    const v = await groupForm.validateFields();
    const body = {
      name: v.name.trim(),
      qq_groups: (v.qq_groups as string[] | undefined) || [],
      qq_group_uid: (v.qq_group_uid as string[] | undefined) || [],
      wechat_groups: (v.wechat_groups as string[] | undefined) || [],
    };
    setSubmitLoading(true);
    try {
      if (groupModal?.mode === 'create') {
        if (groupCount >= MAX_GROUPS_PER_ORG) {
          message.error(`每个主办团队最多 ${MAX_GROUPS_PER_ORG} 个比赛群组`);
          return;
        }
        await apiAdminCreateGroup(selectedOrgId, body);
        message.success('已创建');
      } else if (groupModal?.group) {
        await apiAdminUpdateGroup(groupModal.group.id, body);
        message.success('已更新');
      }
      setGroupModal(null);
      groupForm.resetFields();
      tableActionRef.current?.reload();
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <PageContainer title="比赛群组管理">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap>
          <span>选择主办团队：</span>
          <Select
            showSearch
            optionFilterProp="label"
            loading={orgLoading}
            placeholder="请选择"
            style={{ minWidth: 320 }}
            options={orgOptions}
            value={selectedOrgId}
            onChange={(v) => setSelectedOrgId(v)}
            allowClear
          />
        </Space>

        {!selectedOrgId ? (
          <div style={{ color: '#999' }}>请先选择主办团队以查看与管理该团队下的比赛群组。</div>
        ) : (
          <ProTable<AdminCompetitionGroup>
            rowKey="id"
            actionRef={tableActionRef}
            columns={columns}
            search={false}
            options={false}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            toolBarRender={() => [
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                disabled={groupCount >= MAX_GROUPS_PER_ORG}
                onClick={() => {
                  setGroupModal({ mode: 'create' });
                  groupForm.resetFields();
                }}
              >
                新建群组
              </Button>,
            ]}
            request={async (params) => {
              const res = await apiAdminOrganizerGroups(selectedOrgId!, {
                page: params.current || 1,
                size: params.pageSize || 20,
              });
              setGroupCount(res.total);
              return { data: res.items, success: true, total: res.total };
            }}
            params={{ org: selectedOrgId }}
          />
        )}
      </Space>

      <Modal
        title={groupModal?.mode === 'edit' ? '编辑比赛群组' : '新建比赛群组'}
        open={!!groupModal}
        onCancel={() => setGroupModal(null)}
        onOk={submitGroup}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={groupForm} layout="vertical" preserve={false}>
          <Form.Item name="name" label="群组名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="qq_groups" label="QQ 群号">
            <Select mode="tags" placeholder="输入后回车" tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name="qq_group_uid" label="QQ 群 UID">
            <Select mode="tags" placeholder="输入后回车" tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name="wechat_groups" label="微信群">
            <Select mode="tags" placeholder="输入后回车" tokenSeparators={[',']} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AdminCompetitionGroups;
