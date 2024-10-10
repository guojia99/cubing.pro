export enum Auth {
  AuthPlayer = 1 << 0,        // 选手
  AuthOrganizers = 1 << 1,    // 主办
  AuthDelegates = 1 << 2,     // 代表
  AuthAdmin = 1 << 3,         // 管理员
  AuthSuperAdmin = 1 << 4     // 超级管理员
}

export function hasAuth(userAuth: Auth, requiredAuth: Auth): boolean {
  return (userAuth & requiredAuth) === requiredAuth;
}
