import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import Markdown from '@/components/Markdown/Markdown';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { parseDateTime } from '@/utils/time/data_time';
import { Card, Descriptions, Table, Tag } from 'antd';
import React from 'react';
import '@wangeditor/editor/dist/css/style.css';
import {EditorView} from "@/components/Markdown/editer";

// 定义组件的属性类型
interface CompetitionDetailProps {
  comp?: CompAPI.CompResp;
}

const CompetitionDetail: React.FC<CompetitionDetailProps> = ({ comp }) => {
  let bodys: React.ReactNode[] = [];

  // 比赛类型 todo 抽
  const mp = {
    1: { GenreLabel: 'WCA', GenreColor: 'blue', wca: true },
    2: { GenreLabel: '线下正式赛', GenreColor: 'green' },
    3: { GenreLabel: '线上正式赛', GenreColor: 'red' },
    4: { GenreLabel: '线下赛', GenreColor: 'orange' },
    5: { GenreLabel: '线上赛', GenreColor: 'purple' },
  };
  const key = comp?.data.Genre + '';
  // @ts-ignore with mp[key]
  const { GenreLabel, GenreColor, wca } = mp[key] || {};
  //
  // return (
  //   <>
  //     <Tag color={color}>{label}</Tag>
  //     {icon && <img src={icon} alt="icon" style={{width: 16, marginRight: 8}}/>}
  //   </>
  // );

  // 比赛性质
  bodys.push(
    <div key={'__comps_detail_status_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <Descriptions column={1} title="比赛性质">
          <Descriptions.Item label="类型">
            {<Tag color={GenreColor}>{GenreLabel}</Tag>}
          </Descriptions.Item>

          {wca && (
            <Descriptions.Item label="认证">
              WCA认证
              <img
                src="https://cubing.com/f/images/wca.png"
                alt="wca_icon"
                style={{ width: 16, marginLeft: 8 }}
              />
            </Descriptions.Item>
          )}

          <Descriptions.Item label="成绩登记">
            {comp?.data.CanPreResult ? '可自行上传' : '主办录入'}
          </Descriptions.Item>

          <Descriptions.Item label="自动审批">
            {comp?.data.AutomaticReview ? '是' : '否'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>,
  );

  // 城市
  bodys.push(
    <div key={'__comps_detail_city_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <Descriptions column={1} title="赛场">
          <Descriptions.Item label="城市">{comp?.data.City}</Descriptions.Item>
          {/*<Descriptions.Item label="地点">*/}
          {/*  {"xxx市xxx区xxxx地点"}*/}
          {/*</Descriptions.Item>*/}
        </Descriptions>
      </Card>
    </div>,
  );

  // todo 这里需要主办团队
  if (comp?.data.OrganizersID) {
    bodys.push(
      <div key={'__comps_detail_org_key'}>
        <Card style={{ marginBottom: '20px' }}>
          <Descriptions column={1} title="主办团队">
            <Descriptions.Item label="主办">{comp.data.Org.Name}</Descriptions.Item>
            {comp.data.Org.Email && (
              <Descriptions.Item label="邮箱">{comp.data.Org.Email}</Descriptions.Item>
            )}
            {comp.data.Group.qq_groups && (
              <Descriptions.Item label="QQ">{comp.data.Group.qq_groups}</Descriptions.Item>
            )}
            {comp.data.Group.name && (
              <Descriptions.Item label="QQ群">{comp.data.Group.name}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>,
    );
  }

  // 比赛时间
  // todo 其他时间
  if (comp !== undefined) {
    bodys.push(
      <div key={'__comps_detail_times_key'}>
        <Card style={{ marginBottom: '20px' }}>
          <Descriptions column={1} title="比赛时间">
            <Descriptions.Item label="开赛时间">
              {[parseDateTime(comp.data.CompStartTime)]}
            </Descriptions.Item>

            <Descriptions.Item label="结束时间">
              {[parseDateTime(comp.data.CompEndTime)]}
            </Descriptions.Item>

            {comp?.data.RegistrationStartTime && (
              <Descriptions.Item label="报名开始时间">
                {[parseDateTime(comp?.data.RegistrationStartTime)]}
              </Descriptions.Item>
            )}

            {comp?.data.RegistrationEndTime && (
              <Descriptions.Item label="报名结束时间">
                {[parseDateTime(comp?.data.RegistrationEndTime)]}
              </Descriptions.Item>
            )}

            {comp?.data.RegistrationRestartTime && (
              <Descriptions.Item label="报名重开时间">
                {[parseDateTime(comp?.data.RegistrationRestartTime)]}
              </Descriptions.Item>
            )}

            {comp?.data.RegistrationCancelDeadlineTime && (
              <Descriptions.Item label="退赛截止时间">
                {[parseDateTime(comp?.data.RegistrationCancelDeadlineTime)]}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>,
    );
  }

  // 比赛人数
  bodys.push(
    <div key={'__comps_detail_person_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <Descriptions column={1} title="参赛人数">
          <Descriptions.Item label="最大限制数">{comp?.data.Count}</Descriptions.Item>
          <Descriptions.Item label="已报名人数">
            {comp?.data.RegisterNum ? comp?.data.RegisterNum : 0 + ' / ' + comp?.data.Count}
          </Descriptions.Item>
          <Descriptions.Item label="已参赛人数">{comp?.data.CompedNum}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>,
  );

  // 比赛项目
  const eventMin = comp?.data.EventMin.toString().split(';');
  const events = eventMin
    ? eventMin
        .filter((id) => id !== undefined && id !== '')
        .map((id, i) => CubeIcon(id, `comp_icon_key_${i}_${id}`, { marginLeft: '5px' }))
    : [];

  const eventsTable = [];
  if (comp !== undefined && comp.data.comp_json.Events !== undefined) {
    for (let i = 0; i < comp.data.comp_json.Events.length; i++) {
      const evs = comp.data.comp_json.Events[i];

      const event = {
        EventID: evs.EventID,
        Rounds: '-',
        Cols: '', // todo
      };

      // events
      if (evs.Schedule !== undefined) {
        // todo 暂时只有长度大小
        event.Rounds = evs.Schedule.length  + "轮"
      }
      eventsTable.push(event);
    }
  }

  bodys.push(
    <div key={'__comps_detail_events_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <Descriptions column={1} title="项目" key={'__comps_detail_events_key_Descriptions'}>
          <Descriptions.Item label="项目列表">{events}</Descriptions.Item>
          <Descriptions.Item label="项目简表">
            <Table
              dataSource={eventsTable}
              rowKey="EventID"
              // @ts-ignore
              columns={[
                {
                  title: '项目',
                  dataIndex: 'EventID',
                  key: 'EventID',
                  width: 135,
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
                  dataIndex: 'Rounds',
                  key: 'Rounds',
                  width: 100,
                },
                {
                  title: '费用',
                  dataIndex: 'Cols',
                  key: 'Cols',
                  render: () => {
                    return '0元';
                  },
                  width: 100,
                },
              ]}
              pagination={false}
              size="small"
              // scroll={{ x: 'max-content' }} // 启用横向滚动
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>,
  );

  bodys.push(
    <div key={'__comps_detail_other_key'}>
      <Card
        style={{
          borderRadius: 8,
          minWidth: '100%',
        }}
      >
        <Descriptions column={1} title="其他">
          <Markdown md={comp?.data.Illustrate} />
          {EditorView(comp?.data.IllustrateHTML ? comp.data.IllustrateHTML : '')}
        </Descriptions>
      </Card>
    </div>,
  );

  return <>{bodys}</>;
};

export default CompetitionDetail;
