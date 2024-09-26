import { logout } from '@/services/cubing-pro/auth/auth';
import { history, useModel } from '@umijs/max';
import { stringify } from 'querystring';
import type { MenuInfo } from 'rc-menu/lib/interface';
import React, { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { BsFillPersonLinesFill } from 'react-icons/bs';
import { FaHospitalUser } from 'react-icons/fa6';
import {
  RiLoginBoxFill,
  RiLogoutBoxRFill,
  RiMessage3Fill,
  RiSettings5Fill,
  RiUserHeartFill,
  RiUserSettingsFill,
} from 'react-icons/ri';
import HeaderDropdown from '../../components/HeaderDropdown';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

export const AvatarName = () => {
  // @ts-ignore
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  return <span className="anticon">{currentUser?.data.Name}</span>;
};
//
// const useStyles = createStyles(({token}) => {
//   return {
//     action: {
//       display: 'flex',
//       height: '48px',
//       marginLeft: 'auto',
//       overflow: 'hidden',
//       alignItems: 'center',
//       padding: '0 8px',
//       cursor: 'pointer',
//       borderRadius: token.borderRadius,
//       '&:hover': {
//         backgroundColor: token.colorBgTextHover,
//       },
//     },
//   };
// });

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu, children }) => {
  /**
   * 退出登录，并且将当前的 url 保存
   */
  const loginOut = async () => {
    await logout();
    const { search, pathname } = window.location;
    const urlParams = new URL(window.location.href).searchParams;
    /** 此方法会跳转到 redirect 参数所在的位置 */
    const redirect = urlParams.get('redirect');
    // Note: There may be security issues, please note
    if (window.location.pathname !== '/login' && !redirect) {
      history.replace({
        pathname: '/login',
        search: stringify({
          redirect: pathname + search,
        }),
      });
    }
  };
  // const {styles} = useStyles();

  // @ts-ignore
  const { initialState, setInitialState } = useModel('@@initialState');

  const onMenuClick = useCallback(
    (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        flushSync(() => {
          setInitialState((s: any) => ({ ...s, currentUser: undefined }));
        });
        loginOut();
        return;
      }
      history.push(`/${key}`); // 这里是用于跳转到指定key 的路由
    },
    [setInitialState],
  );

  // @ts-ignore
  const { currentUser } = initialState;

  // if (!currentUser || !currentUser.name) {
  //   return loading;
  // }

  const user = currentUser as AuthAPI.CurrentUser;

  const loginMenu = [
    {
      key: 'settings',
      icon: <RiSettings5Fill />,
      label: '网页设置',
    },
    {
      key: 'login',
      icon: <RiLoginBoxFill />,
      label: '登录/注册',
    },
  ];

  const logoutMenu = [
    {
      key: 'settings',
      icon: <RiSettings5Fill />,
      label: '网页设置',
    },
    {
      key: 'logout',
      icon: <RiLogoutBoxRFill />,
      label: '退出登录',
    },
  ];

  // 只展示登录
  if (currentUser === undefined) {
    return (
      <HeaderDropdown
        menu={{
          selectedKeys: [],
          onClick: onMenuClick,
          items: [...loginMenu],
        }}
      >
        {children}
      </HeaderDropdown>
    );
  }

  const userMenu = [
    {
      key: 'player/' + user.data.CubeID,
      icon: <FaHospitalUser />,
      label: '我的主页',
    },
    {
      key: 'user/profile',
      icon: <BsFillPersonLinesFill />,
      label: '个人中心',
    },
    {
      key: 'user/messages',
      icon: <RiMessage3Fill />,
      label: '消息中心',
    },
    {
      key: 'user/like',
      icon: <RiUserHeartFill />,
      label: '我的收藏',
    },
    {
      key: 'user/settings',
      icon: <RiUserSettingsFill />,
      label: '个人设置',
    },
    {
      type: 'divider' as const,
    },
  ];

  const menuItems = [...(menu ? [...userMenu] : []), ...logoutMenu];

  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
    >
      {children}
    </HeaderDropdown>
  );
};
