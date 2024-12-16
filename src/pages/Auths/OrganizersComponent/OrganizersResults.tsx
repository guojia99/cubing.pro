import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { Result } from '@/components/Data/types/result';
import { NavTabs } from '@/components/Tabs/nav_tabs';
import { Auth, checkAuth } from '@/pages/Auths/AuthComponents';
import {
  apiAddCompResults,
  apiGetAllPlayers,
  apiGetCompsResults,
  apiGetOrgComp,
  apiOrganizers,
} from '@/services/cubing-pro/auth/organizers';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { apiEvents } from '@/services/cubing-pro/events/events';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { useParams } from '@@/exports';
import { CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Cascader, Form, Input, Select, Space, Tooltip, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useEffect, useState } from 'react';

const { Option } = Select;

const OrganizersResults: React.FC = () => {
  const { orgId, compId } = useParams();

  const [org, setOrg] = useState<OrganizersAPI.OrganizersResp | null>(null);
  const [comp, setComp] = useState<CompAPI.CompResp | null>(null);
  const [players, setPlayers] = useState<PlayersAPI.Player[]>();
  const [curPlayer, setCurPlayer] = useState<any>();
  const [curSchedule, setCurSchedule] = useState<CompAPI.Schedule | null>(null);
  const [curEvent, setCurEvent] = useState<CompAPI.Event | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [scheduleOpt, setScheduleOpt] = useState<[]>();
  const [inputValues, setInputValues] = useState<string[]>(Array(5));
  const [curRound, setCurRound] = useState<any>();
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const [multiInput, setMultiInput] = useState<any>('');

  const user = checkAuth([Auth.AuthOrganizers]);
  if (user === null) {
    return <>无权限</>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
    // @ts-ignore
    apiGetAllPlayers(orgId, compId).then((value) => {
      setPlayers(value.data.items);
    });
  }, []);

  if (!comp || !org) {
    return <>loading</>;
  }
  if (comp.data.OrganizersID !== org.data.id) {
    return <>无权限</>;
  }

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
      setResults(value.data);
    });
  };

  const filterOption = (input: any, option: any) => {
    const searchText = input.toLowerCase();
    const optionText =
      option?.label?.toString().toLowerCase() || option?.children?.toString().toLowerCase() || '';

    return optionText.includes(searchText);
  };

  const getEventRoundNum = () => {
    if (!curEvent) {
      return 1;
    }
    switch (curEvent.EventRoute) {
      case 2:
      case 3:
      case 4:
        return 3;
      case 5:
      case 6:
      case 7:
        return 5;
      case 9:
        return 2;
      case 10:
        return 3;
    }
    return 1;
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
    if (time === 'DNF') {
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
  const inputResultUpdate = (v: string, index: number) => {
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
    if ([8, 9, 10].indexOf(event.base_route_typ) !== -1) {
      // 多轮项目
      if (value.indexOf(' ') !== -1) {
        const data = value.split(' ');
        const key1 = data[0];
        const key2 = data[1];

        if (!(reg0.test(key1) || reg1.test(key2) || reg2.test(key2) || reg3.test(key2))) {
          message.warning(value + '不符合多盲格式', 2).then();
        }

        const sl = key1.split('/');
        if (sl.length >= 2) {
          const num1 = Number(sl[0]);
          const num2 = Number(sl[1]);
          if (num2 < num1) {
            message.warning(value + '录入复原成绩个数不应大于尝试个数', 2).then();
          }
        }
        return;
      }
      return;
    }

    // 确认是否符合时间格式

    // 确认是否符合时间格式
    // 时分秒 {number} : {number} : {number} . {number}
    // 分秒   {number} : {number} . {number}
    // 秒    {number} . {number}
    if (reg1.test(value) || reg2.test(value) || reg3.test(value)) {
      return;
    }

    message.warning(value + '不符合格式', 2).then();
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
    const reg2 =
      /^((([0-1]?\d|2[0-3]):([0-5]?\d|60):([0-5]?\d|60)(\.\d{1,3})?)|(([0-5]?\d|60):([0-5]?\d|60)(\.\d{1,3})?)|([0-5]?\d(\.\d{1,3})?))$/;

    for (let i = 0; i < getEventRoundNum(); i++) {
      if (inputValues[i] === null || inputValues[i] === '' || inputValues[i] === undefined) {
        message.warning(`第${i + 1}个成绩未输入`).then();
        return;
      }
      if ([8, 9, 10].indexOf(event.base_route_typ) !== -1) {
        const sl = inputValues[i].split(' ');
        if (sl.length < 2 || !reg.test(sl[0]) || !reg2.test(sl[1])) {
          message.warning(`第${i + 1}个成绩格式不正确, 请按 a/b xx:yy:zz的格式录入`).then();
          return;
        }
        results.push(
          Number(sl[0].split('/')[0]),
          Number(sl[0].split('/')[1]),
          parseTimeToSeconds(sl[1]),
        );
        continue;
      }

      if (!reg2.test(inputValues[i]) && inputValues[i] !== 'DNF' && inputValues[i] !== 'DNS') {
        message.warning(`第${i + 1}个成绩格式不正确`).then();
        return;
      }
      results.push(parseTimeToSeconds(inputValues[i]));
    }

    console.log(inputValues, results);
    apiAddCompResults(orgId, compId, curEvent?.EventID, curSchedule?.RoundNum, results, curPlayer)
      .then(() => {
        message.success('成绩录入成功').then();
        updateRound(curRound);
        setInputValues([]);
      })
      .catch((value) => {
        message.error('成绩录入失败' + value).then();
      });
  };


  const playerHTML = () => {
    return (
      <Form.Item label="选择选手">
        <Select
          style={filedStyle}
          placeholder={'选择选手'}
          onChange={(value) => {
            setCurPlayer(value);
          }}
          filterOption={filterOption}
          clearIcon={<CloseCircleOutlined style={{ color: 'red' }} />}
          showSearch
          allowClear
        >
          {players?.map((player) => (
            <Option key={player.CubeID} value={player.CubeID}>
              {player.CubeID} - {player.Name}
            </Option>
          ))}
        </Select>
      </Form.Item>
    )
  }


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
            {playerHTML()}

            <Form.Item
              label={
                <span>
                  <Tooltip
                    title={
                      <>
                        <p>成绩格式为: xx:yy:zz.www</p>
                        <p>可以输入DNF、DNS、D等代表成绩无效</p>
                        <p>多盲等以 a/b xx:yy:zz 格式录入</p>
                      </>
                    }
                  >
                    <InfoCircleOutlined style={{ marginRight: 5, color: '#d5ad62' }} />
                  </Tooltip>
                  录入成绩
                </span>
              }
            >
              <Space direction="vertical" size={7} style={filedStyle}>
                {Array.from({ length: getEventRoundNum() }, (_, index) => (
                  <Input
                    key={`result${index + 1}`}
                    name={`result${index + 1}`}
                    addonBefore={`${index + 1}`}
                    value={inputValues[index]}
                    placeholder="请输入成绩"
                    onChange={(e) => inputResultUpdate(e.target.value, index)}
                  />
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
              results,
              ['Rank', 'CubeID', 'PersonName', 'Best', 'Average', 'Result'],
              undefined,
            )}
          </Card>
        )}
      </>
    );
  };
  const onMultiFinish = () => {};
  const multiInputResult = () => {
    return (
      <>
        <Form onFinish={onMultiFinish} labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
          <Card style={{ marginTop: 20 }}>
            {playerHTML()}
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
                    <InfoCircleOutlined style={{ marginRight: 5, color: '#d5ad62' }} />
                  </Tooltip>
                  批量录入
                </span>
              }
            >
              <TextArea
                onChange={(e) => {
                  setMultiInput(e.target.value);
                }}
              ></TextArea>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
              <Button htmlType="submit">提交</Button>
            </Form.Item>
          </Card>
        </Form>
        <Card style={{ marginTop: 20 }}>xxx</Card>
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
};

export default OrganizersResults;
