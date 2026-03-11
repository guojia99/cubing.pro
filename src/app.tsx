import { Footer, AvatarDropdown, AvatarName } from '@/components';
import { TokenCallbackHandler } from '@/components/TokenCallbackHandler';
import type { RunTimeLayoutConfig } from '@umijs/max';
import React from 'react';
import { currentUser } from '@/services/cubing-pro/auth/auth';
import { saveToken } from '@/services/cubing-pro/auth/token';
import defaultSettings from '../config/defaultSettings';
import { UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { AvatarProps } from 'antd';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { AvatarURL } from '@/pages/Admin/AvatarDropdown';
import { AuthAPI } from '@/services/cubing-pro/auth/typings';
import LanguageSelect from '@/locales/Language/LanguageSelect';
import { ExtAppList } from '@/services/layout_config';

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

  return {
    settings: defaultSettings as Partial<LayoutSettings>,
    currentUser: await fetchUserInfo(),
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
    contentWidth: 'Fluid',
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
            <LanguageSelect />
          </>
        );
      },
    },
    appList: ExtAppList(),
    waterMarkProps: {
      content: initialState?.currentUser?.data.CubeID,
    },
    footerRender: () => <Footer />,
    childrenRender: (children) => {
      return (
        <TokenCallbackHandler>
          <div className="app-content-wrapper" style={{marginTop: 32}}>
            {children}
          </div>
        </TokenCallbackHandler>
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
