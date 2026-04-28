import { Footer, AvatarDropdown, AvatarName } from '@/components';
import { TokenCallbackHandler } from '@/components/TokenCallbackHandler';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { Link } from '@umijs/max';
import React from 'react';
import { currentUser } from '@/services/cubing-pro/auth/auth';
import { saveToken } from '@/services/cubing-pro/auth/token';
import defaultSettings from '../config/defaultSettings';
import { HomeOutlined, UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { AvatarProps, ConfigProvider, theme as antdTheme } from 'antd';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { AvatarURL } from '@/pages/Admin/AvatarDropdown';
import { AuthAPI } from '@/services/cubing-pro/auth/typings';
import LanguageSelect from '@/locales/Language/LanguageSelect';
import { ExtAppList } from '@/services/layout_config';
import { NavThemeSwitch } from '@/components/NavThemeSwitch';
import { Request } from '@/services/cubing-pro/request';
import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { USER_KV_KEYS } from '@/services/cubing-pro/user/user_kv';
import {
  applyWebsiteUiToDocument,
  layoutPatchFromWebsiteUi,
  readWebsiteUiFromStorage,
  writeWebsiteUiToStorage,
  type WebsiteUiConfig,
} from '@/utils/websiteUiConfig';

/**
 * 在获取用户前处理 WCA 回调的 token（必须在 getInitialState 最开头执行）
 * 否则 currentUser() 调用时 localStorage 中还没有 token
 */
function processWcaCallbackToken() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const tokenStr = params.get('token');
  if (tokenStr) {
    saveToken({ token: tokenStr, expire: '', status: '' });
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
  }
}

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: AuthAPI.CurrentUser;
  fetchUserInfo?: () => Promise<{ data: AuthAPI.CurrentUser } | undefined>;
}> {
  // 必须在 currentUser() 之前处理 URL 中的 token，否则获取用户会失败
  processWcaCallbackToken();

  const fetchUserInfo = async () => {
    let currentUserValue: AuthAPI.CurrentUser;
    await currentUser()
      .then((value) => {
        // @ts-ignore
        currentUserValue = value.data;
      })
      .catch((e) => {
        console.log(e);
      });
    // @ts-ignore
    return currentUserValue;
  };

  const mergedSettings = {
    ...(defaultSettings as Partial<LayoutSettings>),
    ...layoutPatchFromWebsiteUi(readWebsiteUiFromStorage()),
  } as Partial<LayoutSettings>;
  applyWebsiteUiToDocument(readWebsiteUiFromStorage());

  const cu = await fetchUserInfo();
  if (cu?.data?.id) {
    const tryKeys = [USER_KV_KEYS.website_ui_config, USER_KV_KEYS.websize_ui_config];
    for (const kvKey of tryKeys) {
      try {
        const r = await Request.get<{ data: { value?: string; Value?: string } }>(
          `/user/kv/${encodeURIComponent(kvKey)}`,
          { headers: AuthHeader() },
        );
        const inner = r.data?.data;
        const raw = inner?.value ?? inner?.Value;
        if (raw) {
          const cfg = JSON.parse(raw) as WebsiteUiConfig;
          writeWebsiteUiToStorage(cfg);
          Object.assign(mergedSettings as object, layoutPatchFromWebsiteUi(cfg));
          applyWebsiteUiToDocument(cfg);
          break;
        }
      } catch {
        // 未配置或 404，尝试下一键名
      }
    }
  }

  return {
    settings: mergedSettings as Partial<LayoutSettings>,
    currentUser: cu,
    // @ts-ignore
    fetchUserInfo: currentUser,
  };
}

// startTokenRefresh();

// ProLayout 支持的api https://procomponents.ant.design/components/layout
// @ts-ignore
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  let icon: JSX.Element | undefined = <UserSwitchOutlined />;
  if (initialState?.currentUser?.data.Avatar) {
    icon = undefined;
  } else if (initialState?.currentUser?.data.id) {
    icon = <UserOutlined />;
  }
  return {
    fixSiderbar: true,
    siderMenuType: 'sub',
    disableMobile: false, // 支持手机端
    siderWidth: 280, // 手机端抽屉宽度，确保子菜单有足够空间
    contentWidth: 'Fluid',
    // PC 端维持原样；手机端抽屉：logo+标题可点击回主页，并显示主页 icon
    menuHeaderRender: (logoDom, titleDom, props) =>
      props?.isMobile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'inherit' }}>
            {logoDom}
            {titleDom}
          </Link>
          <Link
            to="/"
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 18,
            }}
            aria-label="回到主页"
          >
            <HomeOutlined />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', minHeight: 22, gap: 6 }}>
          {logoDom}
          {titleDom}
        </div>
      ),
    contentStyle: {
      margin: 0,
      padding: 0,
    },

    // 标准配置
    avatarProps: {
      src: AvatarURL(initialState?.currentUser?.data.Avatar),
      icon: icon,
      title: <AvatarName />,
      render: (_: AvatarProps, avatarChildren: React.ReactNode) => {
        return (
          <>
            <AvatarDropdown menu={initialState?.currentUser?.data.id !== 0}>
              {avatarChildren}
            </AvatarDropdown>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginInlineEnd: 8 }}>
              <NavThemeSwitch />
            </span>
            <LanguageSelect />
          </>
        );
      },
    },
    appList: ExtAppList(),
    footerRender: () => <Footer />,
    childrenRender: (children) => {
      const contentDark = initialState?.settings?.navTheme === 'realDark';
      return (
        <ConfigProvider
          theme={{
            algorithm: contentDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          }}
        >
          <TokenCallbackHandler>
            <div
              className="app-content-wrapper"
              data-ant-content-theme={contentDark ? 'dark' : 'light'}
              style={{ marginTop: 32 }}
            >
              {children}
            </div>
          </TokenCallbackHandler>
        </ConfigProvider>
      );
    },
    ...initialState?.settings,
  };
};

// /**
//  * @name request 配置，可以配置错误处理
//  * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
//  * @doc https://umijs.org/docs/max/request#配置
//  */
// export const request = {
//   ...errorConfig,
// };
