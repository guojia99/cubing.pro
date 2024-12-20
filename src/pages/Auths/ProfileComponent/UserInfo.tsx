import { authTags } from '@/pages/Auths/AuthComponents';
import { currentUser } from '@/services/cubing-pro/auth/auth';
import { ProDescriptions } from '@ant-design/pro-components';
import { Card, Divider } from 'antd';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {AuthAPI} from "@/services/cubing-pro/auth/typings";

const baseColumns = [
  {
    title: 'ID',
    key: 'id',
    dataIndex: 'id',
    copyable: false,
    editable: false,
  },
  {
    title: 'CubeID',
    key: 'CubeID',
    dataIndex: 'CubeID',
    copyable: true,
    editable: false,
  },
  {
    title: '注册时间',
    key: 'createdAt',
    dataIndex: 'createdAt',
    copyable: false,
    editable: false,
    render: (value: string) => {
      const datePart = value.split('T')[0]; // 取出日期部分
      return datePart.replace(/-/g, ' / '); // 将 "-" 替换为 "/"
    },
  },
  {
    title: '邮箱',
    key: 'Email',
    dataIndex: 'Email',
    copyable: true,
    editable: false,
  },

  {
    title: '等级',
    key: 'Level',
    dataIndex: 'Level',
    editable: false,
  },
  {
    title: '经验',
    key: 'Experience',
    dataIndex: 'Experience',
    editable: false,
  },

  {
    title: '操作',
    valueType: 'option',

    render: (_: any, player: { CubeID: string }) => [
      // eslint-disable-next-line react/jsx-key
      <Link to={'/player/' + player.CubeID}>我的主页</Link>,
    ],
  },
  // {
  //   title: '状态',
  //   key: 'state',
  //   dataIndex: 'state',
  //   valueType: 'select',
  //   editable: false,
  //   valueEnum: {
  //     all: { text: '全部', status: 'Default' },
  //     open: {
  //       text: '未解决',
  //       status: 'Error',
  //     },
  //     closed: {
  //       text: '已解决',
  //       status: 'Success',
  //     },
  //   },
  // },
  // {
  //   title: '状态2',
  //   key: 'state2',
  //   dataIndex: 'state2',
  //   renderFormItem: () => {
  //     return <Input placeholder="输入 Success 切换分值" />;
  //   },
  // },
  // {
  //   title: '分值',
  //   dataIndex: 'fraction',
  //   valueType: (record) => {
  //     const scoringMethod = record?.state2;
  //     if (scoringMethod === 'Success') return 'select';
  //     return 'digit';
  //   },
  //   fieldProps: {
  //     mode: 'multiple',
  //   },
  //   request: async () =>
  //     ['A', 'B', 'D', 'E', 'F'].map((item, index) => ({
  //       label: item,
  //       value: index,
  //     })),
  // },
  //
  // {
  //   title: '时间',
  //   key: 'date',
  //   dataIndex: 'date',
  //   valueType: 'date',
  // },
  // {
  //   title: 'Rate',
  //   key: 'rate',
  //   dataIndex: 'rate',
  //   valueType: 'rate',
  // },
  // {
  //   title: 'money',
  //   key: 'money',
  //   dataIndex: 'money',
  //   valueType: 'money',
  //   render: (dom, entity, index, action) => {
  //     return (
  //       <Tooltip title="点击进入编辑状态">
  //         <div
  //           onClick={() => {
  //             action?.startEditable('money');
  //           }}
  //         >
  //           {dom}
  //         </div>
  //       </Tooltip>
  //     );
  //   },
  // },
];

const editColumns = [
  {
    title: '昵称',
    key: 'Name',
    dataIndex: 'Name',
    copyable: false,
  },
  {
    title: '英文名',
    key: 'EnName',
    dataIndex: 'EnName',
    copyable: false,
  },
  {
    title: 'WcaID',
    key: 'WcaID',
    dataIndex: 'WcaID',
    copyable: true,
  },
  {
    title: 'QQ',
    key: 'QQ',
    dataIndex: 'QQ',
    copyable: true,
  },
  {
    title: '性别',
    key: 'Sex',
    dataIndex: 'Sex',
    copyable: false,
    render: (value: number) => {
      if (value === 0) {
        return '机器人';
      }
      if (value === 1) {
        return '男';
      }
      if (value === 2) {
        return '女';
      }
      return '神奇的生物';
    },
  },
  {
    title: '生日',
    key: 'Birthdate',
    dataIndex: 'Birthdate',
    copyable: false,
  },
  {
    title: '操作',
    valueType: 'option',
    render: () => [
      <a target="_blank" rel="noopener noreferrer" key="link">
        修改密码
      </a>,
      <a target="_blank" rel="noopener noreferrer" key="warning">
        修改邮箱
      </a>,
      // <a target="_blank" rel="noopener noreferrer" key="view">
      //   查看
      // </a>,
    ],
  },
];
export default function UserInfo(user: AuthAPI.CurrentUser) {
  const actionRef = useRef();
  const getUser = async () => {
    let currentUserValue = await currentUser();
    console.log(currentUserValue);
    return {
      success: true,
      data: currentUserValue.data.data,
    };
  };
  return (
    <Card>
      <ProDescriptions
        actionRef={actionRef}
        title="个人信息"
        request={getUser}
        // @ts-ignore
        columns={baseColumns}
        // column={3}
      >
        <ProDescriptions.Item
          span={3}
          contentStyle={{ maxWidth: '80%' }}
          label="权限"
          // @ts-ignore
          render={(value: number) => {
            return <>{authTags(value)}</>;
          }}
        >
          {user.data.Auth}
        </ProDescriptions.Item>
        <ProDescriptions.Item
          span={3}
          valueType="text"
          contentStyle={{ maxWidth: '80%' }}
          copyable={true}
          ellipsis
          label="QQ唯一验证码"
        >
          {user.data.QQUniID}
        </ProDescriptions.Item>
      </ProDescriptions>
      <Divider />
      <ProDescriptions
        actionRef={actionRef}
        formProps={{ onValuesChange: (e, f) => console.log(f) }}
        tooltip="可修改的用户数据, 点击某项进行修改,无法修改的内容需要联系管理员进行修正"
        request={getUser}
        editable={{}}
        // @ts-ignore
        columns={editColumns}
      >
        <ProDescriptions.Item
          span={3}
          valueType="text"
          contentStyle={{ maxWidth: '100%' }}
          copyable={true}
          ellipsis
          label="签名"
        >
          {user.data.Sign}
        </ProDescriptions.Item>
      </ProDescriptions>
    </Card>
  );
}
