import type { Player, School, Team } from '@/pages/Tools/TeamMatch/types';
import { MAX_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { Button, Form, Input, Modal, Select, Space, Typography, message } from 'antd';
import React, { useEffect } from 'react';
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
  const [form] = Form.useForm();

  const playersBySchool = (sid: string) => players.filter((p) => p.schoolId === sid);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const [p0, p1, p2] = editing.playerIds;
      form.setFieldsValue({
        schoolId: editing.schoolId,
        name: editing.name,
        p0,
        p1,
        p2,
      });
    } else {
      form.resetFields();
    }
  }, [open, editing, form]);

  const handleOk = () => {
    void form.validateFields().then((v: { schoolId: string; name?: string; p0: string; p1: string; p2: string }) => {
      const ids = [v.p0, v.p1, v.p2].filter(Boolean);
      if (new Set(ids).size !== TEAM_PLAYERS) {
        message.warning('请选择 3 名不同选手');
        return;
      }
      if (ids.some((id) => usedPlayerIds.has(id))) {
        message.warning('所选选手已被其他队伍占用');
        return;
      }
      if (!editing && activeTeamCount >= MAX_TEAMS) {
        message.warning(`最多 ${MAX_TEAMS} 支有效队伍（可先删除部分队伍或在种子步骤将队伍标为缺席）`);
        return;
      }
      const school = schools.find((s) => s.id === v.schoolId);
      const base = {
        schoolId: v.schoolId,
        name: v.name?.trim() || school?.name || '队伍',
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
      width={520}
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
        每队须选同一学校下的 3 名未占用选手。
      </Typography.Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item name="schoolId" label="学校" rules={[{ required: true, message: '请选择学校' }]}>
          <Select options={schools.map((s) => ({ label: s.name, value: s.id }))} placeholder="选择学校" />
        </Form.Item>
        <Form.Item name="name" label="队名（可空，默认学校名）">
          <Input />
        </Form.Item>
        <Form.Item dependencies={['schoolId']} noStyle>
          {() => {
            const sid = form.getFieldValue('schoolId') as string | undefined;
            const opts = sid ? playersBySchool(sid) : [];
            return (
              <>
                <Form.Item name="p0" label="队员 1" rules={[{ required: true, message: '请选择队员' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={opts.map((p) => ({
                      label: p.name,
                      value: p.id,
                      disabled: usedPlayerIds.has(p.id),
                    }))}
                    placeholder={sid ? '选择队员' : '先选学校'}
                  />
                </Form.Item>
                <Form.Item name="p1" label="队员 2" rules={[{ required: true, message: '请选择队员' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={opts.map((p) => ({
                      label: p.name,
                      value: p.id,
                      disabled: usedPlayerIds.has(p.id),
                    }))}
                  />
                </Form.Item>
                <Form.Item name="p2" label="队员 3" rules={[{ required: true, message: '请选择队员' }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={opts.map((p) => ({
                      label: p.name,
                      value: p.id,
                      disabled: usedPlayerIds.has(p.id),
                    }))}
                  />
                </Form.Item>
              </>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TeamEditModal;
