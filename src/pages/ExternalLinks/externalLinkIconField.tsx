import type { OtherLink } from '@/services/cubing-pro/auth/typings';
import { AppstoreOutlined } from '@ant-design/icons';
import { Button, Input, Space } from 'antd';
import React, { useState } from 'react';
import { ExternalLinkIconMedia } from './externalLinkIconDisplay';
import { ExternalLinkIconPicker } from './externalLinkIconPicker';
import {
  ANTD_ICON_PREFIX,
  CUBE_ICON_PREFIX,
  FC_ICON_PREFIX,
  GI_ICON_PREFIX,
  LETTER_ICON_PREFIX,
  parsePrefixedIconKey,
} from './utils';

function isLibraryIconValue(v: string | undefined): boolean {
  const t = v?.trim();
  if (!t) return false;
  return (
    parsePrefixedIconKey(ANTD_ICON_PREFIX, t) !== null ||
    parsePrefixedIconKey(FC_ICON_PREFIX, t) !== null ||
    parsePrefixedIconKey(GI_ICON_PREFIX, t) !== null ||
    parsePrefixedIconKey(CUBE_ICON_PREFIX, t) !== null ||
    parsePrefixedIconKey(LETTER_ICON_PREFIX, t) !== null
  );
}

export type ExternalLinkIconFieldProps = {
  value?: string;
  onChange?: (v: string) => void;
  /** 用于预览优先级：有 URL 时先显示图片 */
  iconUrl?: string;
};

/** 管理端：弹窗选择图标 + 手动路径，写入 `icon` 字段 */
export const ExternalLinkIconField: React.FC<ExternalLinkIconFieldProps> = ({
  value,
  onChange,
  iconUrl,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const previewLink: Pick<OtherLink, 'icon' | 'icon_url'> = {
    icon: value ?? '',
    icon_url: iconUrl ?? '',
  };

  const manualOnly = !isLibraryIconValue(value);
  const manualValue = manualOnly ? (value ?? '') : '';

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap align="center">
        <ExternalLinkIconMedia link={previewLink} size="field" />
        <Button type="default" icon={<AppstoreOutlined />} onClick={() => setPickerOpen(true)}>
          从图标库选择…
        </Button>
      </Space>

      <ExternalLinkIconPicker
        open={pickerOpen}
        value={value}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(next) => {
          onChange?.(next);
          setPickerOpen(false);
        }}
      />

      <Input
        placeholder="或手动输入路径 / 完整 URL（写入 icon；与图标库二选一）"
        value={manualValue}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Space>
  );
};
