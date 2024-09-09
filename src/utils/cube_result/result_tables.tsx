import React from "react";
import {List, Table} from "antd";
import {Result, resultString, resultTimeString} from "@/utils/cube_result/result";
import {eventRouteM} from "@/utils/cube_result/event_route";
import {val} from "@umijs/utils/compiled/cheerio/lib/api/attributes";
import {CubeIcon} from "@/components/CubeIcon/cube_icon";
import {CubesCn} from "@/components/CubeIcon/cube";
import {Link} from "@umijs/max";


const columnsMap = new Map([
  [
    'Round',
    {
      title: '轮次',
      dataIndex: 'Round',
      key: 'Round',
      width: 150,
      render: (value: string, result: Result) => {
        return (<td style={{minWidth: "100px", width: "150px"}}>{value}</td>)
      }
    },
  ],
  [
    'PersonName',
    {
      title: '玩家名',
      dataIndex: 'PersonName',
      key: 'PersonName',
      width: 150,
      render: (value: string, result: Result) => {
        return (
          <td style={{minWidth: "100px", width: "150px"}}>
            <strong><Link to={"/player/"+result.UserID}>{value}</Link></strong>
          </td>
        )
      }
    },
  ],
  [
    'Best',
    {
      title: '单次',
      dataIndex: 'Best',
      key: 'Best',
      render: (results: number, result: Result) => {
        const m = eventRouteM(result.EventRoute)
        let inter = m.integer ? m.integer : false
        if (m.repeatedly) {
          inter = false
        }

        return (<td style={{minWidth: "100px", width: "100px"}}>{resultTimeString(results, inter)}</td>)
      },
      width: 100,
    },
  ],
  [
    'Average',
    {
      title: '平均',
      dataIndex: 'Average',
      key: 'Average',
      render: (results: number, result: Result) => {
        const m = eventRouteM(result.EventRoute)
        if (m.repeatedly) {
          // todo 多轮的
          return <td style={{minWidth: "100px", width: "100px"}}>{}</td>
        }
        return (<td style={{minWidth: "100px", width: "100px"}}>{resultTimeString(results)}</td>)
      },
      width: 100
    },
  ],
  [
    'Result',
    {
      title: '成绩',
      dataIndex: 'Result',
      key: 'Result',
      render: (results: number[], result: Result) => {
        const data = resultString(results, result.EventRoute)
        let body: JSX.Element[] = []
        data.map((value: string) => {
          body.push(<td style={{width: "100px", minWidth: "100px"}}>{value}</td>)
        })
        return (<>{body}</>)
      },
      // width: 100*5,
    },
  ],
  [
    'EventName',
    {
      title: '项目',
      dataIndex: 'EventName',
      key: 'EventName',
      width: 100,
      render: (value: string, result: Result) => {
        return (<td style={{minWidth: "100px", width: "100px"}}>{CubeIcon(result.EventID, result.EventID, {})} {CubesCn(value)}</td>)
      }
    },
  ],
  [
    'EventNameOnlyOne',
    {
      title: '项目',
      dataIndex: 'EventName',
      key: 'EventName',
      width: 100,
      render: (value: string, result: Result) => {
        if (result.RoundNumber != 1) {
          return <td style={{minWidth: "100px", width: "100px"}}></td>
        }
        // todo 中英文？
        return (<td style={{minWidth: "100px", width: "100px"}}>{CubeIcon(result.EventID, result.EventID, {})} {CubesCn(value)}</td>)
      }
    },
  ],
  [
    "Rank",
    {
      title: "排名",
      dataIndex: "Rank",
      key: "Rank",
      width: 100,
      render: (value: number, result: Result) => {
        return value+1
      }
    }
  ]
]);

export const playerResultKeys = [
  "EventNameOnlyOne", "Round", "Best", "Average", "Result"
]


export const ResultsTable = (dataSource: Result[], keys: string[]) => {
  let columns = []
  for (let key of keys) {
    let column = columnsMap.get(key);
    if (column === undefined) {
      continue
    }
    columns.push(column)
  }


  return <Table
    dataSource={dataSource}
    columns={columns}
    pagination={false}
    // scroll={{x: 'max-content'}}  // 启用横向滚动
  />;
}

