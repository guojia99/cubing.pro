"use client";

import "antd/dist/reset.css";

import { Heading, VStack } from "@chakra-ui/react";
import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { ColumnsType, FilterValue, TablePaginationConfig } from "antd/es/table/interface";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminUserSearchSelect } from "@/components/admin/AdminUserSearchSelect";
import { PlayerLink } from "@/components/Link/GcLinks";
import {
  type AdminCompetitionGroup,
  type AdminOrganizer,
  apiAdminAddOrganizerMember,
  apiAdminCreateGroup,
  apiAdminCreateOrganizer,
  apiAdminDeleteGroup,
  apiAdminDeleteOrganizer,
  apiAdminGetOrganizer,
  apiAdminOrganizersList,
  apiAdminRemoveOrganizerMember,
  apiAdminUpdateGroup,
  apiAdminUpdateOrganizer,
} from "@/services/cubing-pro/auth/admin_organizers";
import type { OrganizersStatus } from "@/services/cubing-pro/auth/typings";
import type { PlayersAPI } from "@/services/cubing-pro/players/typings";

const MAX_GROUPS_PER_ORG = 3;

const STATUS_OPTIONS: { label: string; value: OrganizersStatus }[] = [
  { label: "未使用", value: "NotUse" },
  { label: "已过期", value: "Expired" },
  { label: "使用中", value: "Using" },
  { label: "申请中", value: "Applying" },
  { label: "驳回申请", value: "RejectApply" },
  { label: "申诉中", value: "UnderAppeal" },
  { label: "驳回申诉", value: "RejectAppeal" },
  { label: "禁用", value: "Disable" },
  { label: "永久禁用", value: "PermanentlyDisabled" },
  { label: "解散", value: "Disband" },
];

type OrgMemberRow = { cubeId: string; display: string };

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
      /* comma-separated */
    }
    return t
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseAssUsers(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.filter((x) => typeof x === "string" && x) : [];
  } catch {
    return [];
  }
}

function organizerFormInitialValues(org: AdminOrganizer) {
  return {
    name: org.Name,
    introduction: org.Introduction,
    email: org.Email,
    leader_cube_id: org.LeaderID,
    status: org.Status,
    leader_remark: org.LeaderRemark,
    admin_message: org.AdminMessage,
  };
}

function groupFormInitialValues(group: AdminCompetitionGroup) {
  return {
    name: group.name,
    qq_groups: asStringList(group.qq_groups),
    qq_group_uid: asStringList(group.qq_group_uid),
    wechat_groups: asStringList(group.wechat_groups),
  };
}

function OrgMembersTableBlock({
  rows,
  setRows,
  pickKey,
  bumpPickKey,
}: {
  rows: OrgMemberRow[];
  setRows: React.Dispatch<React.SetStateAction<OrgMemberRow[]>>;
  pickKey: number;
  bumpPickKey: () => void;
}) {
  const tryAdd = (player: PlayersAPI.Player | null) => {
    if (!player?.CubeID) return;
    if (rows.some((r) => r.cubeId === player.CubeID)) {
      void message.warning("该用户已在成员列表中");
      bumpPickKey();
      return;
    }
    setRows((prev) => [
      ...prev,
      { cubeId: player.CubeID, display: `${player.Name || "未命名"}（${player.CubeID}）` },
    ]);
    bumpPickKey();
  };

  return (
    <div>
      <Table<OrgMemberRow>
        size="small"
        pagination={false}
        rowKey="cubeId"
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "暂无成员" }}
        columns={[
          {
            title: "序号",
            width: 56,
            align: "center",
            render: (_1, _2, index) => index + 1,
          },
          { title: "用户", dataIndex: "display", ellipsis: true },
          { title: "CubeID", dataIndex: "cubeId", width: 120 },
          {
            title: "操作",
            width: 72,
            align: "center",
            render: (_, row) => (
              <Button
                type="link"
                size="small"
                danger
                onClick={() => setRows((prev) => prev.filter((r) => r.cubeId !== row.cubeId))}
              >
                移除
              </Button>
            ),
          },
        ]}
        dataSource={rows}
      />
      <div style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 6, color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
          添加成员：在下方搜索并点选用户，将加入上表
        </div>
        <AdminUserSearchSelect
          key={pickKey}
          placeholder="输入姓名或 CubeID 搜索用户"
          onPlayerChange={(p) => tryAdd(p)}
        />
      </div>
    </div>
  );
}

export function AdminOrganizersPageView() {
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOrganizer | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrgId, setDetailOrgId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrganizer, setDetailOrganizer] = useState<AdminOrganizer | null>(null);
  const [detailGroups, setDetailGroups] = useState<AdminCompetitionGroup[]>([]);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [groupForm] = Form.useForm();

  const [groupModal, setGroupModal] = useState<{
    mode: "create" | "edit";
    group?: AdminCompetitionGroup;
  } | null>(null);

  const [createMemberRows, setCreateMemberRows] = useState<OrgMemberRow[]>([]);
  const [editMemberRows, setEditMemberRows] = useState<OrgMemberRow[]>([]);
  const [createMemberPickKey, setCreateMemberPickKey] = useState(0);
  const [editMemberPickKey, setEditMemberPickKey] = useState(0);

  const loadOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAdminOrganizersList({
        page,
        size: pageSize,
        Status: statusFilter,
      });
      setOrganizers(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    void loadOrganizers();
  }, [loadOrganizers]);

  useEffect(() => {
    if (createOpen) {
      setCreateMemberRows([]);
      setCreateMemberPickKey((k) => k + 1);
    }
  }, [createOpen]);

  const reloadDetail = useCallback(async (orgId: number) => {
    setDetailLoading(true);
    try {
      const res = await apiAdminGetOrganizer(orgId);
      setDetailOrganizer(res.organizer);
      setDetailGroups(res.groups || []);
    } catch {
      void message.error("加载详情失败");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openDetail = (org: AdminOrganizer) => {
    setDetailOrgId(org.id);
    setDetailOpen(true);
    void reloadDetail(org.id);
  };

  const handleCreate = async () => {
    let v;
    try {
      v = await createForm.validateFields();
    } catch {
      return;
    }
    setSubmitLoading(true);
    try {
      await apiAdminCreateOrganizer({
        name: (v.name as string).trim(),
        introduction: v.introduction,
        email: v.email,
        leader_cube_id: (v.leader_cube_id as string | undefined)?.trim() || "",
        status: v.status,
        leader_remark: v.leader_remark,
        admin_message: v.admin_message,
        ass_cube_ids: createMemberRows.map((r) => r.cubeId),
      });
      void message.success("已创建主办团队");
      createForm.resetFields();
      setCreateOpen(false);
      void loadOrganizers();
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEdit = (org: AdminOrganizer) => {
    setEditing(org);
    setEditMemberRows(
      parseAssUsers(org.AssOrganizerUsers).map((id) => ({
        cubeId: id,
        display: id,
      })),
    );
    setEditMemberPickKey((k) => k + 1);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editing) return;
    let v;
    try {
      v = await editForm.validateFields();
    } catch {
      return;
    }
    setSubmitLoading(true);
    try {
      await apiAdminUpdateOrganizer(editing.id, {
        name: (v.name as string | undefined)?.trim(),
        introduction: v.introduction,
        email: v.email,
        leader_cube_id: (v.leader_cube_id as string | undefined)?.trim() || "",
        status: v.status,
        leader_remark: v.leader_remark,
        admin_message: v.admin_message,
        ass_cube_ids: editMemberRows.map((r) => r.cubeId),
      });
      void message.success("已更新");
      setEditOpen(false);
      setEditing(null);
      void loadOrganizers();
    } finally {
      setSubmitLoading(false);
    }
  };

  const addMember = async () => {
    if (!detailOrgId) return;
    let v;
    try {
      v = await memberForm.validateFields();
    } catch {
      return;
    }
    setSubmitLoading(true);
    try {
      await apiAdminAddOrganizerMember(detailOrgId, {
        cube_id: (v.cube_id as string).trim(),
        grant_auth: !!v.grant_auth,
      });
      void message.success("已添加成员");
      memberForm.resetFields();
      await reloadDetail(detailOrgId);
    } finally {
      setSubmitLoading(false);
    }
  };

  const removeMember = async (cubeId: string) => {
    if (!detailOrgId) return;
    setSubmitLoading(true);
    try {
      await apiAdminRemoveOrganizerMember(detailOrgId, cubeId);
      void message.success("已移出成员");
      await reloadDetail(detailOrgId);
    } finally {
      setSubmitLoading(false);
    }
  };

  const submitGroup = async () => {
    if (!detailOrgId) return;
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
        if (detailGroups.length >= MAX_GROUPS_PER_ORG) {
          void message.error(`每个主办团队最多 ${MAX_GROUPS_PER_ORG} 个比赛群组`);
          return;
        }
        await apiAdminCreateGroup(detailOrgId, body);
        void message.success("已创建群组");
      } else if (groupModal?.group) {
        await apiAdminUpdateGroup(groupModal.group.id, body);
        void message.success("已更新群组");
      }
      setGroupModal(null);
      await reloadDetail(detailOrgId);
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteGroup = useCallback(
    async (g: AdminCompetitionGroup) => {
      setSubmitLoading(true);
      try {
        await apiAdminDeleteGroup(g.id);
        void message.success("已删除群组");
        if (detailOrgId) await reloadDetail(detailOrgId);
      } finally {
        setSubmitLoading(false);
      }
    },
    [detailOrgId, reloadDetail],
  );

  const groupColumns = useMemo(
    () => [
      { title: "名称", dataIndex: "name", key: "name" },
      {
        title: "QQ 群",
        key: "qq",
        render: (_: unknown, r: AdminCompetitionGroup) =>
          asStringList(r.qq_groups).join("、") || "—",
      },
      {
        title: "微信",
        key: "wx",
        render: (_: unknown, r: AdminCompetitionGroup) =>
          asStringList(r.wechat_groups).join("、") || "—",
      },
      {
        title: "操作",
        key: "op",
        render: (_: unknown, r: AdminCompetitionGroup) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => setGroupModal({ mode: "edit", group: r })}
            >
              编辑
            </Button>
            <Popconfirm title="确定删除该群组？" onConfirm={() => void deleteGroup(r)}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteGroup],
  );

  const columns: ColumnsType<AdminOrganizer> = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "团队名称", dataIndex: "Name", ellipsis: true },
    {
      title: "状态",
      dataIndex: "Status",
      width: 120,
      render: (status: string) => <Tag>{status}</Tag>,
      filteredValue: statusFilter ? [statusFilter] : null,
      filters: STATUS_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
    },
    {
      title: "组长 CubeID",
      dataIndex: "LeaderID",
      width: 130,
      render: (_, r) =>
        r.LeaderID ? (
          PlayerLink(r.LeaderID, r.LeaderID, "#000")
        ) : (
          <span style={{ color: "#999" }}>—</span>
        ),
    },
    { title: "联系邮箱", dataIndex: "Email", ellipsis: true },
    {
      title: "操作",
      width: 220,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => openDetail(r)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm
            title="仅当团队下无比赛时可删除；删除会同时移除该团队下全部比赛群组。"
            onConfirm={async () => {
              try {
                await apiAdminDeleteOrganizer(r.id);
                void message.success("已删除");
                void loadOrganizers();
              } catch {
                void message.error("删除失败");
              }
            }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const orgBaseFormItems = () => (
    <>
      <Form.Item name="name" label="团队名称" rules={[{ required: true, message: "必填" }]}>
        <Input placeholder="唯一名称" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true }]}>
        <Select options={STATUS_OPTIONS} placeholder="选择状态" />
      </Form.Item>
      <Form.Item name="introduction" label="介绍">
        <Input.TextArea rows={3} placeholder="支持 Markdown" />
      </Form.Item>
      <Form.Item name="email" label="联系邮箱">
        <Input />
      </Form.Item>
      <Form.Item name="leader_cube_id" label="组长">
        <AdminUserSearchSelect allowClear placeholder="搜索姓名或 CubeID 选择组长（可空）" />
      </Form.Item>
      <Form.Item name="leader_remark" label="组长备注">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="admin_message" label="管理员留言">
        <Input.TextArea rows={2} />
      </Form.Item>
    </>
  );

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
  ) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 20);
    const status = filters.Status?.[0];
    setStatusFilter(status != null ? String(status) : undefined);
  };

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Heading size="xl">主办团队管理</Heading>

        <div style={{ marginBottom: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建团队
          </Button>
        </div>

        <Table<AdminOrganizer>
          rowKey="id"
          columns={columns}
          dataSource={organizers}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />

        <Modal
          title="新建主办团队"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onOk={() => void handleCreate()}
          confirmLoading={submitLoading}
          width={720}
          destroyOnHidden
        >
          <Form
            form={createForm}
            layout="vertical"
            preserve={false}
            initialValues={{ status: "Using" }}
          >
            {orgBaseFormItems()}
            <Form.Item label="成员" colon={false}>
              <OrgMembersTableBlock
                rows={createMemberRows}
                setRows={setCreateMemberRows}
                pickKey={createMemberPickKey}
                bumpPickKey={() => setCreateMemberPickKey((k) => k + 1)}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="编辑主办团队"
          open={editOpen}
          onCancel={() => setEditOpen(false)}
          onOk={() => void handleEdit()}
          confirmLoading={submitLoading}
          width={720}
          destroyOnHidden
        >
          {editing ? (
            <Form
              key={editing.id}
              form={editForm}
              layout="vertical"
              preserve={false}
              initialValues={organizerFormInitialValues(editing)}
            >
              {orgBaseFormItems()}
              <Form.Item label="成员" colon={false}>
                <OrgMembersTableBlock
                  rows={editMemberRows}
                  setRows={setEditMemberRows}
                  pickKey={editMemberPickKey}
                  bumpPickKey={() => setEditMemberPickKey((k) => k + 1)}
                />
              </Form.Item>
            </Form>
          ) : null}
        </Modal>

        <Drawer
          title={detailOrganizer ? `主办团队：${detailOrganizer.Name}` : "主办详情"}
          size={720}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setDetailOrgId(null);
          }}
          destroyOnHidden
        >
          {detailLoading && !detailOrganizer ? (
            <div>加载中…</div>
          ) : detailOrganizer ? (
            <Tabs
              items={[
                {
                  key: "info",
                  label: "基本信息",
                  children: (
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="ID">{detailOrganizer.id}</Descriptions.Item>
                      <Descriptions.Item label="名称">{detailOrganizer.Name}</Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Tag>{detailOrganizer.Status}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="组长">
                        {detailOrganizer.LeaderID || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="邮箱">{detailOrganizer.Email || "—"}</Descriptions.Item>
                      <Descriptions.Item label="介绍">
                        {detailOrganizer.Introduction || "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "members",
                  label: "成员",
                  children: (
                    <div>
                      <Space wrap style={{ marginBottom: 16 }} align="start">
                        <Form form={memberForm} layout="inline" style={{ flex: 1 }}>
                          <Form.Item
                            name="cube_id"
                            rules={[{ required: true, message: "请选择成员" }]}
                            style={{ marginBottom: 0, minWidth: 280 }}
                          >
                            <AdminUserSearchSelect placeholder="搜索并选择成员" />
                          </Form.Item>
                          <Form.Item
                            name="grant_auth"
                            initialValue={false}
                            style={{ marginBottom: 0, width: 180 }}
                          >
                            <Select
                              options={[
                                { label: "同时授予主办权限", value: true },
                                { label: "仅加入团队", value: false },
                              ]}
                            />
                          </Form.Item>
                        </Form>
                        <Button type="primary" loading={submitLoading} onClick={() => void addMember()}>
                          添加成员
                        </Button>
                      </Space>
                      <Table
                        size="small"
                        rowKey="key"
                        pagination={false}
                        dataSource={[
                          ...(detailOrganizer.LeaderID
                            ? [
                                {
                                  key: "leader",
                                  cube: detailOrganizer.LeaderID,
                                  role: "组长",
                                  canRemove: false,
                                },
                              ]
                            : []),
                          ...parseAssUsers(detailOrganizer.AssOrganizerUsers).map((cube) => ({
                            key: cube,
                            cube,
                            role: "成员",
                            canRemove: true,
                          })),
                        ]}
                        columns={[
                          { title: "CubeID", dataIndex: "cube", key: "cube" },
                          { title: "角色", dataIndex: "role", width: 100 },
                          {
                            title: "操作",
                            key: "op",
                            width: 100,
                            render: (_, row: { cube: string; canRemove: boolean }) =>
                              row.canRemove ? (
                                <Popconfirm
                                  title="移出该成员？"
                                  onConfirm={() => void removeMember(row.cube)}
                                >
                                  <Button type="link" size="small" danger>
                                    移出
                                  </Button>
                                </Popconfirm>
                              ) : (
                                "—"
                              ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: "groups",
                  label: `比赛群组（最多 ${MAX_GROUPS_PER_ORG} 个）`,
                  children: (
                    <div>
                      <Button
                        type="primary"
                        style={{ marginBottom: 12 }}
                        disabled={detailGroups.length >= MAX_GROUPS_PER_ORG}
                        onClick={() => setGroupModal({ mode: "create" })}
                      >
                        新建群组
                      </Button>
                      <Table
                        size="small"
                        rowKey="id"
                        columns={groupColumns}
                        dataSource={detailGroups}
                        pagination={false}
                      />
                    </div>
                  ),
                },
              ]}
            />
          ) : null}
        </Drawer>

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
