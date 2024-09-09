import {Footer, SelectLang, AvatarDropdown, AvatarName} from '@/components';
import type {RunTimeLayoutConfig} from '@umijs/max';
import React from 'react';
import {currentUser} from "@/services/cubing-pro/auth/auth";
import defaultSettings from "../config/defaultSettings";
import {UserSwitchOutlined} from "@ant-design/icons";
import {AvatarProps} from "antd";
import type {Settings as LayoutSettings} from '@ant-design/pro-components';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: AuthAPI.CurrentUser;
  fetchUserInfo?: () => Promise<{data: AuthAPI.CurrentUser} | undefined>;
}> {
  const fetchUserInfo = async () => {
    let currentUserValue: AuthAPI.CurrentUser;
    await currentUser().then((value) => {
      // @ts-ignore
      currentUserValue = value.data
    }).catch((e) => {
      console.log(e)
    });
    // @ts-ignore
    return currentUserValue
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
export const layout: RunTimeLayoutConfig = ({initialState, setInitialState}) => {
  return {
    logo: "https://avatars.githubusercontent.com/u/52768576?v=4", // todo logo
    actionsRender: () => [<SelectLang key="SelectLang"/>],
    avatarProps: {
      src: initialState?.currentUser?.Avatar,
      icon: initialState?.currentUser?.Avatar ? undefined : <UserSwitchOutlined/>,
      title: <AvatarName/>,
      render: (_: AvatarProps, avatarChildren: React.ReactNode) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    // appList: ExtAppList(),
    waterMarkProps: {
      content: initialState?.currentUser?.CubeID,
    },
    footerRender: () => <Footer/>,
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (<>{children}</>);
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
