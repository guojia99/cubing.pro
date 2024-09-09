import React, {useRef, useState} from 'react';
import {Badge, Radio, Select, SelectProps, Tag} from 'antd';
import dayjs from 'dayjs';
import {apiComps} from "@/services/cubing-pro/comps/comps";
import {Link} from "react-router-dom"
import {parseDateTime} from "@/utils/time/data_time";
import {CubeIcon} from "@/components/CubeIcon/cube_icon";
import {ProTable} from "@ant-design/pro-table";
import {ProColumns} from "@ant-design/pro-table/es/typing";
import {CompsAPI} from "@/services/cubing-pro/comps/typings";


function getStatusProp(result: CompsAPI.Comp) {
  const now = dayjs();
  const startTime = dayjs(result.CompStartTime);
  const endTime = dayjs(result.CompEndTime);

  let status = "";
  let color = "default"; // 默认颜色

  if (now.isBefore(startTime)) {
    status = "未开始";
    color = "#9254de";
  } else if (now.isAfter(startTime) && now.isBefore(endTime)) {
    status = "进行中";
    color = "#52c41a";
  } else {
    status = "已结束";
    color = "#8c8c8c";
  }
  return {
    status: status,
    color: color
  }
}

// todo 修改为动态获取
const cubeIconOptions: SelectProps['options'] = [
  {value: '三阶', en: "333", color: "cyan"},
  {value: '四阶', en: "444", color: "red"},
  {value: '五阶', en: "555", color: "green"},
  {value: '六阶', en: "666", color: "blue"},
];


//  : TableProps<CompsAPI.Comp>['columns']
const columns: ProColumns<CompsAPI.Comp>[] = [
  {
    title: "",
    dataIndex: "status",
    key: "",
    colSize: 1,
    render: (text: any, result: CompsAPI.Comp) => {
      const status = getStatusProp(result);
      return (<div style={{textAlign: "center"}}><Badge color={status.color} size="default" style={{marginRight: "10px"}}/></div>)
    },
    hideInSearch: true
  },
  {
    title: "日期",
    dataIndex: 'CompStartTime',
    key: "CompStartTime",
    render: (text: any, result: CompsAPI.Comp) => {
      const startTime = dayjs(result.CompStartTime);
      const endTime = dayjs(result.CompEndTime);
      return (<>{parseDateTime(result.CompStartTime)}</>)
    },
    hideInSearch: true
  },
  {
    title: "结束日",
    dataIndex: 'CompEndTime',
    key: "CompEndTime",
    render: (text: any, result: CompsAPI.Comp) => {
      return (
        <>{parseDateTime(result.CompEndTime)}</>
      )
    },
    hideInSearch: true
  },
  {
    title: "类型",
    dataIndex: 'Genre',
    key: "Genre",
    render: (text: any, result: CompsAPI.Comp) => {
      const mp = {
        1: {label: "WCA", color: "blue", icon: "https://cubing.com/f/images/wca.png"},
        2: {label: "线下正式赛", color: "green"},
        3: {label: "线上正式赛", color: "red"},
        4: {label: "线下赛", color: "orange"},
        5: {label: "线上赛", color: "purple"}
      };
      const key = result.Genre + "";

      // @ts-ignore with mp[key]
      const {label, color, icon} = mp[key] || {};

      return (
        <>
          <Tag color={color}>{label}</Tag>
          {icon && <img src={icon} alt="icon" style={{width: 16, marginRight: 8}}/>}
        </>
      );
    },
    hideInSearch: true,  // todo
    renderFormItem: () => {
      return (<>
        <Radio.Group defaultValue={"0"}>
          <Radio.Button value="0">全部</Radio.Button>
          {/*<Radio.Button value="1">WCA</Radio.Button>*/}
          <Radio.Button value="4">线下赛</Radio.Button>
          <Radio.Button value="5">线下赛</Radio.Button>
        </Radio.Group>
      </>)
    }
  },
  {
    title: '名称',
    dataIndex: 'Name',
    key: 'Name',
    render: (text: any, result: CompsAPI.Comp) => {
      return (
        <>
          <Link to={"/competition/" + result.id} style={{color: "#373737"}}>{result.Name}</Link>
          {result.logo && (<img src={result.logo} alt="logo" style={{width: '1em', height: '1em', marginLeft: '0.5em', verticalAlign: 'middle'}}/>)}
        </>
      )
    },
  },
  {
    title: "项目",
    dataIndex: 'EventMin',
    key: "EventMin",
    render: (text: any, result: CompsAPI.Comp) => {
      const l = text.toString().split(";")
      const body = []
      for (let i = 0; i < l.length; i++) {
        body.push(CubeIcon(l[i], "comp_icon_key" + result.id + "-" + l[i], {marginLeft: "3px"}))
      }
      const status = getStatusProp(result)
      return <>
        <Badge.Ribbon text={status.status} color={status.color} style={{fontSize: "small", marginTop: "-15px", marginLeft: "5px"}} placement="end"></Badge.Ribbon>
        {body}
      </>
    },
    hideInSearch: true,// todo
    renderFormItem: () => {
      return (
        <Select
          mode="multiple"
          tagRender={(props) => {
            const {label, value, closable, onClose} = props;
            const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
              event.preventDefault();
              event.stopPropagation();
            };

            const line = cubeIconOptions.find(option => option.value === value);
            return (
              <Tag
                color={line ? line.color : "cyan"}
                onMouseDown={onPreventMouseDown}
                closable={closable}
                onClose={onClose}
                style={{marginInlineEnd: 4}}
              >
                {label}
                {CubeIcon(line?.en, "comp_icon_label_key" + "-" + label, {marginLeft: "2px"})}
              </Tag>
            );
          }}
          style={{width: '100%'}}
          options={cubeIconOptions}
        />
      )
    }
  },
];


const Competitions: React.FC = () => {
  const actionRef = useRef();

  const [tableParams, setTableParams] = useState<CompsAPI.CompsReq>({
    size: 20, page: 1, name: ""
  });

  const resetParams = () => {
    setTableParams({
      ...tableParams,
      name: ""
    })
  }

  return (
    <>
      <ProTable<CompsAPI.Comp, CompsAPI.CompsReq>
        title={() => {
          return (<h2>赛事列表</h2>)
        }}
        columns={columns}
        onReset={resetParams}
        params={tableParams}
        request={async (params) => {
          // todo 如果条件查询第一次查，需要把翻页重置，后续不再重置。
          // @ts-ignore
          const name = params.Name
          setTableParams({
            ...tableParams,
            name: name,
          })
          const value = await apiComps(tableParams)
          return {data: value.data.items, success: true, total: value.data.total};
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
            ...tableParams,
            page: pagination.current ? pagination.current : 1,
            size: pagination.pageSize ? pagination.pageSize : 20,
          });
        }}
        options={false}
        actionRef={actionRef}
      />
    </>
  )
}


export default Competitions;
