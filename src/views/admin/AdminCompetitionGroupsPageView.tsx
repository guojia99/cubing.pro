"use client";

import "antd/dist/reset.css";

import { Heading, VStack } from "@chakra-ui/react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import {
  type AdminCompetitionGroup,
  apiAdminCreateGroup,
  apiAdminDeleteGroup,
  apiAdminOrganizerGroups,
  apiAdminOrganizersList,
  apiAdminUpdateGroup,
} from "@/services/cubing-pro/auth/admin_organizers";

const MAX_GROUPS_PER_ORG = 3;

function asStringList(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t);
      if (Array.isArray(p)) return p.map(String).filter(Boolean);
    } catch {
      /* comma */
    }
    return t
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function groupFormInitialValues(group: AdminCompetitionGroup) {
  return {
    name: group.name,
    qq_groups: asStringList(group.qq_groups),
    qq_group_uid: asStringList(group.qq_group_uid),
    wechat_groups: asStringList(group.wechat_groups),
  };
}

export function AdminCompetitionGroupsPageView() {
  const [orgOptions, setOrgOptions] = useState<{ label: string; value: number }[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

  const [groups, setGroups] = useState<AdminCompetitionGroup[]>([]);
  const [groupTotal, setGroupTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [groupModal, setGroupModal] = useState<{
    mode: "create" | "edit";
    group?: AdminCompetitionGroup;
  } | null>(null);
  const [groupForm] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

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
    void load();
  }, []);

  const loadGroups = useCallback(async () => {
    if (!selectedOrgId) return;
    setTableLoading(true);
    try {
      const res = await apiAdminOrganizerGroups(selectedOrgId, { page, size: pageSize });
      setGroups(res.items);
      setGroupTotal(res.total);
    } finally {
      setTableLoading(false);
    }
  }, [selectedOrgId, page, pageSize]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const deleteGroup = async (g: AdminCompetitionGroup) => {
    setSubmitLoading(true);
    try {
      await apiAdminDeleteGroup(g.id);
      void message.success("已删除");
      void loadGroups();
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: ColumnsType<AdminCompetitionGroup> = [
    { title: "ID", dataIndex: "id", width: 72 },
    { title: "名称", dataIndex: "name", ellipsis: true },
    {
      title: "QQ 群",
      ellipsis: true,
      render: (_, r) => asStringList(r.qq_groups).join("、") || "—",
    },
    {
      title: "QQ UID",
      ellipsis: true,
      render: (_, r) => asStringList(r.qq_group_uid).join("、") || "—",
    },
    {
      title: "微信群",
      ellipsis: true,
      render: (_, r) => asStringList(r.wechat_groups).join("、") || "—",
    },
    {
      title: "操作",
      width: 160,
      render: (_, r) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setGroupModal({ mode: "edit", group: r })}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该群组？" onConfirm={() => void deleteGroup(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submitGroup = async () => {
    if (!selectedOrgId) return;
    let v;
    try {
      v = await groupForm.validateFields();
    } catch {
      return;
    }
    const body = {
      name: (v.name as string).trim(),
      qq_groups: (v.qq_groups as string[] | undefined) || [],
      qq_group_uid: (v.qq_group_uid as string[] | undefined) || [],
      wechat_groups: (v.wechat_groups as string[] | undefined) || [],
    };
    setSubmitLoading(true);
    try {
      if (groupModal?.mode === "create") {
        if (groupTotal >= MAX_GROUPS_PER_ORG) {
          void message.error(`每个主办团队最多 ${MAX_GROUPS_PER_ORG} 个比赛群组`);
          return;
        }
        await apiAdminCreateGroup(selectedOrgId, body);
        void message.success("已创建");
      } else if (groupModal?.group) {
        await apiAdminUpdateGroup(groupModal.group.id, body);
        void message.success("已更新");
      }
      setGroupModal(null);
      void loadGroups();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 20);
  };

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Heading size="xl">比赛群组管理</Heading>
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
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
              onChange={(v) => {
                setSelectedOrgId(v);
                setPage(1);
              }}
              allowClear
            />
          </Space>

          {!selectedOrgId ? (
            <div style={{ color: "var(--faint-foreground)" }}>
              请先选择主办团队以查看与管理该团队下的比赛群组。
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={groupTotal >= MAX_GROUPS_PER_ORG}
                  onClick={() => setGroupModal({ mode: "create" })}
                >
                  新建群组
                </Button>
              </div>
              <Table<AdminCompetitionGroup>
                rowKey="id"
                columns={columns}
                dataSource={groups}
                loading={tableLoading}
                pagination={{
                  current: page,
                  pageSize,
                  total: groupTotal,
                  showSizeChanger: true,
                }}
                onChange={handleTableChange}
              />
            </>
          )}
        </Space>

        <Modal
          title={groupModal?.mode === "edit" ? "编辑比赛群组" : "新建比赛群组"}
          open={!!groupModal}
          onCancel={() => setGroupModal(null)}
          onOk={() => void submitGroup()}
          confirmLoading={submitLoading}
          destroyOnHidden
        >
          {groupModal ? (
            <Form
              key={groupModal.mode === "edit" ? String(groupModal.group?.id) : "create"}
              form={groupForm}
              layout="vertical"
              preserve={false}
              initialValues={
                groupModal.mode === "edit" && groupModal.group
                  ? groupFormInitialValues(groupModal.group)
                  : undefined
              }
            >
              <Form.Item name="name" label="群组名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="qq_groups" label="QQ 群号">
                <Select mode="tags" placeholder="输入后回车" tokenSeparators={[","]} />
              </Form.Item>
              <Form.Item name="qq_group_uid" label="QQ 群 UID">
                <Select mode="tags" placeholder="输入后回车" tokenSeparators={[","]} />
              </Form.Item>
              <Form.Item name="wechat_groups" label="微信群">
                <Select mode="tags" placeholder="输入后回车" tokenSeparators={[","]} />
              </Form.Item>
            </Form>
          ) : null}
        </Modal>
      </VStack>
    </AdminGuard>
  );
}
