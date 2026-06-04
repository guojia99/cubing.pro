export enum Auth {
  AuthPlayer = 1 << 0,
  AuthOrganizers = 1 << 1,
  AuthDelegates = 1 << 2,
  AuthAdmin = 1 << 3,
  AuthSuperAdmin = 1 << 4,
}

export function hasAuth(userAuth: number, requiredAuth: Auth): boolean {
  return (userAuth & requiredAuth) === requiredAuth;
}

export function hasAnyAuth(
  userAuth: number,
  required: Auth[],
): boolean {
  return required.some((a) => hasAuth(userAuth, a));
}

export function isLoggedIn(userId: number | undefined): boolean {
  return Boolean(userId && userId !== 0);
}
