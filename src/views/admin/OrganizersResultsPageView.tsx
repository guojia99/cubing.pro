"use client";

import "antd/dist/reset.css";

import { Text } from "@chakra-ui/react";
import { CubesCn } from "@/components/CubeIcon/cube";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { eventRouteM } from "@/components/Data/cube_result/event_route";
import { ResultsTable } from "@/components/Data/cube_result/result_tables";
import {
  PreResult,
  Result,
  resultStringPro,
  resultTimeString,
} from "@/components/Data/types/result";
import { PlayerLink } from "@/components/Link/GcLinks";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { NavTabs } from "@/components/Tabs/NavTabs";
import { OrganizersGuard } from "@/components/admin/OrganizersGuard";
import {
  apiAddCompResults,
  apiApprovalCompsPreResult,
  apiDeleteCompsResult,
  apiGetAllPlayers,
  apiGetCompsPreResult,
  apiGetCompsResults,
  apiGetCompsResultsWithPlayer,
  apiGetOrgComp,
  apiOrganizers,
} from "@/services/cubing-pro/auth/organizers";
import { OrganizersAPI } from "@/services/cubing-pro/auth/typings";
import { CompAPI } from "@/services/cubing-pro/comps/typings";
import { apiEvents } from "@/services/cubing-pro/events/events";
import { EventsAPI } from "@/services/cubing-pro/events/typings";
import { PlayersAPI } from "@/services/cubing-pro/players/typings";
import { isNumber } from "@/utils/types/numbers";
import { ADMIN_LEGACY } from "@/theme/domainColors";
import { CloseCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Cascader,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import TextArea from "antd/es/input/TextArea";
import { TableRowSelection } from "antd/es/table/interface";
import React, { useCallback, useEffect, useState } from "react";

function normalizeMbldScoreText(value: string): string {
  return value
    .replace(/：/g, ":")
    .replace(/。/g, ".")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

/** 解析多盲成绩，如 `23/38 1:26`、`23 / 38 1:26` */
function parseMultiBlindParts(value: string): { ratio: string; time: string } | null {
  const normalized = normalizeMbldScoreText(value);
  if (!normalized) return null;
  const match = normalized.match(/^(\d+\/\d+)\s+(.+)$/);
  if (!match) return null;
  return { ratio: match[1], time: match[2] };
}

function isMultiBlindRoute(route: number): boolean {
  return [8, 9, 10].includes(route);
}

function OrganizersResultsContent({
  orgId,
  compId,
}: {
  orgId: string;
  compId: string;
}) {
  const [org, setOrg] = useState<OrganizersAPI.OrganizersResp | null>(null);
  const [comp, setComp] = useState<CompAPI.CompResp | null>(null);
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);

  const [players, setPlayers] = useState<PlayersAPI.Player[]>();

  // 单个录入
  const [curPlayer, setCurPlayer] = useState<any>();
  const [curSchedule, setCurSchedule] = useState<CompAPI.Schedule | null>(null);
  const [curEvent, setCurEvent] = useState<CompAPI.Event | null>(null);
  const [oneResults, setOneResults] = useState<Result[]>([]);
  const [scheduleOpt, setScheduleOpt] = useState<[]>();
  const [inputValues, setInputValues] = useState<string[]>(Array(5));
  const [curRound, setCurRound] = useState<any>();

  // 多录入
  const [multiResults, setMultiResults] = useState<Result[]>([]);
  const [parserResults, setParserResults] = useState<any[]>([]);

  // 录入审批
  const [preResultSelectedRowKeys, setPreResultSelectedRowKeys] = useState<React.Key[]>([]);
  const [preResults, setPreResults] = useState<PreResult[]>([]);
  const [preResultPage, setPreResultPage] = useState(1);
  const [preResultPageSize, setPreResultPageSize] = useState(20);
  const [preResultTotal, setPreResultTotal] = useState(0);
  const [preResultLoading, setPreResultLoading] = useState(false);

  useEffect(() => {
    apiEvents().then((value) => {
      setEvents(value.data.Events);
    });
    // @ts-ignore
    apiGetOrgComp(orgId, compId).then((value) => {
      setComp(value);
      let data = [];
      for (let i = 0; i < value.data.comp_json.Events.length; i++) {
        const ev = value.data.comp_json.Events[i];
        if (ev.EventID === '' || ev.EventID === undefined) {
          continue;
        }

        let children = [];
        for (let j = 0; j < ev.Schedule.length; j++) {
          let s = ev.Schedule[j];
          children.push({
            value: s.RoundNum,
            label: s.Round,
          });
        }

        let v = {
          value: ev.EventID,
          label: (
            <>
              {CubeIcon(ev.EventID, ev.EventID, {})}
              {CubesCn(ev.EventID)}
            </>
          ),
          children: children,
        };
        data.push(v);
      }
      // @ts-ignore
      setScheduleOpt(data);
    });
    // @ts-ignore
    apiOrganizers(orgId).then((value) => {
      setOrg(value);
    });
    apiGetAllPlayers(orgId, compId).then((value) => {
      setPlayers(value.data.items);
    });
  }, [orgId, compId]);

  const loadPreResults = useCallback(
    async (page = preResultPage, pageSize = preResultPageSize) => {
      setPreResultLoading(true);
      try {
        const value = await apiGetCompsPreResult(orgId, compId, false, page, pageSize);

        for (let i = 0; i < value.data.items.length; i++) {
          value.data.items[i].key = value.data.items[i].id;
        }

        setPreResults(value.data.items);
        setPreResultTotal(value.data.total);
        setPreResultSelectedRowKeys([]);
      } finally {
        setPreResultLoading(false);
      }
    },
    [orgId, compId, preResultPage, preResultPageSize],
  );

  useEffect(() => {
    void loadPreResults();
  }, [loadPreResults]);

  if (!comp || !org) {
    return <>loading</>;
  }
  if (comp.data.OrganizersID !== org.data.id) {
    return <>无权限</>;
  }

  const playerOptions =
    players?.map((player) => ({
      value: player.CubeID,
      label: `${player.CubeID} - ${player.Name}`,
    })) ?? [];

  const updateRound = (v: any) => {
    if (v === undefined || v === '' || v === null) {
      return;
    }

    setCurRound(v);
    const ev = comp.data.comp_json.Events.find((value) => {
      return value.EventID === v[0];
    });
    if (ev === undefined) {
      return;
    }
    setCurEvent(ev);

    const schedule = ev.Schedule.find((value) => {
      return value.RoundNum === v[1];
    });
    if (schedule) {
      setCurSchedule(schedule);
    }

    // @ts-ignore
    apiGetCompsResults(orgId, compId, ev.EventID, schedule.RoundNum).then((value) => {
      if (value === undefined || value.data === undefined) {
        return;
      }
      for (let i = 0; i < value.data.length; i++) {
        value.data[i].Rank -= 1;
      }
      setOneResults(value.data);
    });
  };

  const filterOption = (input: string, option?: { label?: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const getEventRoundNum = () => {
    if (!curEvent) {
      return 0;
    }

    const event = events.find((value) => {
      return value.id === curEvent?.EventID;
    });
    if (event === undefined) {
      return 0;
    }
    switch (event.base_route_typ) {
      case 1:
        return 1;
      case 2:
      case 3:
      case 4:
        return 3;
      case 5:
      case 6:
      case 7:
        return 5;
      case 8:
        return 1;
      case 9:
        return 2;
      case 10:
        return 3;
    }
    return 0;
  };

  const filedStyle = {
    width: 300,
  };
  const updateResultValue = (index: number, value: string) => {
    const updatedValues = [...inputValues];
    updatedValues[index] = value;
    setInputValues(updatedValues);
  };

  const parseTimeToSeconds = (time: string) => {
    if (time === 'DNF' || time === 'd' || time === 'D') {
      return -10000;
    }
    if (time === 'DNS') {
      return -10001;
    }

    // 解析纯秒数格式
    if (/^\d+(\.\d+)?$/.test(time)) {
      return parseFloat(time);
    }

    // 解析分+秒格式
    if (/^\d{1,2}[:：]\d{2}(\.\d+)?$/.test(time)) {
      const [minutes, seconds] = time.split(/[:：]/);
      return parseFloat(minutes) * 60 + parseFloat(seconds);
    }

    // 解析时+分+秒格式
    if (/^\d{1,2}[:：]\d{2}[:：]\d{3}(\.\d+)?$/.test(time)) {
      const [hours, minutes, seconds] = time.split(/[:：]/);
      return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
    }
    return -10000;
  };

  // 更新输出框的成绩，不符合的需要删除或更新
  const inputOneResultUpdate = (v: string, index: number) => {
    const value = v
      // .replace(/\s+/g, '')
      .replace(/：/g, ':') // 替换所有大写的"："为":"
      .replace(/。/g, '.'); // 替换所有大写的"。"为"."
    updateResultValue(index, value);

    // 确认是否是指定的格式
    if (!curEvent) {
      message.warning('请先选择项目', 2).then();
      return;
    }

    const reg0 = /^\d+\/\d+$/;

    const reg1 = /^(\d+(\.\d*)?)$/;
    const reg2 = /^(\d*[:|：]\d*\.{0,1}\d{0,3})$/;
    const reg3 = /^(\d*[:|：]\d*[:|：]\d*)$/;

    const event = events.find((value) => {
      return value.id === curEvent?.EventID;
    });
    if (!event) {
      message.warning('请先选择一个项目', 2).then();
      return;
    }
    if (isMultiBlindRoute(event.base_route_typ)) {
      const parts = parseMultiBlindParts(value);
      if (!parts) {
        if (value.trim() === "") return;
        if (value.includes("/") || value.includes(" ")) {
          void message.warning(`${value}不符合多盲格式`, 2);
        }
        return;
      }

      const { ratio, time } = parts;
      if (!reg0.test(ratio) || !checkResult(time)) {
        void message.warning(`${value}不符合多盲格式`, 2);
        return;
      }

      const sl = ratio.split("/");
      if (sl.length >= 2) {
        const num1 = Number(sl[0]);
        const num2 = Number(sl[1]);
        if (num2 < num1) {
          void message.warning(`${value}录入复原成绩个数不应大于尝试个数`, 2);
        }
      }
      return;
    }

    if (value === 'DNF' || value === 'DNS' || value === 'd' || value === 'D') {
      return;
    }

    // 确认是否符合时间格式
    // 时分秒 {number} : {number} : {number} . {number}
    // 分秒   {number} : {number} . {number}
    // 秒    {number} . {number}
    if (reg1.test(value) || reg2.test(value) || reg3.test(value)) {
      return;
    }
    message.warning(value + '不符合格式', 2).then();
  };

  const checkResult = (input: any): boolean => {
    const reg =
      /^((([0-1]?\d|2[0-3]):([0-5]?\d|60):([0-5]?\d|60)(\.\d{1,3})?)|(([0-5]?\d|60):([0-5]?\d|60)(\.\d{1,3})?)|([0-5]?\d(\.\d{1,3})?))$/;

    if (isNumber(input)) {
      return true;
    }

    if (input === 'DNF' || input === 'DNS' || input === 'D' || input === 'd') {
      return true;
    }

    return reg.test(input);
  };

  const onOneFinish = () => {
    if (!curPlayer) {
      message.warning('请选择一个玩家').then();
      return;
    }

    if (!curSchedule) {
      message.warning('请选择一个轮次').then();
      return;
    }

    const event = events.find((value) => {
      return value.id === curEvent?.EventID;
    });

    if (!event) {
      message.warning('请选择一个项目').then();
      return;
    }
    let results: number[] = [];

    const reg = /^\d+\/\d+$/;

    for (let i = 0; i < getEventRoundNum(); i++) {
      if (inputValues[i] === null || inputValues[i] === '' || inputValues[i] === undefined) {
        message.warning(`第${i + 1}个成绩未输入`).then();
        return;
      }
      if (isMultiBlindRoute(event.base_route_typ)) {
        const parts = parseMultiBlindParts(inputValues[i]);
        if (!parts || !reg.test(parts.ratio) || !checkResult(parts.time)) {
          void message.warning(`第${i + 1}个成绩格式不正确, 请按 a/b xx:yy:zz的格式录入`);
          return;
        }
        const [solved, attempted] = parts.ratio.split("/");
        results.push(Number(solved), Number(attempted), parseTimeToSeconds(parts.time));
        continue;
      }
      if (!checkResult(inputValues[i])) {
        message.warning(`第${i + 1}个成绩格式不正确`).then();
        return;
      }
      results.push(parseTimeToSeconds(inputValues[i]));
    }

    apiAddCompResults(orgId, compId, curEvent?.EventID, curSchedule?.RoundNum, results, curPlayer)
      .then(() => {
        message.success('成绩录入成功').then();
        updateRound(curRound);
        setInputValues([]);
      })
      .catch((value) => {
        message.error('成绩录入失败:' + value.response.data.error).then();
      });
  };

  const updateMultiPlayer = (v: any) => {
    if (v === undefined || v === '' || v === null) {
      setMultiResults([]);
      setCurPlayer(undefined);
      return;
    }

    apiGetCompsResultsWithPlayer(orgId, compId, v).then((value) => {
      if (value === undefined || value.data === undefined) {
        return;
      }
      setMultiResults(value.data);
    });
    setCurPlayer(v);
  };

  const updateMultiInput = (v: string) => {
    let slice = v.replaceAll('【', '[').replaceAll('】', ']').split('\n');
    slice = slice.filter((value) => {
      return value !== '';
    });

    let parserResults = [];

    for (let i = 0; i < slice.length; i++) {
      let line = slice[i]
        .replaceAll(',', ' ')
        .replaceAll('，', ' ')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll(' [', '[');

      const data = line.split(' ').filter((value) => {
        return value !== '';
      });

      if (data.length <= 1) {
        message.warning(`${slice[i]} 存在格式错误`).then();
        continue;
      }
      let oneLineStr = data[0];

      let result = {
        Index: i + 1,
        EventID: data[0],
        Round: 1,
        RoundNum: 1,
        Result: [] as number[],
        Error: '',
        EventRoute: 7,
      };

      if (oneLineStr.indexOf('[') !== -1) {
        const match = oneLineStr.match(/^([a-zA-Z0-9]+)\[(\d+)]$/);
        if (match) {
          result.EventID = match[1]; // 前面的数字
          result.Round = Number(match[2]); // 方括号内的数字
          result.RoundNum = Number(match[2]);
        }
      }
      const evs = events.find((value) => {
        if (result.EventID === '' || result.EventID === undefined) {
          return false;
        }
        if (
          value.id === result.EventID ||
          value.name === result.EventID ||
          value.cn === result.EventID
        ) {
          return true;
        }
        // 兼容中文名
        const otherNames = value.otherNames.split(';');
        for (let i = 0; i < otherNames.length; i++) {
          if (result.EventID === otherNames[i]) {
            return true;
          }
        }
        return false;
      });
      if (evs === undefined) {
        result.Error = '项目不存在';
        parserResults.push(result);
        continue;
      }
      result.EventRoute = evs.base_route_typ;
      result.EventID = evs.id;

      if (isMultiBlindRoute(evs.base_route_typ)) {
        const parts = parseMultiBlindParts(data.slice(1).join(" "));
        if (!parts) {
          result.Error = "成绩格式错误";
        } else if (!/^\d+\/\d+$/.test(parts.ratio) || !checkResult(parts.time)) {
          result.Error = "成绩格式不正确";
        } else {
          const [solved, attempted] = parts.ratio.split("/");
          result.Result.push(Number(solved), Number(attempted), parseTimeToSeconds(parts.time));
        }
      } else {
        for (let j = 1; j < data.length; j++) {
          if (!checkResult(data[j])) {
            result.Error = `${data[j]}成绩格式不正确`;
            break;
          }
          // @ts-ignore
          result.Result.push(parseTimeToSeconds(data[j]));
        }
      }
      console.log(result);
      // 获取项目轮次
      const compEv = comp.data.comp_json.Events.find((value) => {
        return value.EventID === evs.id;
      });
      if (compEv === undefined) {
        result.Error = '本次比赛未开放该项目';
        parserResults.push(result);
        continue;
      }
      // todo 轮次

      const schedule = compEv.Schedule.find((value) => {
        return value.RoundNum === result.Round;
      });
      if (schedule === undefined) {
        result.Error = '本次比赛未开放该轮次';
      } else {
        // @ts-ignore
        result.Round = schedule.Round;
      }
      parserResults.push(result);
    }
    setParserResults(parserResults);
  };

  const onMultiFinish = async () => {
    if (parserResults === undefined || parserResults.length === 0) {
      message.error('无成绩可提交').then();
      return;
    }

    if (!curPlayer) {
      message.error('请选择一个玩家').then();
      return;
    }

    for (let i = 0; i < parserResults.length; i++) {
      if (parserResults[i].Error) {
        message.error(`第${i + 1}个成绩存在: ${parserResults[i].Error}错误,请删除后再添加`).then();
        return;
      }
    }

    for (let i = 0; i < parserResults.length; i++) {
      const result = parserResults[i];
      await apiAddCompResults(
        orgId,
        compId,
        result.EventID,
        result.RoundNum,
        result.Result,
        curPlayer,
      )
        .then(() => {
          message.success(result.EventID + ' ' + result.Round + '成绩录入成功');
          updateRound(curRound);
          setInputValues([]);
        })
        .catch((value) => {
          message.error('成绩录入失败:' + value.response.data.error);
        });
    }

    setParserResults([]);
    updateMultiPlayer(curPlayer);
  };

  const deleteResultsColumn = {
    title: '操作',
    dataIndex: 'PersonName',
    key: 'PersonName',
    width: 100,
    render: (value: string, result: Result) => {
      const showConfirm = () => {
        Modal.warning({
          title: '是否删除成绩?',
          content: (
            <p>
              确认要执行对{result.PersonName}的{result.EventID}-{result.Round}成绩进行删除
            </p>
          ),
          okText: '删除',
          okButtonProps: {
            style: { backgroundColor: 'red', borderColor: 'red', color: 'white' }, // 自定义样式
          },
          async onOk() {
            await apiDeleteCompsResult(orgId, compId, result.id)
              .then(() => {
                message.info('成绩删除成功').then();
              })
              .catch((value) => {
                message.error('成绩删除失败:' + value.response.data.error).then();
              });
            updateMultiPlayer(curPlayer)
            updateRound(curRound);
          },
        });
      };
      return (
        <Button size={'small'} danger onClick={showConfirm}>
          删除
        </Button>
      );
    },
  };

  const onInputResult = () => {
    return (
      <>
        <Form onFinish={onOneFinish} labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
          <Card>
            <Form.Item label="选择轮次">
              <Cascader
                style={filedStyle}
                options={scheduleOpt}
                onChange={updateRound}
                placeholder="选择项目和轮次"
              />
            </Form.Item>
            <Form.Item label="选择选手">
              <Select
                style={filedStyle}
                placeholder="输入姓名或 CubeID 筛选已报名选手"
                value={curPlayer}
                onChange={(value) => {
                  setCurPlayer(value);
                }}
                options={playerOptions}
                optionFilterProp="label"
                filterOption={filterOption}
                allowClear={{ clearIcon: <CloseCircleOutlined style={{ color: "red" }} /> }}
                showSearch
              />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  <Tooltip
                    title={
                      <>
                        <p>成绩格式为: xx:yy:zz.www</p>
                        <p>可以输入DNF、DNS、D等代表成绩无效</p>
                        <p>多盲等以 a/b xx:yy:zz 格式录入（`/` 两侧可留空格）</p>
                      </>
                    }
                  >
                    <InfoCircleOutlined style={{ marginRight: 5, color: ADMIN_LEGACY.tooltipGold }} />
                  </Tooltip>
                  录入成绩
                </span>
              }
            >
              <Space orientation="vertical" size={7} style={filedStyle}>
                {Array.from({ length: getEventRoundNum() }, (_, index) => (
                  <Space.Compact key={`result${index + 1}`} block>
                    <Input
                      style={{ width: 44, textAlign: "center", pointerEvents: "none" }}
                      value={`${index + 1}`}
                      readOnly
                    />
                    <Input
                      name={`result${index + 1}`}
                      value={inputValues[index]}
                      placeholder="请输入成绩"
                      onChange={(e) => inputOneResultUpdate(e.target.value, index)}
                    />
                  </Space.Compact>
                ))}
              </Space>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
              <Button htmlType="submit">提交</Button>
            </Form.Item>
          </Card>
        </Form>

        {/*成绩列表*/}
        {curEvent && (
          <Card style={{ marginTop: 20 }}>
            <h1>
              {CubesCn(curEvent?.EventID)} {curSchedule?.Round}
            </h1>
            {ResultsTable(
              oneResults,
              ['Rank', 'CubeID', 'PersonName', 'Best', 'Average', 'Result'],
              undefined,
              [deleteResultsColumn],
            )}
          </Card>
        )}
      </>
    );
  };

  const multiInputResult = () => {
    return (
      <>
        <Form onFinish={onMultiFinish} labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
          <Card>
            <Form.Item label="选择选手">
              <Select
                style={filedStyle}
                allowClear={{ clearIcon: <CloseCircleOutlined style={{ color: "red" }} /> }}
                placeholder="输入姓名或 CubeID 筛选已报名选手"
                value={curPlayer}
                onChange={(value) => {
                  updateMultiPlayer(value);
                }}
                options={playerOptions}
                optionFilterProp="label"
                filterOption={filterOption}
                showSearch
              />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  <Tooltip
                    title={
                      <>
                        <p>录入: 333 1 2 3 4 5</p>
                        <p>允许多个成绩同时录入: 333 1 2 3 4 5 444 1 2 3 4 5, 以换行分割</p>
                        <p>允许DNF, DNS: 333 DNS DNF d s D</p>
                        <p>录入某个轮次的: 333[1] 1 2 3 4 5</p>
                        <p>注意, 请不要输入中文字符</p>
                      </>
                    }
                  >
                    <InfoCircleOutlined style={{ marginRight: 5, color: ADMIN_LEGACY.tooltipGold }} />
                  </Tooltip>
                  批量录入
                </span>
              }
            >
              <TextArea
                style={{ minHeight: 200 }}
                onChange={(e) => {
                  updateMultiInput(e.target.value);
                }}
              ></TextArea>
            </Form.Item>

            <Form.Item label="项目" style={{ width: '100%' }}>
              <Table
                dataSource={parserResults}
                rowKey="Index"
                // @ts-ignore
                columns={[
                  {
                    title: '序号',
                    dataIndex: 'Index',
                    key: 'Index',
                    width: 50,
                  },
                  {
                    title: '项目',
                    dataIndex: 'EventID',
                    key: 'EventID',
                    width: 100,
                    render: (value) => {
                      return (
                        <>
                          {CubeIcon(value, value, {})} {CubesCn(value)}
                        </>
                      );
                    },
                  },
                  {
                    title: '轮次',
                    dataIndex: 'Round',
                    key: 'Round',
                    width: 100,
                  },
                  {
                    title: '成绩',
                    dataIndex: 'Result',
                    key: 'Result',
                    render: (results: any[], result: any) => {
                      const data = resultStringPro(results, result.EventRoute);
                      return (
                        <>
                          {result.Error && <Alert title={result.Error} type="error" showIcon />}
                          <div className="cube_result_results_col">
                            {data.map((value: string, idx: number) => (
                              <span
                                key={idx}
                                className="cube_result_result_cell"
                                style={{ minWidth: "80px", display: "inline-block" }}
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    },
                  },
                ]}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }} // 启用横向滚动
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 4, span: 16 }} style={{ marginTop: 20 }}>
              <Button htmlType="submit">提交</Button>
            </Form.Item>
          </Card>
        </Form>
        {multiResults && (
          <Card style={{ marginTop: 20 }}>
            <h2>{curPlayer} 本场比赛成绩</h2>
            {ResultsTable(
              multiResults,
              ['EventName', 'Round', 'Best', 'Average', 'Result'],
              undefined,
              [deleteResultsColumn],
            )}
          </Card>
        )}
      </>
    );
  };

  const preResultColumns: ColumnsType<PreResult> = [
    {
      title: "项目",
      dataIndex: "EventID",
      key: "EventID",
      width: 80,
      render: (value: string, result: PreResult) => (
        <span style={{ minWidth: "80px", width: "80px", display: "inline-block" }}>
          {CubeIcon(result.EventID, result.EventID, {})} {CubesCn(value)}
        </span>
      ),
    },
    {
      title: "轮次",
      dataIndex: "Round",
      key: "Round",
      width: 80,
    },
    {
      title: "玩家名",
      dataIndex: "PersonName",
      key: "PersonName",
      width: 100,
      render: (value: string, result: PreResult) => (
        <>{PlayerLink(result.CubeID, value, "")}</>
      ),
    },
    {
      title: "CubeID",
      dataIndex: "CubeID",
      key: "CubeID",
      width: 120,
    },
    {
      title: "单次",
      dataIndex: "Best",
      key: "Best",
      width: 100,
      render: (results: number, result: PreResult) => {
        const m = eventRouteM(result.EventRoute);
        const inter = m.integer ? m.integer : false;

        if (m.repeatedly) {
          return <span className="cube_result_Best_col">{resultTimeString(results, true)}</span>;
        }
        return <span className="cube_result_Best_col">{resultTimeString(results, inter)}</span>;
      },
    },
    {
      title: "平均",
      dataIndex: "Average",
      key: "Average",
      width: 100,
      render: (results: number, result: PreResult) => {
        const m = eventRouteM(result.EventRoute);
        if (m.repeatedly) {
          return <span className="cube_result_Average_col">-</span>;
        }

        return (
          <span className="cube_result_Average_col">
            {resultTimeString(results, false, false, m.integer)}
          </span>
        );
      },
    },
    {
      title: "成绩",
      dataIndex: "Result",
      key: "Result",
      render: (results: number[], result: PreResult) => {
        const data = resultStringPro(results, result.EventRoute);
        return (
          <div className="cube_result_results_col">
            {data.map((value: string, idx: number) => (
              <span
                key={idx}
                className="cube_result_result_cell"
                style={{ minWidth: "80px", display: "inline-block" }}
              >
                {value}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "来源",
      dataIndex: "Source",
      key: "Source",
      width: 120,
    },
    {
      title: "状态",
      dataIndex: "Finish",
      key: "Finish",
      width: 100,
      render: (f: boolean) => {
        if (f) {
          return <Tag color={ADMIN_LEGACY.successGreen}>已审批</Tag>;
        }
        return <Tag color={ADMIN_LEGACY.pendingGold}>待审批</Tag>;
      },
    },
  ];

  const onPreResultSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setPreResultSelectedRowKeys(newSelectedRowKeys);
  };

  const preResultRowSelection: TableRowSelection<PreResult> = {
    selectedRowKeys: preResultSelectedRowKeys,
    onChange: onPreResultSelectChange,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };

  const onPreResultFinish = (ok: boolean) => {
    return () => {
      if (preResultSelectedRowKeys.length === 0) {
        void message.warning("你未选择任何成绩");
        return;
      }

      const color = ok ? ADMIN_LEGACY.actionLime : ADMIN_LEGACY.errorRed;

      let progress = 0;
      let startSend = false;

      Modal.confirm({
        title: ok ? "是否通过" : "是否驳回",
        content: (
          <>
            <p>{`确认要执行对 ${preResultSelectedRowKeys.length} 个成绩的${
              ok ? "通过" : "驳回"
            }操作?`}</p>
            {startSend && (
              <Progress percent={progress} status={progress === 100 ? "success" : "active"} />
            )}
          </>
        ),
        okText: ok ? "通过" : "驳回",
        okButtonProps: {
          style: { backgroundColor: color, borderColor: color, color: "white" },
        },
        async onOk() {
          startSend = true;
          for (let i = 0; i < preResultSelectedRowKeys.length; i++) {
            const k = preResultSelectedRowKeys[i];
            const res = preResults.find((value) => value.key === k);
            progress = (i * 100) / preResultSelectedRowKeys.length;

            if (res === undefined) {
              continue;
            }
            await apiApprovalCompsPreResult(orgId, compId, ok, res.id).catch((error) => {
              void message.error(
                `保存审批失败: ${res.EventID} - ${res.Round} / ${error.response.data.error}`,
              );
            });
          }

          void loadPreResults();
        },
      });
    };
  };

  const handlePreResultTableChange = (pagination: TablePaginationConfig) => {
    setPreResultPage(pagination.current ?? 1);
    setPreResultPageSize(pagination.pageSize ?? 20);
  };

  const preResultInputResult = () => {
    return (
      <>
        <Card>
          <div style={{ marginBottom: 16, overflow: "hidden" }}>
            <p style={{ display: "inline", fontWeight: 700, fontSize: 20 }}>录入审批</p>
            <Button
              danger
              onClick={onPreResultFinish(false)}
              style={{ float: "right", marginLeft: 20 }}
            >
              驳回
            </Button>
            <Button
              type="primary"
              onClick={onPreResultFinish(true)}
              style={{ float: "right", backgroundColor: ADMIN_LEGACY.actionLime }}
            >
              通过
            </Button>
          </div>
          <Table<PreResult>
            rowSelection={preResultRowSelection}
            size="small"
            columns={preResultColumns}
            dataSource={preResults}
            rowKey="id"
            loading={preResultLoading}
            rowClassName={rowClassNameWithStyleLines}
            pagination={{
              current: preResultPage,
              pageSize: preResultPageSize,
              total: preResultTotal,
              showQuickJumper: true,
            }}
            onChange={handlePreResultTableChange}
            scroll={{ x: "max-content" }}
            sticky
          />
        </Card>
      </>
    );
  };

  const items = [
    {
      key: 'one',
      label: '录入',
      children: onInputResult(),
    },
    {
      key: 'multi',
      label: '批量录入',
      children: multiInputResult(),
    },
    {
      key: 'pre_result',
      label: '录入审批',
      children: preResultInputResult(),
    },
  ];

  return (
    <>
      <h2>
        <center>{comp.data.Name} 成绩录入</center>
      </h2>

      <NavTabs
        type="line"
        items={items}
        tabsKey="input_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
      />
    </>
  );
}

export function OrganizersResultsPageView({
  orgId,
  compId,
}: {
  orgId?: string;
  compId?: string;
}) {
  return (
    <OrganizersGuard>
      {!orgId || !compId ? (
        <Text color="fg.muted">请从比赛列表进入成绩录入页面。</Text>
      ) : (
        <OrganizersResultsContent orgId={orgId} compId={compId} />
      )}
    </OrganizersGuard>
  );
}
