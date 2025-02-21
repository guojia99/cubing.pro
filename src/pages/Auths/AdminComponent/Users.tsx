import { PlayerLink, WCALink } from '@/components/Link/Links';
import { rowClassNameWithStyleLines } from '@/components/Table/table_style';
import { apiAdminPlayers } from '@/services/cubing-pro/auth/admin';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { CopyOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-table';
import { ProColumns } from '@ant-design/pro-table/es/typing';
import { Button, Tooltip, message } from 'antd';
import React, { useRef, useState } from 'react';
import {Auth, authTags} from "@/pages/Auths/AuthComponents";


const columns: ProColumns<PlayersAPI.Player>[] = [
  {
    title: '序号',
    dataIndex: 'id',
    key: 'id',
    width: 100,
    hideInSearch: true,
  },
  {
    title: 'CubeID',
    dataIndex: 'CubeID',
    key: 'CubeID',
    width: 150,
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
    width: 200,
    // @ts-ignore
    render: (value: string, player: PlayersAPI.Player) => {
      return <>{PlayerLink(player.CubeID, player.Name, 'rgb(29,177,236)')}</>;
    },
  },
  {
    title: 'WcaID',
    dataIndex: 'WcaID',
    key: 'WcaID',
    width: 150,
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
    width: 200,
    hideInSearch: true,
    // @ts-ignore
    render: (a: Auth ) => {return authTags(a)}
  },
  // {
  //   title: '操作',
  //   dataIndex: 'Option',
  //   key: 'option',
  //   width: 200,
  //   hideInSearch: true,
  //   render: (value: any, player: PlayersAPI.Player) => {
  //     return <>xxx</>;
  //   },
  // },
];

const Users: React.FC = () => {
  const actionRef = useRef();
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

  return (
    <>
      <ProTable<PlayersAPI.Player, PlayersAPI.PlayersReq>
        title={() => {
          return <h1>后台用户管理列表</h1>;
        }}
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
    </>
  );
};

export default Users;
