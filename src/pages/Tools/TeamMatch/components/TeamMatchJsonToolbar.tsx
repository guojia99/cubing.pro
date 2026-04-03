import {
  buildTeamMatchJsonFile,
  downloadTeamMatchJson,
  parseTeamMatchImport,
} from '@/pages/Tools/TeamMatch/teamMatchJson';
import type { LiveUISettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { Button, Modal, Space, Typography, message } from 'antd';
import classNames from 'classnames';
import React, { useRef } from 'react';
import '../TeamMatch.less';

type Props = {
  session: TeamMatchSession;
  liveUISettings: LiveUISettings;
  onHydrate: (session: TeamMatchSession) => void;
  onImportLiveUI: (live: LiveUISettings) => void;
  /** 正赛全屏等深色底 */
  variant?: 'light' | 'dark';
};

const TeamMatchJsonToolbar: React.FC<Props> = ({
  session,
  liveUISettings,
  onHydrate,
  onImportLiveUI,
  variant = 'light',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dark = variant === 'dark';

  const exportJson = () => {
    const payload = buildTeamMatchJsonFile(session, liveUISettings);
    const base = (session.name.trim() || 'team-match').slice(0, 48);
    downloadTeamMatchJson(`${base}-${session.id.slice(0, 8)}`, payload);
    message.success('已导出 JSON');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      Modal.confirm({
        title: '确认导入',
        content: '将用文件中的比赛数据替换当前正在编辑的会话，并可选写入界面设置。',
        okText: '导入',
        cancelText: '取消',
        onOk: () => {
          try {
            const { session: next, liveUISettings: li } = parseTeamMatchImport(text);
            onHydrate(next);
            if (li) onImportLiveUI(li);
            message.success('已导入');
          } catch (err) {
            message.error(err instanceof Error ? err.message : '导入失败');
          }
        },
      });
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={classNames('tmJsonToolbar', { 'tmJsonToolbar--dark': dark })}
      role="region"
      aria-label="导入导出"
    >
      <Space wrap align="center" size="middle">
        <Typography.Text className={classNames('tmJsonToolbarLabel', { 'tmJsonToolbarLabel--dark': dark })}>
          备份
        </Typography.Text>
        <Button size="small" type={dark ? 'default' : 'default'} ghost={dark} onClick={exportJson}>
          导出 JSON
        </Button>
        <Button size="small" type={dark ? 'default' : 'default'} ghost={dark} onClick={() => inputRef.current?.click()}>
          导入 JSON
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={onFileChange}
        />
      </Space>
    </div>
  );
};

export default TeamMatchJsonToolbar;
