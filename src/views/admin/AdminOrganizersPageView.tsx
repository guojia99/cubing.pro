"use client";
import { useI18n } from "@/contexts/I18nProvider";
import { useAdminManagement } from "@/views/admin/useAdminManagement";

import "antd/dist/reset.css";

import { VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";
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
  const { t } = useI18n();
  const m = useAdminManagement();
  const tryAdd = (player: PlayersAPI.Player | null) => {
    if (!player?.CubeID) return;
    if (rows.some((r) => r.cubeId === player.CubeID)) {
      void message.warning(m("adminManagement.memberExists"));
      bumpPickKey();
      return;
    }
    setRows((prev) => [
      ...prev,
      { cubeId: player.CubeID, display: `${player.Name || t("competitionAdmin.unnamed")}（${player.CubeID}）` },
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
        locale={{ emptyText: m("adminManagement.noMembers") }}
        columns={[
          {
            title: t("competitionAdmin.index"),
            width: 56,
            align: "center",
            render: (_1, _2, index) => index + 1,
          },
          { title: m("adminManagement.userName"), dataIndex: "display", ellipsis: true },
          { title: "CubeID", dataIndex: "cubeId", width: 120 },
          {
            title: t("teamMatch.actions"),
            width: 72,
            align: "center",
            render: (_, row) => (
              <Button
                type="link"
                size="small"
                danger
                onClick={() => setRows((prev) => prev.filter((r) => r.cubeId !== row.cubeId))}
              >
                {m("adminManagement.remove")}
              </Button>
            ),
          },
        ]}
        dataSource={rows}
      />
      <div style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 6, color: "var(--muted-foreground)", fontSize: 12 }}>
          {m("adminManagement.addMemberHint")}
        </div>
        <AdminUserSearchSelect
          key={pickKey}
          placeholder={m("adminManagement.searchMember")}
          onPlayerChange={(p) => tryAdd(p)}
        />
      </div>
    </div>
  );
}

export function AdminOrganizersPageView() {
  const { t } = useI18n();
  const m = useAdminManagement();
  const statusOptions: { label: string; value: OrganizersStatus }[] = [
    { label: m("adminManagement.statusNotUse"), value: "NotUse" },
    { label: m("adminManagement.statusExpired"), value: "Expired" },
    { label: m("adminManagement.statusUsing"), value: "Using" },
    { label: m("adminManagement.statusApplying"), value: "Applying" },
    { label: m("adminManagement.statusRejectApply"), value: "RejectApply" },
    { label: m("adminManagement.statusUnderAppeal"), value: "UnderAppeal" },
    { label: m("adminManagement.statusRejectAppeal"), value: "RejectAppeal" },
    { label: t("competitionAdmin.banned"), value: "Disable" },
    { label: m("adminManagement.statusPermanent"), value: "PermanentlyDisabled" },
    { label: m("adminManagement.statusDisband"), value: "Disband" },
  ];
  const statusLabel = (status: string) => statusOptions.find((option) => option.value === status)?.label ?? status;
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
      void message.error(m("adminManagement.detailsFailed"));
    } finally {
      setDetailLoading(false);
    }
  }, [m]);

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
      void message.success(m("adminManagement.organizerCreated"));
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
      void message.success(m("adminManagement.updated"));
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
      void message.success(m("adminManagement.memberAdded"));
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
      void message.success(m("adminManagement.memberRemoved"));
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
          void message.error(m("adminManagement.groupsLimit", { count: MAX_GROUPS_PER_ORG }));
          return;
        }
        await apiAdminCreateGroup(detailOrgId, body);
        void message.success(m("adminManagement.groupCreated"));
      } else if (groupModal?.group) {
        await apiAdminUpdateGroup(groupModal.group.id, body);
        void message.success(m("adminManagement.groupUpdated"));
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
        void message.success(m("adminManagement.groupDeleted"));
        if (detailOrgId) await reloadDetail(detailOrgId);
      } finally {
        setSubmitLoading(false);
      }
    },
    [detailOrgId, reloadDetail, m],
  );

  const groupColumns = useMemo(
    () => [
      { title: t("competitionAdmin.name"), dataIndex: "name", key: "name" },
      {
        title: t("competitionAdmin.qqGroup"),
        key: "qq",
        render: (_: unknown, r: AdminCompetitionGroup) =>
          asStringList(r.qq_groups).join("、") || "—",
      },
      {
        title: m("adminManagement.wechat"),
        key: "wx",
        render: (_: unknown, r: AdminCompetitionGroup) =>
          asStringList(r.wechat_groups).join("、") || "—",
      },
      {
        title: t("teamMatch.actions"),
        key: "op",
        render: (_: unknown, r: AdminCompetitionGroup) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => setGroupModal({ mode: "edit", group: r })}
            >
              {t("teamMatch.edit")}
            </Button>
            <Popconfirm title={m("adminManagement.deleteCompetitionGroup")} onConfirm={() => void deleteGroup(r)}>
              <Button type="link" size="small" danger>
                {t("teamMatch.delete")}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteGroup, m, t],
  );

  const columns: ColumnsType<AdminOrganizer> = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: m("adminManagement.teamName"), dataIndex: "Name", ellipsis: true },
    {
      title: t("competitionAdmin.status"),
      dataIndex: "Status",
      width: 120,
      render: (status: string) => <Tag>{statusLabel(status)}</Tag>,
      filteredValue: statusFilter ? [statusFilter] : null,
      filters: statusOptions.map((o) => ({ text: o.label, value: o.value })),
    },
    {
      title: m("adminManagement.leaderCubeId"),
      dataIndex: "LeaderID",
      width: 130,
      render: (_, r) =>
        r.LeaderID ? (
          PlayerLink(r.LeaderID, r.LeaderID, "var(--foreground)")
        ) : (
          <span style={{ color: "var(--faint-foreground)" }}>—</span>
        ),
    },
    { title: m("adminManagement.contactEmail"), dataIndex: "Email", ellipsis: true },
    {
      title: t("teamMatch.actions"),
      width: 220,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => openDetail(r)}>
            {t("competitionAdmin.details")}
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            {t("teamMatch.edit")}
          </Button>
          <Popconfirm
            title={m("adminManagement.deleteOrganizerHint")}
            onConfirm={async () => {
              try {
                await apiAdminDeleteOrganizer(r.id);
                void message.success(m("adminManagement.deleted"));
                void loadOrganizers();
              } catch {
                void message.error(m("adminManagement.deleteFailed"));
              }
            }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t("teamMatch.delete")}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const orgBaseFormItems = () => (
    <>
      <Form.Item name="name" label={m("adminManagement.teamName")} rules={[{ required: true, message: m("adminManagement.required") }]}>
        <Input placeholder={m("adminManagement.uniqueName")} />
      </Form.Item>
      <Form.Item name="status" label={t("competitionAdmin.status")} rules={[{ required: true, message: m("adminManagement.selectStatus") }]}>
        <Select options={statusOptions} placeholder={m("adminManagement.selectStatus")} />
      </Form.Item>
      <Form.Item name="introduction" label={m("adminManagement.introduction")}>
        <Input.TextArea rows={3} placeholder={m("adminManagement.markdownSupported")} />
      </Form.Item>
      <Form.Item name="email" label={m("adminManagement.contactEmail")}>
        <Input />
      </Form.Item>
      <Form.Item name="leader_cube_id" label={m("adminManagement.leader")}>
        <AdminUserSearchSelect allowClear placeholder={m("adminManagement.selectLeader")} />
      </Form.Item>
      <Form.Item name="leader_remark" label={m("adminManagement.leaderNotes")}>
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="admin_message" label={m("adminManagement.adminMessage")}>
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
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t("nav.admin.admins")} title={m("adminManagement.organizersTitle")} />

        <div style={{ marginBottom: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {m("adminManagement.newTeam")}
          </Button>
        </div>

        <Table<AdminOrganizer>
          scroll={{ x: "max-content" }}
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
          title={m("adminManagement.createOrganizer")}
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
            <Form.Item label={m("adminManagement.members")} colon={false}>
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
          title={m("adminManagement.editOrganizer")}
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
              <Form.Item label={m("adminManagement.members")} colon={false}>
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
          title={detailOrganizer ? m("adminManagement.organizerName", { name: detailOrganizer.Name }) : m("adminManagement.organizerDetails")}
          size={720}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setDetailOrgId(null);
          }}
          destroyOnHidden
        >
          {detailLoading && !detailOrganizer ? (
            <div>{t("algs.loading")}</div>
          ) : detailOrganizer ? (
            <Tabs
              items={[
                {
                  key: "info",
                  label: m("adminManagement.basicInfo"),
                  children: (
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="ID">{detailOrganizer.id}</Descriptions.Item>
                      <Descriptions.Item label={t("competitionAdmin.name")}>{detailOrganizer.Name}</Descriptions.Item>
                      <Descriptions.Item label={t("competitionAdmin.status")}>
                        <Tag>{statusLabel(detailOrganizer.Status)}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={m("adminManagement.leader")}>
                        {detailOrganizer.LeaderID || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label={t("competitionAdmin.email")}>{detailOrganizer.Email || "—"}</Descriptions.Item>
                      <Descriptions.Item label={m("adminManagement.introduction")}>
                        {detailOrganizer.Introduction || "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: "members",
                  label: m("adminManagement.members"),
                  children: (
                    <div>
                      <Space wrap style={{ marginBottom: 16 }} align="start">
                        <Form form={memberForm} layout="inline" style={{ flex: 1 }}>
                          <Form.Item
                            name="cube_id"
                            rules={[{ required: true, message: m("adminManagement.selectMember") }]}
                            style={{ marginBottom: 0, minWidth: 280 }}
                          >
                            <AdminUserSearchSelect placeholder={m("adminManagement.searchSelectMember")} />
                          </Form.Item>
                          <Form.Item
                            name="grant_auth"
                            initialValue={false}
                            style={{ marginBottom: 0, width: 180 }}
                          >
                            <Select
                              options={[
                                { label: m("adminManagement.grantOrganizer"), value: true },
                                { label: m("adminManagement.joinTeamOnly"), value: false },
                              ]}
                            />
                          </Form.Item>
                        </Form>
                        <Button type="primary" loading={submitLoading} onClick={() => void addMember()}>
                          {m("adminManagement.addMember")}
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
                                  role: m("adminManagement.leader"),
                                  canRemove: false,
                                },
                              ]
                            : []),
                          ...parseAssUsers(detailOrganizer.AssOrganizerUsers).map((cube) => ({
                            key: cube,
                            cube,
                            role: m("adminManagement.members"),
                            canRemove: true,
                          })),
                        ]}
                        columns={[
                          { title: "CubeID", dataIndex: "cube", key: "cube" },
                          { title: m("adminManagement.role"), dataIndex: "role", width: 100 },
                          {
                            title: t("teamMatch.actions"),
                            key: "op",
                            width: 100,
                            render: (_, row: { cube: string; canRemove: boolean }) =>
                              row.canRemove ? (
                                <Popconfirm
                                  title={m("adminManagement.removeMember")}
                                  onConfirm={() => void removeMember(row.cube)}
                                >
                                  <Button type="link" size="small" danger>
                                    {m("adminManagement.remove")}
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
                  label: m("adminManagement.groupsTab", { count: MAX_GROUPS_PER_ORG }),
                  children: (
                    <div>
                      <Button
                        type="primary"
                        style={{ marginBottom: 12 }}
                        disabled={detailGroups.length >= MAX_GROUPS_PER_ORG}
                        onClick={() => setGroupModal({ mode: "create" })}
                      >
                        {m("adminManagement.newGroup")}
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
          title={groupModal?.mode === "edit" ? m("adminManagement.editCompetitionGroup") : m("adminManagement.createCompetitionGroup")}
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
            <Form.Item name="name" label={m("adminManagement.groupName")} rules={[{ required: true, message: m("adminManagement.nameRequired") }]}>
              <Input />
            </Form.Item>
            <Form.Item name="qq_groups" label={m("adminManagement.qqGroupNumbers")}>
              <Select mode="tags" placeholder={m("adminManagement.enterTags")} tokenSeparators={[","]} />
            </Form.Item>
            <Form.Item name="qq_group_uid" label={m("adminManagement.qqGroupUid")}>
              <Select mode="tags" placeholder={m("adminManagement.enterTags")} tokenSeparators={[","]} />
            </Form.Item>
            <Form.Item name="wechat_groups" label={m("adminManagement.wechatGroups")}>
              <Select mode="tags" placeholder={m("adminManagement.enterTags")} tokenSeparators={[","]} />
            </Form.Item>
            </Form>
          ) : null}
        </Modal>
      </VStack>
    </AdminGuard>
  );
}
