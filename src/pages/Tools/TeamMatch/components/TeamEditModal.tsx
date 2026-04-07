import type { Player, School, Team, TeamKind } from '@/pages/Tools/TeamMatch/types';
import { MAX_ROSTER_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { classifyTeamComposition, defaultTeamName, getFreelancerSchoolId } from '@/pages/Tools/TeamMatch/teamClassify';
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
        p0,
        p1,
        p2,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ teamMode: 'school' });
    }
  }, [open, editing, form]);

  const handleOk = () => {
    void form.validateFields().then((v: FormVals) => {
      const ids = [v.p0, v.p1, v.p2].filter(Boolean);
      if (new Set(ids).size !== TEAM_PLAYERS) {
        message.warning('请选择 3 名不同选手');
        return;
      }
      if (ids.some((id) => usedPlayerIds.has(id))) {
        message.warning('所选选手已被其他队伍占用');
        return;
      }
      if (!editing && activeTeamCount >= MAX_ROSTER_TEAMS) {
        message.warning(`最多 ${MAX_ROSTER_TEAMS} 支有效队伍（可先删除部分队伍或在队伍确认步骤将队伍标为缺席）`);
        return;
      }

      /** 尚无自由人池时自动补一条，便于自由人队分类与保存（名称默认「自由人」） */
      let schoolsForClassify = schools;
      if (!getFreelancerSchoolId(schools)) {
        const autoFl: School = { id: uuidv4(), name: '自由人', kind: 'freelancer' };
        schoolsForClassify = [...schools, autoFl];
      }

      const c = classifyTeamComposition([v.p0, v.p1, v.p2], players, schoolsForClassify);
      if (!c.ok) {
        message.warning(c.message);
        return;
      }
      if (v.teamMode === 'school' && c.kind !== 'school') {
        message.warning(
          '当前队员组合不符合学校队（需至少两名队员来自同一普通学校，且不能三人三校各一人）；请改为自由人队或调整队员',
        );
        return;
      }
      if (v.teamMode === 'freelancer' && c.kind !== 'freelancer') {
        message.warning('当前队员组合不符合自由人队；请改为学校队或调整队员');
        return;
      }

      const nameTrim = v.name?.trim();
      const name = nameTrim || defaultTeamName(c.kind, c.schoolId, schoolsForClassify);

      const base = {
        schoolId: c.schoolId,
        kind: c.kind,
        name,
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
    });
  };

  return (
    <Modal
      title={editing ? '编辑队伍' : '添加队伍'}
      open={open}
      onCancel={onClose}
      width={560}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => void handleOk()}>
            保存
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        <strong>学校队</strong>：至少两名队员来自同一所普通学校（可含其他校或自由人池选手作外援）。
        <strong>自由人队</strong>：如三人来自三所不同学校、或两名及以上挂靠自由人池等无法形成「同校两人」的组合。若尚未在「学校」步骤添加自由人池，保存自由人队时将<strong>自动创建</strong>默认「自由人」学校。自由人队
        <strong>不参与</strong>抽签中的同校首轮避战。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" initialValues={{ teamMode: 'school' as TeamKind }}>
        <Form.Item name="teamMode" label="组队类型" rules={[{ required: true }]}>
          <Radio.Group
            options={[
              { label: '学校队', value: 'school' },
              { label: '自由人队', value: 'freelancer' },
            ]}
          />
        </Form.Item>
        <Form.Item name="name" label="队名（可空，将按学校或自由人池自动默认）">
          <Input />
        </Form.Item>
        <Form.Item name="p0" label="队员 1" rules={[{ required: true, message: '请选择队员' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={playerOptions}
            placeholder="选择选手（不限学校）"
          />
        </Form.Item>
        <Form.Item name="p1" label="队员 2" rules={[{ required: true, message: '请选择队员' }]}>
          <Select showSearch optionFilterProp="label" options={playerOptions} placeholder="选择选手" />
        </Form.Item>
        <Form.Item name="p2" label="队员 3" rules={[{ required: true, message: '请选择队员' }]}>
          <Select showSearch optionFilterProp="label" options={playerOptions} placeholder="选择选手" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TeamEditModal;
