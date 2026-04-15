import { AdminUserSearchSelect } from '@/components/Admin/AdminUserSearchSelect';
import { PlayerLink, WCALink } from '@/components/Link/Links';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { Auth, authTags, hasAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import {
  apiAdminCreatePlayer,
  apiAdminPlayers,
  apiAdminUpdatePlayerName,
  apiAdminUpdatePlayerWCAID,
  apiMergePlayers,
  apiUpdatePlayerAuth,
} from '@/services/cubing-pro/auth/admin';
import { getApiErrorDisplayMessage } from '@/services/cubing-pro/request';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { CopyOutlined, UserAddOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-table';
import { ProColumns } from '@ant-design/pro-table/es/typing';
import { Button, Checkbox, Form, Input, Modal, Tooltip, message } from 'antd';
import React, { useRef, useState } from 'react';

const AUTH_MANAGE_BITS: { label: string; value: Auth }[] = [
  { label: '选手', value: Auth.AuthPlayer },
  { label: '主办', value: Auth.AuthOrganizers },
  { label: '代表', value: Auth.AuthDelegates },
  { label: '管理员', value: Auth.AuthAdmin },
  { label: '超级管理员', value: Auth.AuthSuperAdmin },
];

function authToChecked(auth: number): number[] {
  return AUTH_MANAGE_BITS.filter((b) => hasAuth(auth as Auth, b.value)).map((b) => b.value);
}

const Users: React.FC = () => {
  const actionRef = useRef();
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  const [confirmLoading, setConfirmLoading] = useState(false);

  const [createForm] = Form.useForm();

  const [updateNameForm] = Form.useForm();
  const [curUpdatePlayer, setCurUpdatePlayer] = useState<PlayersAPI.Player>();
  const [updatePlayerNameModal, setUpdatePlayerNameModal] = useState<boolean>(false);

  const [updateWCAForm] = Form.useForm();
  const [updatePlayerWcaModal, setUpdatePlayerWcaModal] = useState<boolean>(false);

  const [mergePlayerForm] = Form.useForm();
  const [mergePlayerWcaModal, setMergePlayerWcaModal] = useState<boolean>(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState<number[]>([]);


  const [tableParams, setTableParams] = useState<PlayersAPI.PlayersReq>({
    size: 20,
    page: 1,
    name: '',
  });
  const resetParams = () => {
    setTableParams({
      ...tableParams,
      name: '',
    });
  };

  const handleCreateUser = async () => {
    try {
      const values = await createForm.validateFields();
      setConfirmLoading(true);
      await apiAdminCreatePlayer(values);
      message.success('用户创建成功');
      setCreateUserModalOpen(false);
      createForm.resetFields();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        console.error(err);
      }
    } finally {
      resetParams();
      setConfirmLoading(false);
    }
  };

  const handleUpdateName = async () => {
    try {
      const values = await updateNameForm.validateFields();
      setConfirmLoading(true);

      await apiAdminUpdatePlayerName({
        cube_id: curUpdatePlayer?.CubeID || '',
        new_name: values.name,
        wca_id: '',
      });
      message.success('用户更名成功');
      setUpdatePlayerNameModal(false);
      updateNameForm.resetFields();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        console.error(err);
      }
    } finally {
      resetParams();
      setConfirmLoading(false);
    }
  };

  const handleUpdateWCA = async () => {
    try {
      const values = await updateWCAForm.validateFields();
      setConfirmLoading(true);

      await apiAdminUpdatePlayerWCAID({
        cube_id: curUpdatePlayer?.CubeID || '',
        new_name: '',
        wca_id: values.wca_id,
      });
      message.success('用户更改WCAID成功');
      setUpdatePlayerWcaModal(false);
      updateWCAForm.resetFields();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        console.error(err);
      }
    } finally {
      resetParams();
      setConfirmLoading(false);
    }
  };

  const applyAuthDiff = async () => {
    if (!curUpdatePlayer) return;
    const oldA = curUpdatePlayer.Auth as Auth;
    const newA = authChecked.reduce((acc, v) => acc | v, 0) as Auth;
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
      message.success('权限已更新');
      setAuthModalOpen(false);
      // @ts-ignore
      actionRef.current?.reload?.();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown } };
      const text = getApiErrorDisplayMessage(ax.response?.data);
      if (text) message.error(text);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSaveAuth = async () => {
    if (!curUpdatePlayer) return;
    const oldA = curUpdatePlayer.Auth as Auth;
    const newA = authChecked.reduce((acc, v) => acc | v, 0) as Auth;
    const revokingOrg =
      hasAuth(oldA, Auth.AuthOrganizers) && !hasAuth(newA, Auth.AuthOrganizers);
    if (revokingOrg) {
      await new Promise<void>((resolve, reject) => {
        Modal.confirm({
          title: '撤销主办权限',
          content:
            '若该用户仍在任一主办团队中担任组长或成员，服务端将拒绝。请先在主办管理中移出成员或变更组长后再撤销。',
          okText: '仍要提交',
          cancelText: '取消',
          onOk: async () => {
            try {
              await applyAuthDiff();
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          onCancel: () => resolve(),
        });
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
        base_user_cube_id: curUpdatePlayer?.CubeID || '',
        merged_user_cube_id: values.other_cube_id,
      });
      message.success('用户合并成功');
      setMergePlayerWcaModal(false);
      mergePlayerForm.resetFields();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        console.error(err);
      }
    } finally {
      resetParams();
      setConfirmLoading(false);
    }
  };

  const columns: ProColumns<PlayersAPI.Player>[] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      hideInSearch: true,
    },
    {
      title: 'CubeID',
      dataIndex: 'CubeID',
      key: 'CubeID',
      width: 120,
      // @ts-ignore
      render: (value: string, player: PlayersAPI.Player) => {
        return <>{PlayerLink(player.CubeID, value, '#000')}</>;
      },
      hideInSearch: true,
    },

    {
      title: '名称',
      dataIndex: 'Name',
      key: 'Name',
      width: 150,
      // @ts-ignore
      render: (value: string, player: PlayersAPI.Player) => {
        return <>{PlayerLink(player.CubeID, player.Name, 'rgb(29,177,236)')}</>;
      },
    },
    {
      title: 'WcaID',
      dataIndex: 'WcaID',
      key: 'WcaID',
      width: 120,
      // @ts-ignore
      render: (value: string) => {
        return WCALink(value);
      },
      hideInSearch: true,
    },
    {
      title: '认领密码',
      hideInSearch: true,
      dataIndex: 'InitPassword',
      key: 'InitPassword',
      // @ts-ignore
      render: (value: string) => {
        // 自定义截断逻辑：显示前4位和后4位，中间省略
        const truncateText = (text: string, frontLength: number, endLength: number) => {
          if (text.length <= frontLength + endLength) {
            return text; // 如果长度不足，直接返回
          }
          return `${text.slice(0, frontLength)}...${text.slice(-endLength)}`;
        };

        // 复制功能
        const handleCopy = () => {
          navigator.clipboard.writeText(value).then(() => {
            message.success('复制成功');
          });
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={value}>
              <span style={{ marginRight: 8 }}>{truncateText(value, 6, 4)}</span>
            </Tooltip>
            <Button
              size="small"
              style={{ color: 'blueviolet' }}
              icon={<CopyOutlined />}
              onClick={handleCopy}
            ></Button>
          </div>
        );
      },
    },
    {
      title: '权限',
      dataIndex: 'Auth',
      key: 'Auth',
      width: 100,
      hideInSearch: true,
      // @ts-ignore
      render: (a: Auth) => {
        return authTags(a);
      },
    },
    {
      title: '操作',
      dataIndex: 'Option',
      key: 'option',
      hideInSearch: true,
      render: (value: any, player: PlayersAPI.Player) => {
        return (
          <>
            <Button
              type="primary"
              size={'small'}
              onClick={() => {
                setCurUpdatePlayer(player);
                setUpdatePlayerNameModal(true);
              }}
            >
              修改名称
            </Button>
            <Button
              type="default"
              size={'small'}
              style={{ marginLeft: 8 }}
              onClick={() => {
                setCurUpdatePlayer(player);
                setUpdatePlayerWcaModal(true);
              }}
            >
              修改WCA ID
            </Button>
            <Button
              type="default"
              size={'small'}
              danger={true}
              style={{ marginLeft: 8 }}
              onClick={() => {
                setCurUpdatePlayer(player);
                setMergePlayerWcaModal(true);
              }}
            >
              合并用户
            </Button>
            <Button
              type="default"
              danger={true}
              size={'small'}
              style={{ marginLeft: 8 }}
              onClick={() => {
                setCurUpdatePlayer(player);
                setAuthChecked(authToChecked(player.Auth));
                setAuthModalOpen(true);
              }}
            >
              修改权限
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <>
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        size="small"
        onClick={() => {
          setCreateUserModalOpen(true);
        }}
        style={{ marginBottom: 20, borderRadius: 6, float: 'right' }}
      >
        创建用户
      </Button>

      <Modal
        title="创建用户"
        open={createUserModalOpen}
        onCancel={() => setCreateUserModalOpen(false)}
        onOk={handleCreateUser}
        confirmLoading={confirmLoading}
        okText="提交"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
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

      <ProTable<PlayersAPI.Player, PlayersAPI.PlayersReq>
        title={() => {
          return <h1>后台用户管理列表</h1>;
        }}
        size={'small'}
        scroll={{ x: 'max-content' }}
        rowClassName={rowClassNameWithStyleLines}
        columns={columns}
        onReset={resetParams}
        params={tableParams}
        request={async (params) => {
          // @ts-ignore
          const name = params.Name;
          setTableParams({
            ...tableParams,
            name: name,
          });
          const value = await apiAdminPlayers(tableParams);

          if (value === undefined || value.data.items === undefined) {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
          return {
            data: value.data.items,
            success: true,
            total: value.data.total,
          };
        }}
        search={{
          labelWidth: 'auto',
          defaultColsNumber: 1,
          defaultCollapsed: false,
          span: { xs: 24, sm: 24, md: 24, lg: 18, xl: 18, xxl: 12 },
        }}
        pagination={{
          showQuickJumper: true,
          current: tableParams.page,
          pageSize: tableParams.size,
        }}
        onChange={(pagination) => {
          setTableParams({
            name: tableParams.name,
            page: pagination.current ? pagination.current : 1,
            size: pagination.pageSize ? pagination.pageSize : 20,
          });
        }}
        options={false}
        actionRef={actionRef}
        sticky
      />

      <Modal
        title="修改用户名称"
        open={updatePlayerNameModal}
        onOk={handleUpdateName}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setUpdatePlayerNameModal(false);
        }}
        destroyOnClose
      >
        <Form form={updateNameForm} layout="vertical" preserve={false}>
          <Form.Item
            label="用户名称"
            name="name"
            rules={[{ required: true, message: '请输入新名称' }]}
          >
            <Input placeholder="请输入新名称" defaultValue={curUpdatePlayer?.Name} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`修改用户${curUpdatePlayer?.Name} WCAID`}
        open={updatePlayerWcaModal}
        onOk={handleUpdateWCA}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setUpdatePlayerWcaModal(false);
        }}
        destroyOnClose
      >
        <Form form={updateWCAForm} layout="vertical" preserve={false}>
          <Form.Item
            label="WCAID"
            name="wca_id"
            rules={[
              { required: true, message: '请输入wcaID' },
              { message: '长度必须为10', len: 10 },
            ]}
          >
            <Input placeholder="请输入WCAID" defaultValue={curUpdatePlayer?.WcaID} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`修改权限 — ${curUpdatePlayer?.Name} (${curUpdatePlayer?.CubeID})`}
        open={authModalOpen}
        onCancel={() => setAuthModalOpen(false)}
        onOk={handleSaveAuth}
        confirmLoading={confirmLoading}
        width={520}
        destroyOnClose
      >
        <p style={{ marginBottom: 12, color: '#666' }}>
          按位更新权限；撤销主办前请确认用户已从主办团队中移出（见对接说明）。
        </p>
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
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
        onOk={handleMergePlayer}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setMergePlayerWcaModal(false);
        }}
        destroyOnClose
      >
        <Form form={mergePlayerForm} layout="vertical" preserve={false}>
          <Form.Item
            label="合并到账号（被合并方）"
            name="other_cube_id"
            rules={[
              { required: true, message: '请搜索并选择用户' },
              { message: 'CubeID 长度须为 10', len: 10 },
            ]}
          >
            <AdminUserSearchSelect placeholder="输入姓名或 CubeID 搜索被合并用户" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Users;
