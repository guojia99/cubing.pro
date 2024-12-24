import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import Markdown from '@/components/Markdown/Markdown';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { parseDateTime } from '@/utils/time/data_time';
import { ProDescriptions } from '@ant-design/pro-components';
import { Card, Table, Tag } from 'antd';
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
        <ProDescriptions column={1} title="比赛性质">
          <ProDescriptions.Item label="类型">
            {<Tag color={GenreColor}>{GenreLabel}</Tag>}
          </ProDescriptions.Item>

          {wca && (
            <ProDescriptions.Item label="认证">
              WCA认证
              <img
                src="https://cubing.com/f/images/wca.png"
                alt="wca_icon"
                style={{ width: 16, marginLeft: 8 }}
              />
            </ProDescriptions.Item>
          )}

          <ProDescriptions.Item label="成绩登记">
            {comp?.data.CanPreResult ? '可自行上传' : '主办录入'}
          </ProDescriptions.Item>

          <ProDescriptions.Item label="自动审批">
            {comp?.data.AutomaticReview ? '是' : '否'}
          </ProDescriptions.Item>
        </ProDescriptions>
      </Card>
    </div>,
  );

  // 城市
  bodys.push(
    <div key={'__comps_detail_city_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <ProDescriptions column={1} title="赛场">
          <ProDescriptions.Item label="城市">{comp?.data.City}</ProDescriptions.Item>
          {/*<ProDescriptions.Item label="地点">*/}
          {/*  {"xxx市xxx区xxxx地点"}*/}
          {/*</ProDescriptions.Item>*/}
        </ProDescriptions>
      </Card>
    </div>,
  );

  // todo 这里需要主办团队
  if (comp?.data.OrganizersID) {
    bodys.push(
      <div key={'__comps_detail_org_key'}>
        <Card style={{ marginBottom: '20px' }}>
          <ProDescriptions column={1} title="主办团队">
            <ProDescriptions.Item label="主办">{comp.data.Org.Name}</ProDescriptions.Item>
            {comp.data.Org.Email && (
              <ProDescriptions.Item label="邮箱">{comp.data.Org.Email}</ProDescriptions.Item>
            )}
            {comp.data.Group.qq_groups && (
              <ProDescriptions.Item label="QQ">{comp.data.Group.qq_groups}</ProDescriptions.Item>
            )}
            {comp.data.Group.name && (
              <ProDescriptions.Item label="QQ群">{comp.data.Group.name}</ProDescriptions.Item>
            )}
          </ProDescriptions>
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
          <ProDescriptions column={1} title="比赛时间">
            <ProDescriptions.Item label="开赛时间">
              {[parseDateTime(comp.data.CompStartTime)]}
            </ProDescriptions.Item>

            <ProDescriptions.Item label="结束时间">
              {[parseDateTime(comp.data.CompEndTime)]}
            </ProDescriptions.Item>

            {comp?.data.RegistrationStartTime && (
              <ProDescriptions.Item label="报名开始时间">
                {[parseDateTime(comp?.data.RegistrationStartTime)]}
              </ProDescriptions.Item>
            )}

            {comp?.data.RegistrationEndTime && (
              <ProDescriptions.Item label="报名结束时间">
                {[parseDateTime(comp?.data.RegistrationEndTime)]}
              </ProDescriptions.Item>
            )}

            {comp?.data.RegistrationRestartTime && (
              <ProDescriptions.Item label="报名重开时间">
                {[parseDateTime(comp?.data.RegistrationRestartTime)]}
              </ProDescriptions.Item>
            )}

            {comp?.data.RegistrationCancelDeadlineTime && (
              <ProDescriptions.Item label="退赛截止时间">
                {[parseDateTime(comp?.data.RegistrationCancelDeadlineTime)]}
              </ProDescriptions.Item>
            )}
          </ProDescriptions>
        </Card>
      </div>,
    );
  }

  // 比赛人数
  bodys.push(
    <div key={'__comps_detail_person_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <ProDescriptions column={1} title="参赛人数" tooltip={'报名人数和参赛人数可能有延迟'}>
          <ProDescriptions.Item label="最大限制数">{comp?.data.Count}</ProDescriptions.Item>
          <ProDescriptions.Item label="已报名人数">
            {comp?.data.RegisterNum ? comp?.data.RegisterNum : 0 + ' / ' + comp?.data.Count}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="已参赛人数">{comp?.data.CompedNum}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>
    </div>,
  );

  // 比赛项目
  const eventMin = comp?.data.EventMin.toString().split(';');
  const events = [];
  if (eventMin) {
    for (let i = 0; i < eventMin.length; i++) {
      if (eventMin[i] === undefined || eventMin[i] === '') {
        continue;
      }
      let key = 'comp_icon_key' + '_' + i + '_' + eventMin[i];
      events.push(CubeIcon(eventMin[i], key, { marginLeft: '5px' }));
    }
  }

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
        <ProDescriptions column={1} title="项目" key={'__comps_detail_events_key_ProDescriptions'}>
          <ProDescriptions.Item label="项目列表">{events}</ProDescriptions.Item>
          <ProDescriptions.Item label="项目简表">
            <Table
              dataSource={eventsTable}
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
          </ProDescriptions.Item>
        </ProDescriptions>
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
        <ProDescriptions column={1} title="其他" tooltip="这里是主办编写的其他补充内容">
          <Markdown md={comp?.data.Illustrate} />
          {EditorView(comp?.data.IllustrateHTML ? comp.data.IllustrateHTML : '')}
        </ProDescriptions>
      </Card>
    </div>,
  );

  return <>{bodys}</>;
};

export default CompetitionDetail;
