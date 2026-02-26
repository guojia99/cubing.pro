import { Footer, AvatarDropdown, AvatarName } from '@/components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import React from 'react';
import { currentUser } from '@/services/cubing-pro/auth/auth';
import defaultSettings from '../config/defaultSettings';
import { UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { AvatarProps, Col, Row } from 'antd';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { AvatarURL } from '@/pages/Admin/AvatarDropdown';
import { AuthAPI } from '@/services/cubing-pro/auth/typings';
import ScrollToTopButton from '@/components/Buttons/toTop';
import LanguageSelect from '@/locales/Language/LanguageSelect';
import { ExtAppList } from '@/services/layout_config';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: AuthAPI.CurrentUser;
  fetchUserInfo?: () => Promise<{ data: AuthAPI.CurrentUser } | undefined>;
}> {
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
      margin: '0 auto',
      padding: '16px',
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
      // 判断是否为移动端（例如屏幕宽度 <= 768px）
      // const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      // const scale = isMobile ? 0.7 : 1; // 手机端 70%，桌面端 100%
      // const containerWidth = scale === 1 ? '100%' : `${100 / scale}%`; // 补偿缩放后留白

      return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
            minHeight: '100vh',
          }}
        >
          <ScrollToTopButton />
          <Row gutter={0}>
            <Col xs={0} sm={0} md={0} lg={1} xl={2} xxl={2} />
            <Col xs={24} sm={24} md={24} lg={22} xl={20} xxl={20} style={{ maxWidth: '100%' }}>
              {children}
            </Col>
            <Col xs={0} sm={0} md={0} lg={1} xl={2} xxl={2} />
          </Row>
        </div>
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
