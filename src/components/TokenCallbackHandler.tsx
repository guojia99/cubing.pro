import { saveToken } from '@/services/cubing-pro/auth/token';
import React, { useEffect } from 'react';

/**
 * 处理 WCA 登录回调：URL 中带有 token 时保存并清除 URL，然后刷新用户状态
 */
export const TokenCallbackHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenStr = params.get('token');
    if (tokenStr) {
      // 1. 存储 token（与账号密码登录一致）
      saveToken({
        token: tokenStr,
        expire: '',
        status: '',
      });
      // 2. 清除 URL 中的 token，避免泄露
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
      // 3. 刷新页面以重新获取用户状态（getInitialState 会重新执行）
      window.location.reload();
    }
  }, []);

  return <>{children}</>;
};
