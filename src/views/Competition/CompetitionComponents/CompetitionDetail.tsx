import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import Markdown from '@/components/Markdown/Markdown';
import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { parseDateTime } from '@/utils/time/data_time';
import { beijingDate, competitionWindow, isGroupCompetition } from '@/lib/groupCompetition';
import { Card, Descriptions, Table, Tag } from 'antd';
import React from 'react';
import '@wangeditor/editor/dist/css/style.css';
import {EditorView} from "@/components/Markdown/editer";
import { useI18n } from '@/contexts/I18nProvider';

// 定义组件的属性类型
interface CompetitionDetailProps {
  comp?: CompAPI.CompResp;
}

const CompetitionDetail: React.FC<CompetitionDetailProps> = ({ comp }) => {
  const { t, tf, locale } = useI18n();
  let bodys: React.ReactNode[] = [];

  // 比赛类型 todo 抽
  const mp = {
    1: { GenreLabel: 'WCA', GenreColor: 'blue', wca: true },
    2: { GenreLabel: t('competitionAdmin.officialOffline'), GenreColor: 'green' },
    3: { GenreLabel: t('competitionAdmin.officialOnline'), GenreColor: 'red' },
    4: { GenreLabel: t('competitionAdmin.offline'), GenreColor: 'orange' },
    5: { GenreLabel: t('competitionAdmin.online'), GenreColor: 'purple' },
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
        <Descriptions column={1} title={t('competitionAdmin.nature')}>
          <Descriptions.Item label={t('competitionAdmin.type')}>
            {<Tag color={GenreColor}>{GenreLabel}</Tag>}
          </Descriptions.Item>
          {comp && isGroupCompetition(comp.data) && <Descriptions.Item label={t('competitionAdmin.status')}>
            {comp.data.Status === 'Running'
              ? t(comp.data.IsDone || Date.now() >= competitionWindow(comp.data).end
                ? 'competitionAdmin.ended'
                : Date.now() < competitionWindow(comp.data).start ? 'competitionAdmin.upcoming' : 'competitionAdmin.ongoing')
              : t(({ Reviewing: 'competitionAdmin.reviewing', Reject: 'competitionAdmin.rejected', Temporary: 'competitionAdmin.draft', Ban: 'competitionAdmin.banned' } as const)[comp.data.Status as 'Reviewing' | 'Reject' | 'Temporary' | 'Ban'] ?? 'competitionAdmin.other')}
          </Descriptions.Item>}

          {wca && (
            <Descriptions.Item label={t('competitionAdmin.certification')}>
              {t('competitionAdmin.wcaCertified')}
              <img
                src="/images/wca.svg"
                alt="WCA"
                style={{ width: 16, marginLeft: 8 }}
              />
            </Descriptions.Item>
          )}

          <Descriptions.Item label={t('competitionAdmin.resultEntry')}>
            {t(comp?.data.CanPreResult ? 'competitionAdmin.selfUpload' : 'competitionAdmin.organizerEntry')}
          </Descriptions.Item>

          <Descriptions.Item label={t('competitionAdmin.autoReview')}>
            {t(comp?.data.AutomaticReview ? 'competitionAdmin.yes' : 'competitionAdmin.no')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>,
  );

  // 城市
  bodys.push(
    <div key={'__comps_detail_city_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <Descriptions column={1} title={t('competitionAdmin.venue')}>
          <Descriptions.Item label={t('competitionAdmin.city')}>{comp?.data.City}</Descriptions.Item>
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
          <Descriptions column={1} title={t('competitionAdmin.organizerTeam')}>
            <Descriptions.Item label={t('competitionAdmin.organizer')}>{comp.data.Org.Name}</Descriptions.Item>
            {comp.data.Org.Email && (
              <Descriptions.Item label={t('competitionAdmin.email')}>{comp.data.Org.Email}</Descriptions.Item>
            )}
            {comp.data.Group.qq_groups && (
              <Descriptions.Item label="QQ">{comp.data.Group.qq_groups}</Descriptions.Item>
            )}
            {comp.data.Group.name && (
              <Descriptions.Item label={t('competitionAdmin.qqGroup')}>{comp.data.Group.name}</Descriptions.Item>
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
          <Descriptions column={1} title={t('competitionAdmin.competitionTimes')}>
            <Descriptions.Item label={t(isGroupCompetition(comp.data) ? 'competitionAdmin.startBeijing' : 'competitionAdmin.startTime')}>
              {isGroupCompetition(comp.data) ? `${beijingDate(comp.data.CompStartTime)} 00:00` : parseDateTime(comp.data.CompStartTime)}
            </Descriptions.Item>

            <Descriptions.Item label={t(isGroupCompetition(comp.data) ? 'competitionAdmin.endBeijing' : 'competitionAdmin.endTime')}>
              {isGroupCompetition(comp.data) ? tf('competitionAdmin.inclusiveDay', { date: beijingDate(comp.data.CompEndTime) }) : parseDateTime(comp.data.CompEndTime)}
            </Descriptions.Item>

            {comp?.data.RegistrationStartTime && (
              <Descriptions.Item label={t('competitionAdmin.registrationStart')}>
                {[parseDateTime(comp?.data.RegistrationStartTime)]}
              </Descriptions.Item>
            )}

            {comp?.data.RegistrationEndTime && (
              <Descriptions.Item label={t('competitionAdmin.registrationEnd')}>
                {[parseDateTime(comp?.data.RegistrationEndTime)]}
              </Descriptions.Item>
            )}

            {comp?.data.RegistrationRestartTime && (
              <Descriptions.Item label={t('competitionAdmin.registrationRestart')}>
                {[parseDateTime(comp?.data.RegistrationRestartTime)]}
              </Descriptions.Item>
            )}

            {comp?.data.RegistrationCancelDeadlineTime && (
              <Descriptions.Item label={t('competitionAdmin.withdrawalDeadline')}>
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
        <Descriptions column={1} title={t('competitionAdmin.competitorCount')}>
          <Descriptions.Item label={t('competitionAdmin.competitorLimit')}>{comp?.data.Count}</Descriptions.Item>
          <Descriptions.Item label={t('competitionAdmin.registeredCount')}>
            {comp?.data.RegisterNum ? comp?.data.RegisterNum : 0 + ' / ' + comp?.data.Count}
          </Descriptions.Item>
          <Descriptions.Item label={t('competitionAdmin.competedCount')}>{comp?.data.CompedNum}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>,
  );

  // 比赛项目
  const eventMin = comp?.data.EventMin.toString().split(';');
  const events = eventMin
    ? eventMin
        .filter((id) => id !== undefined && id !== '')
        .map((id, i) => CubeIcon(id, `comp_icon_key_${i}_${id}`, { marginLeft: '5px' }, locale))
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
        event.Rounds = tf('competitionAdmin.roundsCount', { count: evs.Schedule.length });
      }
      eventsTable.push(event);
    }
  }

  bodys.push(
    <div key={'__comps_detail_events_key'}>
      <Card style={{ marginBottom: '20px' }}>
        <Descriptions column={1} title={t('competitionAdmin.event')} key={'__comps_detail_events_key_Descriptions'}>
          <Descriptions.Item label={t('competitionAdmin.eventList')}>{events}</Descriptions.Item>
          <Descriptions.Item label={t('competitionAdmin.eventSummary')}>
            <Table
              dataSource={eventsTable}
              rowKey="EventID"
              // @ts-ignore
              columns={[
                {
                  title: t('competitionAdmin.event'),
                  dataIndex: 'EventID',
                  key: 'EventID',
                  width: 135,
                  render: (value) => {
                    return (
                      <>
                        {CubeIcon(value, value, {}, locale)} {CubesCn(value, locale)}
                      </>
                    );
                  },
                },
                {
                  title: t('competitionAdmin.round'),
                  dataIndex: 'Rounds',
                  key: 'Rounds',
                  width: 100,
                },
                {
                  title: t('competitionAdmin.fee'),
                  dataIndex: 'Cols',
                  key: 'Cols',
                  render: () => {
                    return t('competitionAdmin.zeroYuan');
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
          borderRadius: 'var(--radius-card, 1rem)',
          minWidth: '100%',
        }}
      >
        <Descriptions column={1} title={t('competitionAdmin.other')}>
          <Markdown md={comp?.data.Illustrate} />
          {EditorView(comp?.data.IllustrateHTML ? comp.data.IllustrateHTML : '')}
        </Descriptions>
      </Card>
    </div>,
  );

  return <div className="competition-detail-grid">{bodys}</div>;
};

export default CompetitionDetail;
