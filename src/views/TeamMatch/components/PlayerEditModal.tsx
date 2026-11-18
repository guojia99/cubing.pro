import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
import AvatarUpload from '@/views/TeamMatch/components/AvatarUpload';
import type { Player, School } from '@/views/TeamMatch/types';
import { fetchWcaAvatarThumbUrl } from '@/views/TeamMatch/utils/wcaAvatar';
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
  const { t: tr, locale } = useTeamMatchI18n();
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
        battlecry: editing.battlecry ?? '',
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

  useEffect(() => {
    if (!open) return;
    const invalid = form.getFieldsError().filter(field => field.errors.length).map(field => field.name);
    if (invalid.length) void form.validateFields(invalid).catch(() => {});
  }, [locale, open, form]);

  const handleOk = () => {
    void form
      .validateFields()
      .then((v: { schoolId: string; name: string; wcaId: string; oneId: string; battlecry?: string }) => {
      const wca = v.wcaId?.trim() || null;
      const oneRaw = v.oneId?.trim() || '';
      const oneId = oneRaw === '' ? null : oneRaw;
      const base = {
        schoolId: v.schoolId,
        name: v.name.trim(),
        wcaId: wca,
        oneId,
        battlecry: (v.battlecry ?? '').trim(),
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
    }, () => {});
  };

  const handleFetchWcaAvatar = async () => {
    const wca = (form.getFieldValue('wcaId') as string | undefined)?.trim() ?? '';
    if (wca.length !== 10) {
      message.warning(tr('teamMatch.wcaIdRequired'));
      return;
    }
    if (wcaAvatarFetchedOnce) return;
    setWcaAvatarLoading(true);
    try {
      const url = await fetchWcaAvatarThumbUrl(wca);
      if (!url) {
        message.warning(tr('teamMatch.noWcaAvatar'));
        return;
      }
      setAvatarDraft(url);
      setWcaAvatarFetchedOnce(true);
      message.success(tr('teamMatch.wcaAvatarFetched'));
    } catch {
      message.error(tr('teamMatch.avatarFetchFailed'));
    } finally {
      setWcaAvatarLoading(false);
    }
  };

  return (
    <Modal
      className="tm-workbench-modal"
      title={editing ? tr('teamMatch.editPlayer') : tr('teamMatch.addPlayer')}
      open={open}
      onCancel={onClose}
      width={480}
      footer={
        <Space>
          <Button onClick={onClose}>{tr('teamMatch.cancel')}</Button>
          <Button type="primary" onClick={() => void handleOk()}>{tr('teamMatch.save')}</Button>
        </Space>
      }
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="schoolId" label={tr('teamMatch.school')} rules={[{ required: true, message: tr('teamMatch.selectSchoolRequired') }]}>
          <Select
            options={schools.map((s) => ({ label: s.name, value: s.id }))}
            placeholder={tr('teamMatch.selectSchool')}
          />
        </Form.Item>
        <Form.Item name="name" label={tr('teamMatch.name')} rules={[{ required: true, message: tr('teamMatch.nameRequired') }]}>
          <Input />
        </Form.Item>
        <Form.Item name="battlecry" label={tr('teamMatch.battlecryOptional')}>
          <Input.TextArea rows={2} placeholder={tr('teamMatch.battlecryHint')} maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="wcaId" label={tr('teamMatch.wcaIdOptional')} rules={[{
          validator: (_, value?: string) => !value?.trim() || value.trim().length === 10 ? Promise.resolve() : Promise.reject(new Error(tr('teamMatch.wcaIdValidation'))),
        }]}>
          <Input
            placeholder={tr('teamMatch.tenCharacters')}
            maxLength={10}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v !== initialWcaIdRef.current) setWcaAvatarFetchedOnce(false);
            }}
          />
        </Form.Item>
        <Form.Item name="oneId" label={tr('teamMatch.oneIdOptional')} rules={[{
          validator: (_, value?: string) => !value?.trim() || /^\d+$/.test(value.trim()) ? Promise.resolve() : Promise.reject(new Error(tr('teamMatch.oneIdValidation'))),
        }]}>
          <Input placeholder={tr('teamMatch.oneIdHint')} inputMode="numeric" />
        </Form.Item>
        <Form.Item label={tr('teamMatch.avatar')}>
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
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
                {wcaAvatarFetchedOnce ? tr('teamMatch.wcaAvatarFetched') : tr('teamMatch.fetchWcaAvatar')}
              </Button>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{tr('teamMatch.wcaAvatarHelp')}</Typography.Text>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PlayerEditModal;
