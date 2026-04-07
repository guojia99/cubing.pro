import AvatarUpload from '@/pages/Tools/TeamMatch/components/AvatarUpload';
import type { Player, School } from '@/pages/Tools/TeamMatch/types';
import { fetchWcaAvatarThumbUrl } from '@/pages/Tools/TeamMatch/utils/wcaAvatar';
import { Button, Form, Input, Modal, Select, Space, Typography, message } from 'antd';
import React, { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  open: boolean;
  onClose: () => void;
  /** null 表示新增 */
  editing: Player | null;
  schools: School[];
  onSave: (player: Player) => void;
};

const PlayerEditModal: React.FC<Props> = ({ open, onClose, editing, schools, onSave }) => {
  const [form] = Form.useForm();
  const [avatarDraft, setAvatarDraft] = React.useState<string | null>(null);
  /** 本次弹窗内已成功拉取过 WCA 头像，避免重复请求；WCA ID 变化或清空头像时重置 */
  const [wcaAvatarFetchedOnce, setWcaAvatarFetchedOnce] = React.useState(false);
  const [wcaAvatarLoading, setWcaAvatarLoading] = React.useState(false);
  /** 打开弹窗时的 WCA ID，用于判断用户是否改过（避免与初始值比较时误重置） */
  const initialWcaIdRef = React.useRef<string>('');
  const wcaIdWatch = Form.useWatch('wcaId', form);
  const wcaIdLen = ((wcaIdWatch as string | undefined)?.trim()?.length ?? 0);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const wid = (editing.wcaId ?? '').trim();
      initialWcaIdRef.current = wid;
      form.setFieldsValue({
        schoolId: editing.schoolId,
        name: editing.name,
        wcaId: editing.wcaId ?? '',
        oneId: editing.oneId ?? '',
      });
      setAvatarDraft(editing.avatarDataUrl);
      const u = editing.avatarDataUrl;
      setWcaAvatarFetchedOnce(
        !!(
          u &&
          /^https?:\/\//i.test(u) &&
          u.includes('avatars.worldcubeassociation.org')
        ),
      );
    } else {
      initialWcaIdRef.current = '';
      form.resetFields();
      setAvatarDraft(null);
      setWcaAvatarFetchedOnce(false);
    }
  }, [open, editing, form]);

  const handleOk = () => {
    void form
      .validateFields()
      .then((v: { schoolId: string; name: string; wcaId: string; oneId: string }) => {
      const wca = v.wcaId?.trim() || null;
      if (wca && wca.length !== 10) {
        form.setFields([{ name: 'wcaId', errors: ['WCA ID 须为 10 位或留空'] }]);
        return;
      }
      const oneRaw = v.oneId?.trim() || '';
      const oneId = oneRaw === '' ? null : oneRaw;
      if (oneId && !/^\d+$/.test(oneId)) {
        form.setFields([{ name: 'oneId', errors: ['One ID 须为数字或留空'] }]);
        return;
      }
      const base = {
        schoolId: v.schoolId,
        name: v.name.trim(),
        wcaId: wca,
        oneId,
      };
      if (!base.name) return;
      if (editing) {
        onSave({
          ...editing,
          ...base,
          avatarDataUrl: avatarDraft,
        });
      } else {
        onSave({
          id: uuidv4(),
          ...base,
          avatarDataUrl: avatarDraft,
        });
      }
      onClose();
    });
  };

  const handleFetchWcaAvatar = async () => {
    const wca = (form.getFieldValue('wcaId') as string | undefined)?.trim() ?? '';
    if (wca.length !== 10) {
      message.warning('请先填写 10 位 WCA ID');
      return;
    }
    if (wcaAvatarFetchedOnce) return;
    setWcaAvatarLoading(true);
    try {
      const url = await fetchWcaAvatarThumbUrl(wca);
      if (!url) {
        message.warning('WCA 资料中未找到头像');
        return;
      }
      setAvatarDraft(url);
      setWcaAvatarFetchedOnce(true);
      message.success('已获取 WCA 头像');
    } catch {
      message.error('获取失败，请检查网络或 WCA ID');
    } finally {
      setWcaAvatarLoading(false);
    }
  };

  return (
    <Modal
      title={editing ? '编辑选手' : '新增选手'}
      open={open}
      onCancel={onClose}
      width={480}
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
      <Form form={form} layout="vertical">
        <Form.Item name="schoolId" label="学校" rules={[{ required: true, message: '请选择学校' }]}>
          <Select
            options={schools.map((s) => ({ label: s.name, value: s.id }))}
            placeholder="选择学校"
          />
        </Form.Item>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="wcaId" label="WCA ID（可选）">
          <Input
            placeholder="10 位"
            maxLength={10}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v !== initialWcaIdRef.current) setWcaAvatarFetchedOnce(false);
            }}
          />
        </Form.Item>
        <Form.Item name="oneId" label="One ID（可选）">
          <Input placeholder="数字 uid，用于拉取 One 平台成绩" inputMode="numeric" />
        </Form.Item>
        <Form.Item label="头像">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <AvatarUpload
              value={avatarDraft}
              onChange={(url) => {
                setAvatarDraft(url);
                if (!url) setWcaAvatarFetchedOnce(false);
                else if (url.startsWith('data:')) setWcaAvatarFetchedOnce(false);
              }}
            />
            <Space wrap align="center">
              <Button
                size="small"
                loading={wcaAvatarLoading}
                disabled={wcaAvatarFetchedOnce || wcaIdLen !== 10}
                onClick={() => void handleFetchWcaAvatar()}
              >
                {wcaAvatarFetchedOnce ? '已获取 WCA 头像' : '获取 WCA 头像'}
              </Button>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                与首页致谢栏相同：调用 WCA API 读取缩略图地址，不会自动拉取；成功一次后请改 WCA ID 或清空头像可再次获取。
              </Typography.Text>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PlayerEditModal;
