import { history, useSearchParams } from '@umijs/max';
import { Spin } from 'antd';
import React, { useEffect } from 'react';

/**
 * WCA 登录回调页：接收后端 302 跳转带来的 token，然后重定向到目标页
 * 由 getInitialState 中的 processWcaCallbackToken 负责保存 token
 */
const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/user/profile';

  useEffect(() => {
    // token 已在 getInitialState 中处理，此处只需跳转到目标页
    const targetPath = next.startsWith('/') ? next : `/${next}`;
    history.replace(targetPath);
  }, [next]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <Spin size="large" tip="登录成功，正在跳转..." />
    </div>
  );
};

export default AuthCallback;
