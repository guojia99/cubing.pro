import { Auth, hasAuth } from '@/pages/User/AuthComponents';
import { logout } from '@/services/cubing-pro/auth/auth';
import { history, useModel } from '@umijs/max';
import { stringify } from 'querystring';
import type { MenuInfo } from 'rc-menu/lib/interface';
import React, { useCallback } from 'react';
import { flushSync } from 'react-dom';
import {BsClipboard2Data, BsFillPersonLinesFill} from 'react-icons/bs';
import {FaCubesStacked, FaHospitalUser} from 'react-icons/fa6';
import { LuComponent } from 'react-icons/lu';
import {
  RiAdminLine,
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
      label: '登录',
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
      key: 'user/pre_result',
      icon: <BsClipboard2Data />,
      label: '成绩录入',
    },
    {
      type: 'divider' as const,
    },
  ];

  const adminsMenu = [];
  if (hasAuth(user.data.Auth, Auth.AuthOrganizers)) {
    adminsMenu.push({
      key: 'user/organizers',
      icon: <LuComponent />,
      label: '主办管理',
    });
  }

  if (hasAuth(user.data.Auth, Auth.AuthAdmin) || hasAuth(user.data.Auth, Auth.AuthSuperAdmin)) {
    adminsMenu.push({
      key: 'user/admins',
      icon: <RiAdminLine />,
      label: '后台管理',
    });
  }

  if (adminsMenu.length > 0) {
    adminsMenu.push({ type: 'divider' as const });
  }

  const menuItems = [...(menu ? [...userMenu, ...adminsMenu] : []), ...logoutMenu];

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
