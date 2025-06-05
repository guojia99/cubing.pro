import {PlayerLink, WCALink} from '@/components/Link/Links';
import {rowClassNameWithStyleLines} from '@/components/Table/table_style';
import {apiAdminCreatePlayer, apiAdminPlayers, apiAdminUpdatePlayerName} from '@/services/cubing-pro/auth/admin';
import {PlayersAPI} from '@/services/cubing-pro/players/typings';
import {CopyOutlined, UserAddOutlined} from '@ant-design/icons';
import {ProTable} from '@ant-design/pro-table';
import {ProColumns} from '@ant-design/pro-table/es/typing';
import {Button, Modal, Tooltip, message, Form, Input} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {Auth, authTags} from "@/pages/Admin/AuthComponents/AuthComponents";


const Users: React.FC = () => {
  const actionRef = useRef();
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);


  const [confirmLoading, setConfirmLoading] = useState(false);

  const [createForm] = Form.useForm()

  const [updateNameForm] = Form.useForm();
  const [curUpdatePlayer, setCurUpdatePlayer] = useState<PlayersAPI.Player>();
  const [updatePlayerNameModal, setUpdatePlayerNameModal] = useState<boolean>(false);

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
      resetParams()
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
      })
      message.success('用户更名成功');
      setUpdatePlayerNameModal(false);
      updateNameForm.resetFields();
    } catch (err){
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        console.error(err);
      }
    } finally {
      resetParams()
      setConfirmLoading(false);
    }
  }


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
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Tooltip title={value}>
              <span style={{marginRight: 8}}>{truncateText(value, 6, 4)}</span>
            </Tooltip>
            <Button
              size="small"
              style={{color: 'blueviolet'}}
              icon={<CopyOutlined/>}
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
        return authTags(a)
      }
    },
    {
      title: '操作',
      dataIndex: 'Option',
      key: 'option',
      hideInSearch: true,
      render: (value: any, player: PlayersAPI.Player) => {
        return <>
          <Button size={"small"} onClick={() => {
            setCurUpdatePlayer(player)
            setUpdatePlayerNameModal(true)
          }}>修改名称</Button>
        </>;
      },
    }
  ];



  return (
    <>
      <Button
        type="primary"
        icon={<UserAddOutlined/>}
        size="small"
        onClick={() => {
          setCreateUserModalOpen(true);
        }}
        style={{marginBottom: 20, borderRadius: 6, float: 'right'}}
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
            rules={[{required: true, message: '请输入用户名'}]}
          >
            <Input placeholder="请输入用户名"/>
          </Form.Item>
          <Form.Item
            name="qq"
            label="QQ"
          >
            <Input placeholder="请输入 QQ 号"/>
          </Form.Item>
          <Form.Item
            name="actualName"
            label="真实姓名"
          >
            <Input placeholder="请输入真实姓名"/>
          </Form.Item>
          <Form.Item
            name="wca_id"
            label="WCA ID"
          >
            <Input placeholder="请输入 WCA ID"/>
          </Form.Item>
        </Form>
      </Modal>


      <ProTable<PlayersAPI.Player, PlayersAPI.PlayersReq>
        title={() => {
          return <h1>后台用户管理列表</h1>;
        }}
        size={"small"}
        scroll={{x: 'max-content'}}
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
          span: {xs: 24, sm: 24, md: 24, lg: 18, xl: 18, xxl: 12},
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
        onCancel={() => {setUpdatePlayerNameModal(false)}}
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
    </>
  );
};

export default Users;
