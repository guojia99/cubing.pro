import { history, useModel } from '@@/exports';
import {message, Tag} from 'antd';

export enum Auth {
  AuthPlayer = 1 << 0, // 选手
  AuthOrganizers = 1 << 1, // 主办
  AuthDelegates = 1 << 2, // 代表
  AuthAdmin = 1 << 3, // 管理员
  AuthSuperAdmin = 1 << 4, // 超级管理员
}

export function hasAuth(userAuth: Auth, requiredAuth: Auth): boolean {
  return (userAuth & requiredAuth) === requiredAuth;
}

export function authTags(userAuth: Auth): any[] {
  let out: JSX.Element[] = [];
  if (hasAuth(userAuth, Auth.AuthSuperAdmin)) {
    out.push(<Tag color="orange">超级管理员</Tag>);
  }
  if (hasAuth(userAuth, Auth.AuthAdmin)) {
    out.push(<Tag color="magenta">管理员</Tag>);
  }
  if (hasAuth(userAuth, Auth.AuthDelegates)) {
    out.push(<Tag color="gold">代表</Tag>);
  }
  if (hasAuth(userAuth, Auth.AuthOrganizers)) {
    out.push(<Tag color="purple">主办</Tag>);
  }
  if (hasAuth(userAuth, Auth.AuthPlayer)) {
    out.push(<Tag color="green">玩家</Tag>);
  }
  return out;
}

export function checkAuth(requiredAuths: Auth[]): AuthAPI.CurrentUser | null {
  const { initialState, setInitialState } = useModel('@@initialState');

  // @ts-ignore
  const { currentUser } = initialState;

  if (currentUser === null || currentUser === undefined) {
    message.warning('请先登陆帐号后访问').then();
    history.replace({ pathname: '/login' });
    return null;
  }
  const user = currentUser as AuthAPI.CurrentUser;

  let has = false;
  for (let i = 0; i < requiredAuths.length; i++) {
    if (hasAuth(user.data.Auth, requiredAuths[i])) {
      has = true;
    }
  }
  if (!has) {
    return null;
  }
  return user;
}
