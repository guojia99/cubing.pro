import { UserKvUploadProgress } from '@/components/UserData/UserKvUploadProgress';
import { getUserKv, setUserKv } from '@/services/cubing-pro/user/user_kv';
import { CloudDownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography, message } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

export type UserCloudKvPanelProps = {
  kvKey: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  uploadButtonText: string;
  syncButtonText: string;
  userKvType?: number;
  /** 生成要上传到服务器的字符串 */
  getPayloadForUpload: () => string | Promise<string>;
  /** 将服务器拉回的原始字符串应用到本地（如写入 localStorage） */
  applyCloudPayload: (raw: string) => void | Promise<void>;
  /** i18n：上传成功 */
  uploadOkText?: string;
  /** i18n：同步成功 */
  syncOkText?: string;
};

/**
 * 个人云端 KV：上传 / 同步，统一进度条与错误提示
 */
export const UserCloudKvPanel: React.FC<UserCloudKvPanelProps> = ({
  kvKey,
  title,
  description,
  uploadButtonText,
  syncButtonText,
  userKvType = 3,
  getPayloadForUpload,
  applyCloudPayload,
  uploadOkText = '已上传',
  syncOkText = '已同步',
}) => {
  const [uploadPercent, setUploadPercent] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState<'upload' | 'sync' | null>(null);

  const handleUpload = async () => {
    setBusy('upload');
    setUploadPercent(0);
    try {
      const raw = await getPayloadForUpload();
      await setUserKv(kvKey, raw, userKvType, {
        onUploadProgress: (p) => setUploadPercent(p),
      });
      setUploadPercent(100);
      message.success(uploadOkText);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '上传失败');
      setUploadPercent(undefined);
    } finally {
      setBusy(null);
      setTimeout(() => setUploadPercent(undefined), 800);
    }
  };

  const handleSync = async () => {
    setBusy('sync');
    try {
      const rec = await getUserKv(kvKey);
      await applyCloudPayload(rec.value);
      message.success(syncOkText);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '同步失败');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }} title={title}>
      {description ? (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">{description}</Text>
        </div>
      ) : null}
      <Space wrap>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={busy === 'upload'}
          onClick={() => void handleUpload()}
        >
          {uploadButtonText}
        </Button>
        <Button icon={<CloudDownloadOutlined />} loading={busy === 'sync'} onClick={() => void handleSync()}>
          {syncButtonText}
        </Button>
      </Space>
      <div style={{ marginTop: 12 }}>
        <UserKvUploadProgress percent={uploadPercent} />
      </div>
    </Card>
  );
};
