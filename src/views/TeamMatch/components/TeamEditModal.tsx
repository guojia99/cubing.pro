import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
import type { Player, School, Team, TeamKind } from '@/views/TeamMatch/types';
import { MAX_ROSTER_TEAMS, TEAM_PLAYERS } from '@/views/TeamMatch/types';
import { classifyTeamComposition, defaultTeamName, getFreelancerSchoolId } from '@/views/TeamMatch/teamClassify';
import { Button, Form, Input, Modal, Radio, Select, Space, Typography, message } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  open: boolean;
  onClose: () => void;
  /** null 为新增 */
  editing: Team | null;
  schools: School[];
  players: Player[];
  /** 已被其他队伍占用的选手 id（编辑当前队时排除本队） */
  usedPlayerIds: Set<string>;
  activeTeamCount: number;
  onSave: (team: Team) => void;
};

type FormVals = {
  teamMode: TeamKind;
  name?: string;
  battlecry?: string;
  p0: string;
  p1: string;
  p2: string;
};

const TeamEditModal: React.FC<Props> = ({
  open,
  onClose,
  editing,
  schools,
  players,
  usedPlayerIds,
  activeTeamCount,
  onSave,
}) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const [form] = Form.useForm<FormVals>();

  const playerOptions = useMemo(
    () =>
      players.map((p) => ({
        label: `${schools.find((s) => s.id === p.schoolId)?.name ?? '?'} · ${p.name}`,
        value: p.id,
        disabled: usedPlayerIds.has(p.id),
      })),
    [players, schools, usedPlayerIds],
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const [p0, p1, p2] = editing.playerIds;
      form.setFieldsValue({
        teamMode: editing.kind ?? 'school',
        name: editing.name,
        battlecry: editing.battlecry ?? '',
        p0,
        p1,
        p2,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ teamMode: 'school' });
    }
  }, [open, editing, form]);

  useEffect(() => {
    if (!open) return;
    const invalid = form.getFieldsError().filter(field => field.errors.length).map(field => field.name);
    if (invalid.length) void form.validateFields(invalid).catch(() => {});
  }, [locale, open, form]);

  const handleOk = () => {
    void form.validateFields().then((v: FormVals) => {
      const ids = [v.p0, v.p1, v.p2].filter(Boolean);
      if (new Set(ids).size !== TEAM_PLAYERS) {
        message.warning(tr('teamMatch.threeDifferentPlayers'));
        return;
      }
      if (ids.some((id) => usedPlayerIds.has(id))) {
        message.warning(tr('teamMatch.playerAlreadyAssigned'));
        return;
      }
      if (!editing && activeTeamCount >= MAX_ROSTER_TEAMS) {
        message.warning(tr('teamMatch.activeTeamLimit', { p0: MAX_ROSTER_TEAMS }));
        return;
      }

      /** 尚无自由人池时自动补一条，便于自由人队分类与保存（名称默认「自由人」） */
      let schoolsForClassify = schools;
      if (!getFreelancerSchoolId(schools)) {
        const autoFl: School = { id: uuidv4(), name: tr('teamMatch.independentPoolName'), kind: 'freelancer' };
        schoolsForClassify = [...schools, autoFl];
      }

      const c = classifyTeamComposition([v.p0, v.p1, v.p2], players, schoolsForClassify, locale);
      if (!c.ok) {
        message.warning(c.message);
        return;
      }
      if (v.teamMode === 'school' && c.kind !== 'school') {
        message.warning(
          tr('teamMatch.invalidSchoolTeam'),
        );
        return;
      }
      if (v.teamMode === 'freelancer' && c.kind !== 'freelancer') {
        message.warning(tr('teamMatch.invalidIndependentTeam'));
        return;
      }

      const nameTrim = v.name?.trim();
      const name = nameTrim || defaultTeamName(c.kind, c.schoolId, schoolsForClassify, locale);

      const base = {
        schoolId: c.schoolId,
        kind: c.kind,
        name,
        battlecry: (v.battlecry ?? '').trim(),
        playerIds: ids,
        disabled: editing?.disabled ?? false,
        isSeed: editing?.isSeed ?? false,
      };
      if (editing) {
        onSave({ ...editing, ...base });
      } else {
        onSave({
          id: uuidv4(),
          ...base,
        });
      }
      onClose();
    }, () => {});
  };

  return (
    <Modal
      className="tm-workbench-modal"
      title={editing ? tr('teamMatch.editTeam') : tr('teamMatch.addTeam')}
      open={open}
      onCancel={onClose}
      width={560}
      footer={
        <Space>
          <Button onClick={onClose}>{tr('teamMatch.cancel')}</Button>
          <Button type="primary" onClick={() => void handleOk()}>{tr('teamMatch.save')}</Button>
        </Space>
      }
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{tr('teamMatch.teamRulesHelp')}</Typography.Paragraph>
      <Form form={form} layout="vertical" initialValues={{ teamMode: 'school' as TeamKind }}>
        <Form.Item name="teamMode" label={tr('teamMatch.teamType')} rules={[{ required: true }]}>
          <Radio.Group
            options={[
              { label: tr('teamMatch.schoolTeam'), value: 'school' },
              { label: tr('teamMatch.independentTeam'), value: 'freelancer' },
            ]}
          />
        </Form.Item>
        <Form.Item name="name" label={tr('teamMatch.teamNameOptional')}>
          <Input />
        </Form.Item>
        <Form.Item name="battlecry" label={tr('teamMatch.battlecryOptional')}>
          <Input.TextArea rows={2} placeholder={tr('teamMatch.battlecryHint')} maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="p0" label={tr('teamMatch.memberOne')} rules={[{ required: true, message: tr('teamMatch.selectMemberRequired') }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={playerOptions}
            placeholder={tr('teamMatch.selectAnyPlayer')}
          />
        </Form.Item>
        <Form.Item name="p1" label={tr('teamMatch.memberTwo')} rules={[{ required: true, message: tr('teamMatch.selectMemberRequired') }]}>
          <Select showSearch optionFilterProp="label" options={playerOptions} placeholder={tr('teamMatch.selectPlayer')} />
        </Form.Item>
        <Form.Item name="p2" label={tr('teamMatch.memberThree')} rules={[{ required: true, message: tr('teamMatch.selectMemberRequired') }]}>
          <Select showSearch optionFilterProp="label" options={playerOptions} placeholder={tr('teamMatch.selectPlayer')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TeamEditModal;
