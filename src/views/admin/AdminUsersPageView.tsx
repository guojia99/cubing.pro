"use client";

import "antd/dist/reset.css";

import { Heading, VStack } from "@chakra-ui/react";
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

const AUTH_MANAGE_BITS: { label: string; value: Auth }[] = [
  { label: "选手", value: Auth.AuthPlayer },
  { label: "主办", value: Auth.AuthOrganizers },
  { label: "代表", value: Auth.AuthDelegates },
  { label: "管理员", value: Auth.AuthAdmin },
  { label: "超级管理员", value: Auth.AuthSuperAdmin },
];

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

function showApiError(err: unknown) {
  const ax = err as { response?: { data?: unknown } };
  const text = getApiErrorDisplayMessage(ax.response?.data);
  if (text) void message.error(text);
  else if (err instanceof Error) void message.error(err.message);
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
        彻底删除
      </Button>
    );
  }

  const editMenu: MenuProps["items"] = [
    {
      key: "name",
      icon: <UserOutlined />,
      label: "修改名称",
      onClick: () => onEditName(player),
    },
    {
      key: "cube",
      icon: <IdcardOutlined />,
      label: "修改 CubeID",
      onClick: () => onEditCubeId(player),
    },
    {
      key: "wca",
      icon: <IdcardOutlined />,
      label: "修改 WCA ID",
      onClick: () => onEditWca(player),
    },
    {
      key: "qq",
      icon: <QqOutlined />,
      label: "修改 QQ",
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
          编辑资料
        </Button>
      </Dropdown>
      <Button
        type="link"
        size="small"
        icon={<SafetyCertificateOutlined />}
        className="admin-user-action-btn"
        onClick={() => onAuth(player)}
      >
        权限
      </Button>
      <Button
        type="link"
        size="small"
        icon={<MergeCellsOutlined />}
        className="admin-user-action-btn"
        onClick={() => onMerge(player)}
      >
        合并
      </Button>
      <Button
        type="link"
        size="small"
        danger
        icon={<DeleteOutlined />}
        className="admin-user-action-btn"
        onClick={() => onSoftDelete(player)}
      >
        软删除
      </Button>
    </Space>
  );
}

export function AdminUsersPageView() {
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
      void message.success("用户创建成功");
      createForm.resetFields();
      setCreateUserModalOpen(false);
      void loadPlayers();
    } catch (err) {
      if (err instanceof Error) {
        void message.error(err.message);
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
      void message.success("用户更名成功");
      updateNameForm.resetFields();
      setUpdatePlayerNameModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err);
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
      void message.success("CubeID 修改成功");
      updateCubeIdForm.resetFields();
      setUpdatePlayerCubeIdModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err);
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
      void message.success("用户更改WCAID成功");
      updateWCAForm.resetFields();
      setUpdatePlayerWcaModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err);
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
      void message.success("QQ 信息已更新");
      updateQqForm.resetFields();
      setUpdatePlayerQqModal(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSoftDelete = (player: PlayersAPI.Player) => {
    Modal.confirm({
      title: "软删除用户",
      content: `确认软删除用户 ${player.Name}（ID: ${player.id}）？软删除后可彻底删除。`,
      okText: "软删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          await apiAdminSoftDeleteUser({ user_id: player.id, cube_id: player.CubeID });
          void message.success("用户已软删除");
          void loadPlayers();
        } catch (err: unknown) {
          showApiError(err);
          throw err;
        }
      },
    });
  };

  const handlePurge = (player: PlayersAPI.Player) => {
    Modal.confirm({
      title: "彻底删除用户",
      content: `确认从数据库永久删除用户 ${player.Name}（ID: ${player.id}）？此操作不可恢复。`,
      okText: "彻底删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          await apiAdminPurgeUser({ user_id: player.id, cube_id: player.CubeID });
          void message.success("用户已彻底删除");
          void loadPlayers();
        } catch (err: unknown) {
          showApiError(err);
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
      void message.success("权限已更新");
      setAuthModalOpen(false);
      void loadPlayers();
    } catch (err: unknown) {
      showApiError(err);
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
      Modal.confirm({
        title: "撤销主办权限",
        content:
          "若该用户仍在任一主办团队中担任组长或成员，服务端将拒绝。请先在主办管理中移出成员或变更组长后再撤销。",
        okText: "仍要提交",
        cancelText: "取消",
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
      void message.success("用户合并成功");
      mergePlayerForm.resetFields();
      setMergePlayerWcaModal(false);
      void loadPlayers();
    } catch (err) {
      if (err instanceof Error) {
        void message.error(err.message);
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
      title: "状态",
      key: "status",
      width: 80,
      render: (_v, player) =>
        isDeletedUser(player) ? <Tag color="red">已删除</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      title: "CubeID",
      dataIndex: "CubeID",
      key: "CubeID",
      width: 120,
      render: (value: string, player) => PlayerLink(player.CubeID, value, "var(--foreground)"),
    },
    {
      title: "名称",
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
              style={{ color: "blueviolet", flexShrink: 0 }}
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard.writeText(value).then(() => {
                  void message.success("复制成功");
                });
              }}
            />
          </div>
        );
      },
    },
    {
      title: "认领密码",
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
              style={{ color: "blueviolet" }}
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard.writeText(value).then(() => {
                  void message.success("复制成功");
                });
              }}
            />
          </div>
        );
      },
    },
    {
      title: "权限",
      dataIndex: "Auth",
      key: "Auth",
      width: 100,
      render: (a: number) => authTags(a),
    },
    {
      title: "操作",
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
      <VStack align="stretch" gap="6">
        <Heading size="xl">用户管理</Heading>

        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", flex: 1 }}>
            <Input.Search
              placeholder="搜索名称、CubeID 或用户 ID"
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
              包含已删除
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Switch
                checked={tableParams.onlyDeleted ?? false}
                onChange={(checked) =>
                  setTableParams((prev) => ({ ...prev, page: 1, onlyDeleted: checked }))
                }
              />
              仅已删除
            </label>
          </div>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="small"
            onClick={() => setCreateUserModalOpen(true)}
          >
            创建用户
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
          title="创建用户"
          open={createUserModalOpen}
          onCancel={() => setCreateUserModalOpen(false)}
          onOk={() => void handleCreateUser()}
          confirmLoading={confirmLoading}
          okText="提交"
          cancelText="取消"
        >
          <Form form={createForm} layout="vertical">
            <Form.Item name="name" label="用户名" rules={[{ required: true, message: "请输入用户名" }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item name="qq" label="QQ">
              <Input placeholder="请输入 QQ 号" />
            </Form.Item>
            <Form.Item name="actualName" label="真实姓名">
              <Input placeholder="请输入真实姓名" />
            </Form.Item>
            <Form.Item name="wca_id" label="WCA ID">
              <Input placeholder="请输入 WCA ID" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="修改用户名称"
          open={updatePlayerNameModal}
          onOk={() => void handleUpdateName()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerNameModal(false)}
          destroyOnHidden
        >
          <Form form={updateNameForm} layout="vertical" preserve={false}>
            <Form.Item
              label="用户名称"
              name="name"
              initialValue={curUpdatePlayer?.Name}
              rules={[{ required: true, message: "请输入新名称" }]}
            >
              <Input placeholder="请输入新名称" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`修改用户 ${curUpdatePlayer?.Name} 的 CubeID`}
          open={updatePlayerCubeIdModal}
          onOk={() => void handleUpdateCubeID()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerCubeIdModal(false)}
          destroyOnHidden
        >
          <Form form={updateCubeIdForm} layout="vertical" preserve={false}>
            <Form.Item label="当前 CubeID">
              <Input value={curUpdatePlayer?.CubeID} disabled />
            </Form.Item>
            <Form.Item
              label="新 CubeID"
              name="new_cube_id"
              rules={[
                { required: true, message: "请输入新 CubeID" },
                { len: 10, message: "CubeID 长度须为 10" },
              ]}
            >
              <Input placeholder="请输入 10 位 CubeID" maxLength={10} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`修改用户 ${curUpdatePlayer?.Name} 的 QQ`}
          open={updatePlayerQqModal}
          onOk={() => void handleUpdateQQ()}
          confirmLoading={confirmLoading}
          onCancel={() => setUpdatePlayerQqModal(false)}
          destroyOnHidden
        >
          <Form form={updateQqForm} layout="vertical" preserve={false}>
            <Form.Item label="QQ" name="qq">
              <Input placeholder="QQ 号" />
            </Form.Item>
            <Form.Item label="QQUniID" name="qq_uni_id">
              <Input placeholder="QQ 唯一认证 ID" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`修改用户${curUpdatePlayer?.Name} WCAID`}
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
                { required: true, message: "请输入wcaID" },
                { len: 10, message: "长度必须为10" },
              ]}
            >
              <Input placeholder="请输入WCAID" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`修改权限 — ${curUpdatePlayer?.Name} (${curUpdatePlayer?.CubeID})`}
          open={authModalOpen}
          onCancel={() => setAuthModalOpen(false)}
          onOk={() => void handleSaveAuth()}
          confirmLoading={confirmLoading}
          width={520}
          destroyOnHidden
        >
          <p style={{ marginBottom: 12, color: "var(--muted-foreground)" }}>
            按位更新权限；撤销主办前请确认用户已从主办团队中移出。
          </p>
          <Checkbox.Group
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
            value={authChecked}
            onChange={(list) => setAuthChecked(list.map((x) => Number(x)))}
          >
            {AUTH_MANAGE_BITS.map((b) => (
              <Checkbox key={b.value} value={b.value}>
                {b.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Modal>

        <Modal
          title={`合并用户 ${curUpdatePlayer?.Name}`}
          open={mergePlayerWcaModal}
          onOk={() => void handleMergePlayer()}
          confirmLoading={confirmLoading}
          onCancel={() => setMergePlayerWcaModal(false)}
          destroyOnHidden
        >
          <Form form={mergePlayerForm} layout="vertical" preserve={false}>
            <Form.Item
              label="合并到账号（被合并方）"
              name="other_cube_id"
              rules={[
                { required: true, message: "请搜索并选择用户" },
                { len: 10, message: "CubeID 长度须为 10" },
              ]}
            >
              <AdminUserSearchSelect placeholder="输入姓名或 CubeID 搜索被合并用户" />
            </Form.Item>
          </Form>
        </Modal>
      </VStack>
    </AdminGuard>
  );
}
