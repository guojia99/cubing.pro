import { getAPIUrl } from '@/services/cubing-pro/request';
import { useModel } from '@umijs/max';
import { Button } from 'antd';
import React, { useEffect } from 'react';
import { useSearchParams, history } from '@umijs/max';

/**
 * WCA 登录页面
 * - 居中显示 WCA Logo
 * - 绿色按钮点击发起 WCA OAuth 登录
 * - 支持 redirect 参数，登录成功后跳回原页面
 */
const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { initialState } = useModel('@@initialState');

  // 已登录用户访问登录页时，直接跳转到目标页
  useEffect(() => {
    if (initialState?.currentUser?.data?.id) {
      history.replace(redirect || '/user/profile');
    }
  }, [initialState?.currentUser, redirect]);

  const handleWcaLogin = () => {
    // 登录成功后的跳转：统一使用 /auth/callback，由 callback 页再跳转到目标页
    // 这样确保 token 一定在可控的 callback 页被接收
    const nextPath = redirect || '/user/profile';
    const nextParam = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;
    const wcaLoginUrl = `${getAPIUrl()}/auth/wca?redirect=${encodeURIComponent(callbackUrl)}`;
    window.location.href = wcaLoginUrl;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 24,
      }}
    >
      <img
        src="/WCA%20Logo.svg"
        alt="WCA Logo"
        style={{
          width: 160,
          height: 160,
          marginBottom: 32,
        }}
      />
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>
        使用 WCA 账号登录
      </h2>
      <p style={{ marginBottom: 32, color: '#666', fontSize: 14 }}>
        点击下方按钮跳转到 WCA 官网完成授权
      </p>
      <Button
        type="primary"
        size="large"
        onClick={handleWcaLogin}
        style={{
          backgroundColor: '#029347',
          borderColor: '#029347',
          height: 44,
          paddingLeft: 32,
          paddingRight: 32,
          fontSize: 16,
        }}
      >
        使用 WCA 登录
      </Button>
    </div>
  );
};

export default Login;
