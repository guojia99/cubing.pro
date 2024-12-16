import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { Comp } from '@/components/Data/types/comps';
import { parseDateTime } from '@/utils/time/data_time';
import { ProColumns } from '@ant-design/pro-table/es/typing';
import { Badge, Radio, Select, SelectProps, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { Link } from 'react-router-dom';

export function getStatusProp(result: Comp) {
  const now = dayjs();
  const startTime = dayjs(result.CompStartTime);
  const endTime = dayjs(result.CompEndTime);

  let status = '';
  let color = 'default'; // 默认颜色

  switch (result.Status) {
    case 'Running':

      if (result.IsDone){
        status = '已结束';
        color = '#8c8c8c';
        break
      }


      if (now.isBefore(startTime)) {
        status = '未开始';
        color = '#9254de';
      } else if (now.isAfter(startTime) && now.isBefore(endTime)) {
        status = '进行中';
        color = '#52c41a';
      } else {
        status = '待结束'
        color = '#755b5b';
      }
      break;
    case 'Reviewing':
      status = '审批中';
      color = '#F4D95B';
      break;
    case 'Reject':
      status = '驳回';
      color = '#F3456D';
      break;
    case 'Temporary':
      status = '编辑中';
      color = '#C4F757';
      break;
    case 'Ban':
      status = '禁用';
      color = '#173A4E';
      break;
  }

  return {
    status: status,
    color: color,
  };
}

// todo 修改为动态获取
const cubeIconOptions: SelectProps['options'] = [
  { value: '三阶', en: '333', color: 'cyan' },
  { value: '四阶', en: '444', color: 'red' },
  { value: '五阶', en: '555', color: 'green' },
  { value: '六阶', en: '666', color: 'blue' },
];

//  : TableProps<Comp>['columns']
export const CompsTableColumns: ProColumns<Comp>[] = [
  {
    title: '序号',
    dataIndex: 'Index',
    key: 'Index',
    hideInSearch: true,
    width: 65,
    colSize: 1,
    render: (value: any, result: Comp) => {
      const status = getStatusProp(result);
      return (
        <div style={{ textAlign: 'center' }}>
          <Badge color={status.color} size="default" style={{ marginRight: '10px' }} />
          {value}
        </div>
      );
    },
  },
  {
    title: '日期',
    dataIndex: 'CompStartTime',
    key: 'CompStartTime',
    render: (text: any, result: Comp) => {
      const startTime = dayjs(result.CompStartTime);
      const endTime = dayjs(result.CompEndTime);
      const daysDifference = endTime.diff(startTime, 'day'); // 天数差

      if (daysDifference > 1) {
        return  <>{parseDateTime(result.CompStartTime)}({daysDifference}天)</>;
      }
      return <>{parseDateTime(result.CompStartTime)})</>;
    },
    hideInSearch: true,
    width: 130,
  },
  // {
  //   title: "结束日",
  //   dataIndex: 'CompEndTime',
  //   key: "CompEndTime",
  //   render: (text: any, result: Comp) => {
  //     return (
  //       <>{parseDateTime(result.CompEndTime)}</>
  //     )
  //   },
  //   hideInSearch: true
  // },
  {
    title: '类型',
    dataIndex: 'Genre',
    key: 'Genre',
    render: (text: any, result: Comp) => {
      const mp = {
        1: { label: 'WCA', color: 'blue', icon: 'https://cubing.com/f/images/wca.png' },
        2: { label: '线下正式赛', color: 'green' },
        3: { label: '线上正式赛', color: 'red' },
        4: { label: '线下赛', color: 'orange' },
        5: { label: '线上赛', color: 'purple' },
      };
      const key = result.Genre + '';

      // @ts-ignore with mp[key]
      const { label, color, icon } = mp[key] || {};

      return (
        <>
          <Tag color={color}>{label}</Tag>
          {icon && <img src={icon} alt="icon" style={{ width: 16, marginRight: 8 }} />}
        </>
      );
    },
    hideInSearch: true, // todo
    renderFormItem: () => {
      return (
        <>
          <Radio.Group defaultValue={'0'}>
            <Radio.Button value="0">全部</Radio.Button>
            {/*<Radio.Button value="1">WCA</Radio.Button>*/}
            <Radio.Button value="4">线下赛</Radio.Button>
            <Radio.Button value="5">线下赛</Radio.Button>
          </Radio.Group>
        </>
      );
    },
    width: 80,
  },
  {
    title: '名称',
    dataIndex: 'Name',
    key: 'Name',
    render: (text: any, result: Comp) => {
      return (
        <>
          <Link to={'/competition/' + result.id} style={{ color: '#373737' }}>
            {result.Name}
          </Link>
          {result.logo && (
            <img
              src={result.logo}
              alt="logo"
              style={{ width: '1em', height: '1em', marginLeft: '0.5em', verticalAlign: 'middle' }}
            />
          )}
        </>
      );
    },
    width: 200,
  },
  {
    title: '人数',
    dataIndex: 'Count',
    key: 'Count',
    width: 70,
    hideInSearch: true,
  },
  {
    title: '项目',
    dataIndex: 'EventMin',
    key: 'EventMin',
    width: 150,
    render: (text: any, result: Comp) => {
      const l = text.toString().split(';');

      if (text === '') {
        return <>暂无项目</>;
      }
      const body = [];
      for (let i = 0; i < l.length; i++) {
        body.push(CubeIcon(l[i], 'comp_icon_key' + result.id + '-' + l[i], { marginLeft: '3px' }));
        if (i >= 3) {
          body.push(<> 等共{l.length}个项目</>);
          break;
        }
      }
      return <>{body}</>;
    },
    hideInSearch: true, // todo
    renderFormItem: () => {
      return (
        <Select
          mode="multiple"
          tagRender={(props) => {
            const { label, value, closable, onClose } = props;
            const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
              event.preventDefault();
              event.stopPropagation();
            };

            const line = cubeIconOptions.find((option) => option.value === value);
            return (
              <Tag
                color={line ? line.color : 'cyan'}
                onMouseDown={onPreventMouseDown}
                closable={closable}
                onClose={onClose}
                style={{ marginInlineEnd: 4 }}
              >
                {label}
                {CubeIcon(line?.en, 'comp_icon_label_key' + '-' + label, { marginLeft: '2px' })}
              </Tag>
            );
          }}
          style={{ width: '100%' }}
          options={cubeIconOptions}
        />
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'Status',
    key: 'Status',
    width: 70,
    hideInSearch: true,
    render: (text: any, result: Comp) => {
      const status = getStatusProp(result);
      return (
        <>
          <Tag color={status.color}>{status.status}</Tag>
        </>
      );
    },
  },
];

export const CompsTable = (dataSource: Comp[], keys: string[]) => {
  let columns = [];

  for (let key of keys) {
    for (let i = 0; i < CompsTableColumns.length; i++) {
      if (CompsTableColumns[i].dataIndex === key) {
        columns.push(CompsTableColumns[i]);
        break;
      }
    }
  }
  return (
    <Table
      dataSource={dataSource}
      // @ts-ignore
      columns={columns}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }} // 启用横向滚动
    />
  );
};
