import {
  applyWebsiteUiToDocument,
  layoutPatchFromWebsiteUi,
  readWebsiteUiFromStorage,
  writeWebsiteUiToStorage,
  type WebsiteUiConfig,
} from '@/utils/websiteUiConfig';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { useIntl, useModel } from '@umijs/max';
import React, { useEffect } from 'react';

/**
 * 顶栏：在浅色 / 深色之间切换（写入本地偏好，退出「跟随系统」）。
 * 当偏好为「跟随系统」时，监听系统配色变化以刷新布局。
 */
export const NavThemeSwitch: React.FC = () => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState');

  const isDark = initialState?.settings?.navTheme === 'realDark';

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const cfg = readWebsiteUiFromStorage();
      if (cfg.navTheme !== 'system') return;
      setInitialState((s: any) => ({
        ...s,
        settings: {
          ...s?.settings,
          ...layoutPatchFromWebsiteUi(cfg),
        },
      }));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setInitialState]);

  const handleChange = (checked: boolean) => {
    const prev = readWebsiteUiFromStorage();
    const next: WebsiteUiConfig = {
      ...prev,
      navTheme: checked ? 'realDark' : 'light',
    };
    writeWebsiteUiToStorage(next);
    applyWebsiteUiToDocument(next);
    setInitialState((s: any) => ({
      ...s,
      settings: {
        ...s?.settings,
        ...layoutPatchFromWebsiteUi(next),
      },
    }));
  };

  return (
    <Tooltip title={intl.formatMessage({ id: 'settings.navThemeSwitchTip' })}>
      <Switch
        size="small"
        checked={!!isDark}
        onChange={handleChange}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        aria-label={intl.formatMessage({ id: 'settings.navThemeSwitchTip' })}
      />
    </Tooltip>
  );
};
