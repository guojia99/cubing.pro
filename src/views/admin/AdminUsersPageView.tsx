"use client";
import { useI18n } from "@/contexts/I18nProvider";
import { useAdminManagement } from "@/views/admin/useAdminManagement";

import "antd/dist/reset.css";

import { VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  IdcardOutlined,
  MergeCellsOutlined,
  QqOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { MenuProps } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminUserSearchSelect } from "@/components/admin/AdminUserSearchSelect";
import { authTags } from "@/components/admin/authTags";
import { PlayerLink } from "@/components/Link/GcLinks";
import { WCALink } from "@/components/Link/WcaLinks";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { Auth, hasAuth } from "@/lib/auth";
import {
  apiAdminCreatePlayer,
  apiAdminPlayers,
  apiAdminPurgeUser,
  apiAdminSoftDeleteUser,
  apiAdminUpdatePlayerCubeID,
  apiAdminUpdatePlayerName,
  apiAdminUpdatePlayerQQ,
  apiAdminUpdatePlayerWCAID,
  apiMergePlayers,
  apiUpdatePlayerAuth,
} from "@/services/cubing-pro/auth/admin";
import type { PlayersAPI } from "@/services/cubing-pro/players/typings";
import { getApiErrorDisplayMessage } from "@/services/cubing-pro/request";

import "./admin_users_table.css";

const AUTH_MANAGE_BITS = [
  { label: "competitionAdmin.player", value: Auth.AuthPlayer },
  { label: "competitionAdmin.organizer", value: Auth.AuthOrganizers },
  { label: "competitionAdmin.delegate", value: Auth.AuthDelegates },
  { label: "competitionAdmin.admin", value: Auth.AuthAdmin },
  { label: "competitionAdmin.superAdmin", value: Auth.AuthSuperAdmin },
] as const;

function authToChecked(auth: number): number[] {
  return AUTH_MANAGE_BITS.filter((b) => hasAuth(auth, b.value)).map((b) => b.value);
}

function isDeletedUser(player: PlayersAPI.Player): boolean {
  const d = player.deletedAt;
  if (!d) return false;
  if (typeof d === "string") {
    return d.length > 0 && !d.startsWith("0001-01-01");
  }
  return true;
}

function showApiError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "errorFields" in err) return;
  const ax = err as { response?: { data?: unknown } };
  const text = getApiErrorDisplayMessage(ax.response?.data);
  void message.error(text || fallback);
}

type UserRowActionsProps = {
  player: PlayersAPI.Player;
  onEditName: (player: PlayersAPI.Player) => void;
  onEditCubeId: (player: PlayersAPI.Player) => void;
  onEditWca: (player: PlayersAPI.Player) => void;
  onEditQq: (player: PlayersAPI.Player) => void;
  onAuth: (player: PlayersAPI.Player) => void;
  onMerge: (player: PlayersAPI.Player) => void;
  onSoftDelete: (player: PlayersAPI.Player) => void;
  onPurge: (player: PlayersAPI.Player) => void;
};

function UserRowActions({
  player,
  onEditName,
  onEditCubeId,
  onEditWca,
  onEditQq,
  onAuth,
  onMerge,
  onSoftDelete,
  onPurge,
}: UserRowActionsProps) {
  const { t } = useI18n();
  const m = useAdminManagement();
  if (isDeletedUser(player)) {
    return (
      <Button
        type="link"
        size="small"
        danger
        icon={<DeleteOutlined />}
        className="admin-user-action-btn"
        onClick={() => onPurge(player)}
      >
        {m("adminManagement.purge")}
      </Button>
    );
  }

  const editMenu: MenuProps["items"] = [
    {
      key: "name",
      icon: <UserOutlined />,
      label: m("adminManagement.editName"),
      onClick: () => onEditName(player),
    },
    {
      key: "cube",
      icon: <IdcardOutlined />,
      label: m("adminManagement.editCubeId"),
      onClick: () => onEditCubeId(player),
    },
    {
      key: "wca",
      icon: <IdcardOutlined />,
      label: m("adminManagement.editWcaId"),
      onClick: () => onEditWca(player),
    },
    {
      key: "qq",
      icon: <QqOutlined />,
      label: m("adminManagement.editQq"),
      onClick: () => onEditQq(player),
    },
  ];

  return (
    <Space
      size={0}
      separator={<Divider orientation="vertical" className="admin-user-action-divider" />}
      wrap
      className="admin-user-row-actions"
    >
      <Dropdown menu={{ items: editMenu }} trigger={["click"]}>
        <Button type="link" size="small" icon={<EditOutlined />} className="admin-user-action-btn">
          {m("adminManagement.editProfile")}
        </Button>
      </Dropdown>
      <Button
        type="link"
        size="small"
        icon={<SafetyCertificateOutlined />}
        className="admin-user-action-btn"
        onClick={() => onAuth(player)}
      >
        {t("profile.field.auth")}
      </Button>
      <Button
        type="link"
        size="small"
        icon={<MergeCellsOutlined />}
        className="admin-user-action-btn"
        onClick={() => onMerge(player)}
      >
        {m("adminManagement.merge")}
      </Button>
      <Button
        type="link"
        size="small"
        danger
        icon={<DeleteOutlined />}
        className="admin-user-action-btn"
        onClick={() => onSoftDelete(player)}
      >
        {m("adminManagement.softDelete")}
      </Button>
    </Space>
  );
}

export function AdminUsersPageView() {
  const { t } = useI18n();
  const m = useAdminManagement();
  const [modal, modalContext] = Modal.useModal();
  const [players, setPlayers] = useState<PlayersAPI.Player[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState<PlayersAPI.PlayersReq>({
    size: 20,
    page: 1,
    name: "",
    includeDeleted: true,
    onlyDeleted: false,
  });
  const [searchName, setSearchName] = useState("");

  const [updateQqForm] = Form.useForm();
  const [updatePlayerQqModal, setUpdatePlayerQqModal] = useState(false);

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [createForm] = Form.useForm();

  const [updateNameForm] = Form.useForm();
  const [curUpdatePlayer, setCurUpdatePlayer] = useState<PlayersAPI.Player>();
  const [updatePlayerNameModal, setUpdatePlayerNameModal] = useState(false);

  const [updateWCAForm] = Form.useForm();
  const [updatePlayerWcaModal, setUpdatePlayerWcaModal] = useState(false);

  const [updateCubeIdForm] = Form.useForm();
  const [updatePlayerCubeIdModal, setUpdatePlayerCubeIdModal] = useState(false);

  const [mergePlayerForm] = Form.useForm();
  const [mergePlayerWcaModal, setMergePlayerWcaModal] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState<number[]>([]);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const value = await apiAdminPlayers(tableParams);
      if (value?.data?.items) {
        setPlayers(value.data.items);
        setTotal(value.data.total);
      } else {
        setPlayers([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [tableParams]);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const handleSearch = () => {
    setTableParams((prev) => ({ ...prev, page: 1, name: searchName }));
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      size: pagination.pageSize ?? 20,
    }));
  };

  const handleCreateUser = async () => {
    try {
      const values = await createForm.validateFields();
      setConfirmLoading(true);
      await apiAdminCreatePlayer(values);
      void message.success(m("adminManagement.userCreated"));
      createForm.resetFields();
      setCreateUserModalOpen(false);
      void loadPlayers();
    } catch (err) {
      if (err instanceof Error) {
        showApiError(err, t("shared.error.request"));
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleUpdateName = async () => {
    try {
      const values = await updateNameForm.validateFields();
      setConfirmLoading(true);
      await apiAdminUpdatePlayerName({
        cube_id: curUpdatePlayer?.CubeID || "",
        new_name: values.name,
        wca_id: "",
      });
      void message.success(m("adminManagement.userRenamed"));
      updateNameForm.resetFields();
      setUpdatePlayerNameModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err, t("shared.error.request"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleUpdateCubeID = async () => {
    try {
      const values = await updateCubeIdForm.validateFields();
      setConfirmLoading(true);
      await apiAdminUpdatePlayerCubeID({
        cube_id: curUpdatePlayer?.CubeID || "",
        new_cube_id: values.new_cube_id,
      });
      void message.success(m("adminManagement.cubeIdUpdated"));
      updateCubeIdForm.resetFields();
      setUpdatePlayerCubeIdModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err, t("shared.error.request"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleUpdateWCA = async () => {
    try {
      const values = await updateWCAForm.validateFields();
      setConfirmLoading(true);
      await apiAdminUpdatePlayerWCAID({
        cube_id: curUpdatePlayer?.CubeID || "",
        new_name: "",
        wca_id: values.wca_id,
      });
      void message.success(m("adminManagement.wcaIdUpdated"));
      updateWCAForm.resetFields();
      setUpdatePlayerWcaModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err, t("shared.error.request"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleUpdateQQ = async () => {
    try {
      const values = await updateQqForm.validateFields();
      setConfirmLoading(true);
      await apiAdminUpdatePlayerQQ({
        user_id: curUpdatePlayer?.id,
        cube_id: curUpdatePlayer?.CubeID || "",
        qq: values.qq ?? "",
        qq_uni_id: values.qq_uni_id ?? "",
      });
      void message.success(m("adminManagement.qqUpdated"));
      updateQqForm.resetFields();
      setUpdatePlayerQqModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err, t("shared.error.request"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSoftDelete = (player: PlayersAPI.Player) => {
    modal.confirm({
      title: m("adminManagement.softDeleteUser"),
      content: m("adminManagement.softDeleteConfirm", { name: player.Name, id: player.id }),
      okText: m("adminManagement.softDelete"),
      okButtonProps: { danger: true },
      cancelText: t("teamMatch.cancel"),
      onOk: async () => {
        try {
          await apiAdminSoftDeleteUser({ user_id: player.id, cube_id: player.CubeID });
          void message.success(m("adminManagement.userSoftDeleted"));
          void loadPlayers();
        } catch (err: unknown) {
          showApiError(err, t("shared.error.request"));
          throw err;
        }
      },
    });
  };

  const handlePurge = (player: PlayersAPI.Player) => {
    modal.confirm({
      title: m("adminManagement.purgeUser"),
      content: m("adminManagement.purgeConfirm", { name: player.Name, id: player.id }),
      okText: m("adminManagement.purge"),
      okButtonProps: { danger: true },
      cancelText: t("teamMatch.cancel"),
      onOk: async () => {
        try {
          await apiAdminPurgeUser({ user_id: player.id, cube_id: player.CubeID });
          void message.success(m("adminManagement.userPurged"));
          void loadPlayers();
        } catch (err: unknown) {
          showApiError(err, t("shared.error.request"));
          throw err;
        }
      },
    });
  };

  const openEditName = (player: PlayersAPI.Player) => {
    setCurUpdatePlayer(player);
    setUpdatePlayerNameModal(true);
  };

  const openEditCubeId = (player: PlayersAPI.Player) => {
    setCurUpdatePlayer(player);
    updateCubeIdForm.setFieldsValue({ new_cube_id: player.CubeID });
    setUpdatePlayerCubeIdModal(true);
  };

  const openEditWca = (player: PlayersAPI.Player) => {
    setCurUpdatePlayer(player);
    setUpdatePlayerWcaModal(true);
  };

  const openEditQq = (player: PlayersAPI.Player) => {
    setCurUpdatePlayer(player);
    updateQqForm.setFieldsValue({
      qq: player.QQ ?? "",
      qq_uni_id: player.QQUniID ?? "",
    });
    setUpdatePlayerQqModal(true);
  };

  const openAuth = (player: PlayersAPI.Player) => {
    setCurUpdatePlayer(player);
    setAuthChecked(authToChecked(player.Auth));
    setAuthModalOpen(true);
  };

  const openMerge = (player: PlayersAPI.Player) => {
    setCurUpdatePlayer(player);
    setMergePlayerWcaModal(true);
  };

  const applyAuthDiff = async () => {
    if (!curUpdatePlayer) return;
    const oldA = curUpdatePlayer.Auth;
    const newA = authChecked.reduce((acc, v) => acc | v, 0);
    setConfirmLoading(true);
    try {
      for (const b of AUTH_MANAGE_BITS.map((x) => x.value)) {
        const was = hasAuth(oldA, b);
        const now = hasAuth(newA, b);
        if (was !== now) {
          await apiUpdatePlayerAuth({
            cube_id: curUpdatePlayer.CubeID,
            set: now,
            auth: b,
          });
        }
      }
      void message.success(m("adminManagement.permissionsUpdated"));
      setAuthModalOpen(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err, t("shared.error.request"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSaveAuth = async () => {
    if (!curUpdatePlayer) return;
    const oldA = curUpdatePlayer.Auth;
    const newA = authChecked.reduce((acc, v) => acc | v, 0);
    const revokingOrg =
      hasAuth(oldA, Auth.AuthOrganizers) && !hasAuth(newA, Auth.AuthOrganizers);
    if (revokingOrg) {
      modal.confirm({
        title: m("adminManagement.revokeOrganizer"),
        content:
          m("adminManagement.revokeOrganizerHint"),
        okText: m("adminManagement.submitAnyway"),
        cancelText: t("teamMatch.cancel"),
        onOk: () => applyAuthDiff(),
      });
      return;
    }
    await applyAuthDiff();
  };

  const handleMergePlayer = async () => {
    try {
      const values = await mergePlayerForm.validateFields();
      setConfirmLoading(true);
      await apiMergePlayers({
        base_user_cube_id: curUpdatePlayer?.CubeID || "",
        merged_user_cube_id: values.other_cube_id,
      });
      void message.success(m("adminManagement.userMerged"));
      mergePlayerForm.resetFields();
      setMergePlayerWcaModal(false);
      void loadPlayers();
    } catch (err) {
      if (err instanceof Error) {
        showApiError(err, t("shared.error.request"));
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const truncateText = (text: string | undefined | null, frontLength: number, endLength: number) => {
    if (!text) return "—";
    if (text.length <= frontLength + endLength) return text;
    return `${text.slice(0, frontLength)}...${text.slice(-endLength)}`;
  };

  const columns: ColumnsType<PlayersAPI.Player> = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: t("competitionAdmin.status"),
      key: "status",
      width: 80,
      render: (_v, player) =>
        isDeletedUser(player) ? <Tag color="red">{m("adminManagement.deleted")}</Tag> : <Tag color="green">{m("adminManagement.activeUser")}</Tag>,
    },
    {
      title: "CubeID",
      dataIndex: "CubeID",
      key: "CubeID",
      width: 120,
      render: (value: string, player) => PlayerLink(player.CubeID, value, "var(--foreground)"),
    },
    {
      title: t("competitionAdmin.name"),
      dataIndex: "Name",
      key: "Name",
      width: 150,
      render: (_value: string, player) =>
        PlayerLink(player.CubeID, player.Name, "var(--accent)"),
    },
    {
      title: "WcaID",
      dataIndex: "WcaID",
      key: "WcaID",
      width: 120,
      render: (value: string) => WCALink(value),
    },
    {
      title: "QQ",
      dataIndex: "QQ",
      key: "QQ",
      width: 110,
      render: (value: string | undefined) => value || "—",
    },
    {
      title: "QQUniID",
      dataIndex: "QQUniID",
      key: "QQUniID",
      width: 220,
      render: (value: string | undefined) => {
        if (!value) return "—";
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{ marginRight: 8, wordBreak: "break-all", whiteSpace: "normal", flex: 1, minWidth: 0 }}
            >
              {value}
            </span>
            <Button
              size="small"
              aria-label={m("adminManagement.copyQqId")}
              style={{ color: "var(--accent)", flexShrink: 0 }}
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard.writeText(value).then(() => {
                  void message.success(t("shared.copy.success"));
                });
              }}
            />
          </div>
        );
      },
    },
    {
      title: m("adminManagement.claimPassword"),
      dataIndex: "InitPassword",
      key: "InitPassword",
      render: (value: string | undefined) => {
        if (!value) return "—";
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={value}>
              <span style={{ marginRight: 8 }}>{truncateText(value, 6, 4)}</span>
            </Tooltip>
            <Button
              size="small"
              aria-label={m("adminManagement.copyClaimPassword")}
              style={{ color: "var(--accent)" }}
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard.writeText(value).then(() => {
                  void message.success(t("shared.copy.success"));
                });
              }}
            />
          </div>
        );
      },
    },
    {
      title: t("profile.field.auth"),
      dataIndex: "Auth",
      key: "Auth",
      width: 100,
      render: (a: number) => authTags(a),
    },
    {
      title: t("teamMatch.actions"),
      key: "option",
      width: 280,
      fixed: "right",
      className: "admin-users-action-col",
      render: (_value, player) => (
        <UserRowActions
          player={player}
          onEditName={openEditName}
          onEditCubeId={openEditCubeId}
          onEditWca={openEditWca}
          onEditQq={openEditQq}
          onAuth={openAuth}
          onMerge={openMerge}
          onSoftDelete={handleSoftDelete}
          onPurge={handlePurge}
        />
      ),
    },
  ];

  return (
    <AdminGuard>
      {modalContext}
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t("nav.admin.admins")} title={m("adminManagement.usersTitle")} />

        <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", flex: 1 }}>
            <Input.Search
              placeholder={m("adminManagement.searchUsers")}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onSearch={handleSearch}
              allowClear
              enterButton
              style={{ maxWidth: 360 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Switch
                checked={tableParams.includeDeleted ?? true}
                onChange={(checked) =>
                  setTableParams((prev) => ({ ...prev, page: 1, includeDeleted: checked }))
                }
              />
              {m("adminManagement.includeDeleted")}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Switch
                checked={tableParams.onlyDeleted ?? false}
                onChange={(checked) =>
                  setTableParams((prev) => ({ ...prev, page: 1, onlyDeleted: checked }))
                }
              />
              {m("adminManagement.onlyDeleted")}
            </label>
          </div>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="small"
            onClick={() => setCreateUserModalOpen(true)}
          >
            {m("adminManagement.createUser")}
          </Button>
        </div>

        <Table<PlayersAPI.Player>
          className="admin-users-table"
          columns={columns}
          dataSource={players}
          rowKey="id"
          loading={loading}
          rowClassName={rowClassNameWithStyleLines}
          scroll={{ x: "max-content" }}
          size="small"
          pagination={{
            current: tableParams.page,
            pageSize: tableParams.size,
            total,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
          sticky
        />

        <Modal
          title={m("adminManagement.createUser")}
          open={createUserModalOpen}
          onCancel={() => setCreateUserModalOpen(false)}
          onOk={() => void handleCreateUser()}
          confirmLoading={confirmLoading}
          okText={t("competitionAdmin.submit")}
          cancelText={t("teamMatch.cancel")}
        >
          <Form form={createForm} layout="vertical">
            <Form.Item name="name" label={m("adminManagement.username")} rules={[{ required: true, message: m("adminManagement.usernameRequired") }]}>
              <Input placeholder={m("adminManagement.usernameRequired")} />
            </Form.Item>
            <Form.Item name="qq" label="QQ">
              <Input placeholder={m("adminManagement.enterQq")} />
            </Form.Item>
            <Form.Item name="actualName" label={m("adminManagement.realName")}>
              <Input placeholder={m("adminManagement.enterRealName")} />
            </Form.Item>
            <Form.Item name="wca_id" label="WCA ID">
              <Input placeholder={m("adminManagement.enterWcaId")} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={m("adminManagement.editUserName")}
          open={updatePlayerNameModal}
          onOk={() => void handleUpdateName()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerNameModal(false)}
          destroyOnHidden
        >
          <Form form={updateNameForm} layout="vertical" preserve={false}>
            <Form.Item
              label={m("adminManagement.userName")}
              name="name"
              initialValue={curUpdatePlayer?.Name}
              rules={[{ required: true, message: m("adminManagement.newName") }]}
            >
              <Input placeholder={m("adminManagement.newName")} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={m("adminManagement.userCubeIdTitle", { name: curUpdatePlayer?.Name ?? "" })}
          open={updatePlayerCubeIdModal}
          onOk={() => void handleUpdateCubeID()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerCubeIdModal(false)}
          destroyOnHidden
        >
          <Form form={updateCubeIdForm} layout="vertical" preserve={false}>
            <Form.Item label={m("adminManagement.currentCubeId")}>
              <Input value={curUpdatePlayer?.CubeID} disabled />
            </Form.Item>
            <Form.Item
              label={m("adminManagement.newCubeId")}
              name="new_cube_id"
              rules={[
                { required: true, message: m("adminManagement.enterNewCubeId") },
                { len: 10, message: m("adminManagement.cubeIdLength") },
              ]}
            >
              <Input placeholder={m("adminManagement.enterCubeId")} maxLength={10} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={m("adminManagement.userQqTitle", { name: curUpdatePlayer?.Name ?? "" })}
          open={updatePlayerQqModal}
          onOk={() => void handleUpdateQQ()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerQqModal(false)}
          destroyOnHidden
        >
          <Form form={updateQqForm} layout="vertical" preserve={false}>
            <Form.Item label="QQ" name="qq">
              <Input placeholder={m("adminManagement.qqNumber")} />
            </Form.Item>
            <Form.Item label="QQUniID" name="qq_uni_id">
              <Input placeholder={m("adminManagement.qqUniqueId")} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={m("adminManagement.userWcaTitle", { name: curUpdatePlayer?.Name ?? "" })}
          open={updatePlayerWcaModal}
          onOk={() => void handleUpdateWCA()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerWcaModal(false)}
          destroyOnHidden
        >
          <Form form={updateWCAForm} layout="vertical" preserve={false}>
            <Form.Item
              label="WCAID"
              name="wca_id"
              initialValue={curUpdatePlayer?.WcaID}
              rules={[
                { required: true, message: m("adminManagement.enterWcaId") },
                { len: 10, message: t("shared.error.wcaId") },
              ]}
            >
              <Input placeholder={m("adminManagement.enterWcaId")} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={m("adminManagement.permissionsTitle", { name: curUpdatePlayer?.Name ?? "", cubeId: curUpdatePlayer?.CubeID ?? "" })}
          open={authModalOpen}
          onCancel={() => setAuthModalOpen(false)}
          onOk={() => void handleSaveAuth()}
          confirmLoading={confirmLoading}
          width={520}
          destroyOnHidden
        >
          <p style={{ marginBottom: 12, color: "var(--muted-foreground)" }}>
            {m("adminManagement.permissionsHint")}
          </p>
          <Checkbox.Group
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
            value={authChecked}
            onChange={(list) => setAuthChecked(list.map((x) => Number(x)))}
          >
            {AUTH_MANAGE_BITS.map((b) => (
              <Checkbox key={b.value} value={b.value}>
                {t(b.label)}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Modal>

        <Modal
          title={m("adminManagement.mergeUserTitle", { name: curUpdatePlayer?.Name ?? "" })}
          open={mergePlayerWcaModal}
          onOk={() => void handleMergePlayer()}
          confirmLoading={confirmLoading}
          onCancel={() => setMergePlayerWcaModal(false)}
          destroyOnHidden
        >
          <Form form={mergePlayerForm} layout="vertical" preserve={false}>
            <Form.Item
              label={m("adminManagement.mergedAccount")}
              name="other_cube_id"
              rules={[
                { required: true, message: m("adminManagement.chooseUser") },
                { len: 10, message: m("adminManagement.cubeIdLength") },
              ]}
            >
              <AdminUserSearchSelect placeholder={m("adminManagement.searchMergeUser")} />
            </Form.Item>
          </Form>
        </Modal>
      </VStack>
    </AdminGuard>
  );
}
