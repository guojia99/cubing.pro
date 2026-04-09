import { Progress } from 'antd';
import React from 'react';

export type UserKvUploadProgressProps = {
  /** 0–100，为 undefined 时不展示 */
  percent?: number;
  status?: 'active' | 'success' | 'exception';
};

/**
 * 个人 KV 上传等场景共用的进度条（Ant Design Progress 薄封装）
 */
export const UserKvUploadProgress: React.FC<UserKvUploadProgressProps> = ({
  percent,
  status = 'active',
}) => {
  if (percent === undefined) {
    return null;
  }
  return (
    <Progress
      percent={percent}
      size="small"
      status={percent >= 100 ? 'success' : status === 'exception' ? 'exception' : 'active'}
      style={{ maxWidth: 360 }}
    />
  );
};
