"use client";
import { useI18n } from "@/contexts/I18nProvider";
import { useAdminManagement } from "@/views/admin/useAdminManagement";

import "antd/dist/reset.css";

import { VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";
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
  const { t, tf } = useI18n();
  const m = useAdminManagement();
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
            label: o.Name,
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
      void message.success(m("adminManagement.deleted"));
      void loadGroups();
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: ColumnsType<AdminCompetitionGroup> = [
    { title: "ID", dataIndex: "id", width: 72 },
    { title: t("competitionAdmin.name"), dataIndex: "name", ellipsis: true },
    {
      title: t("competitionAdmin.qqGroup"),
      ellipsis: true,
      render: (_, r) => asStringList(r.qq_groups).join("、") || "—",
    },
    {
      title: "QQ UID",
      ellipsis: true,
      render: (_, r) => asStringList(r.qq_group_uid).join("、") || "—",
    },
    {
      title: m("adminManagement.wechatGroups"),
      ellipsis: true,
      render: (_, r) => asStringList(r.wechat_groups).join("、") || "—",
    },
    {
      title: t("teamMatch.actions"),
      width: 160,
      render: (_, r) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setGroupModal({ mode: "edit", group: r })}
          >
            {t("teamMatch.edit")}
          </Button>
          <Popconfirm title={m("adminManagement.deleteCompetitionGroup")} onConfirm={() => void deleteGroup(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t("teamMatch.delete")}
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
          void message.error(m("adminManagement.groupsLimit", { count: MAX_GROUPS_PER_ORG }));
          return;
        }
        await apiAdminCreateGroup(selectedOrgId, body);
        void message.success(m("adminManagement.created"));
      } else if (groupModal?.group) {
        await apiAdminUpdateGroup(groupModal.group.id, body);
        void message.success(m("adminManagement.updated"));
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
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t("nav.admin.admins")} title={m("adminManagement.groupsTitle")} />
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <Space wrap className="admin-toolbar" style={{ width: "100%" }}>
            <span>{m("adminManagement.chooseOrganizer")}</span>
            <Select
              showSearch
              optionFilterProp="label"
              loading={orgLoading}
              placeholder={m("adminManagement.select")}
              style={{ width: "min(320px, 65vw)" }}
              options={orgOptions.map((option) => ({
                ...option,
                label: tf("finishing.organizerOption", { name: option.label, id: option.value }),
              }))}
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
              {m("adminManagement.chooseOrganizerHint")}
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
                  {m("adminManagement.newGroup")}
                </Button>
              </div>
              <Table<AdminCompetitionGroup>
                scroll={{ x: "max-content" }}
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
