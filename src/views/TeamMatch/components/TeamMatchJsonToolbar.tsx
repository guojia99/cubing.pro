import {
  buildTeamMatchJsonFile,
  downloadTeamMatchJson,
  parseTeamMatchImport,
} from '@/views/TeamMatch/teamMatchJson';
import type { LiveUISettings } from '@/views/TeamMatch/liveUiSettings';
import type { TeamMatchSession } from '@/views/TeamMatch/types';
import { App, Button, Space, Typography } from 'antd';
import classNames from 'classnames';
import React, { useRef } from 'react';
import '../TeamMatch.css';
import { useTeamMatchI18n } from '../i18n';

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
  const { t, locale } = useTeamMatchI18n();
  const { modal, message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const dark = variant === 'dark';

  const exportJson = () => {
    const payload = buildTeamMatchJsonFile(session, liveUISettings);
    const base = (session.name.trim() || 'team-match').slice(0, 48);
    downloadTeamMatchJson(`${base}-${session.id.slice(0, 8)}`, payload);
    message.success(t('teamMatch.exported'));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      modal.confirm({
        className: 'tm-workbench-modal',
        title: t('teamMatch.confirmImport'),
        content: t('teamMatch.importDescription'),
        okText: t('teamMatch.import'),
        cancelText: t('teamMatch.cancel'),
        onOk: () => {
          try {
            const { session: next, liveUISettings: li } = parseTeamMatchImport(text, locale);
            onHydrate(next);
            if (li) onImportLiveUI(li);
            message.success(t('teamMatch.imported'));
          } catch (err) {
            message.error(err instanceof Error ? err.message : t('teamMatch.importFailed'));
          }
        },
      });
    };
    reader.onerror = () => message.error(t('teamMatch.readFailed'));
    reader.readAsText(file);
  };

  return (
    <div
      className={classNames('tmJsonToolbar', { 'tmJsonToolbar--dark': dark })}
      role="region"
      aria-label={t('teamMatch.importExport')}
    >
      <Space wrap align="center" size="middle">
        <Typography.Text className={classNames('tmJsonToolbarLabel', { 'tmJsonToolbarLabel--dark': dark })}>
          {t('teamMatch.backup')}
        </Typography.Text>
        <Button size="small" type={dark ? 'default' : 'default'} ghost={dark} onClick={exportJson}>
          {t('teamMatch.exportJson')}
        </Button>
        <Button size="small" type={dark ? 'default' : 'default'} ghost={dark} onClick={() => inputRef.current?.click()}>
          {t('teamMatch.importJson')}
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
