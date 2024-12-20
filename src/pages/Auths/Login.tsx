
import { captchaCode, login } from '@/services/cubing-pro/auth/auth';
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-form';
import { Link } from '@umijs/max';
import { Form, message } from 'antd';
import { FormInstance } from 'antd/es/form/hooks/useForm';
import React, { useEffect, useState } from 'react';
import {AuthAPI} from "@/services/cubing-pro/auth/typings";

// import "./Login.css"

const loginOnfinish = async (values: any) => {
  const req = values as AuthAPI.LoginRequest;
  await login(req)
    .then(() => {
      message.success('登陆成功!');
      // todo 跳到上一个页面
      // const history = useHistory();
      // history.push('/user/profile');
      window.location.href = '/user/profile';
    })
    .catch((value) => {
      message.error('登陆失败：' + value.response.data.message);
    });
};

export const CaptchaCodeTab: React.FC<{ form?: FormInstance<any>; update: number }> = ({
  form,
  update,
}) => {
  const [code, setCode] = useState<AuthAPI.captchaCodeResp>({
    ext: '',
    id: '',
    image: '',
  });

  const [lastUpdateTime, setLastUpdateTime] = useState<number>();

  const updateCode = () => {
    captchaCode().then((value) => {
      setCode(value);
      form?.setFieldsValue({ verifyId: value.id });
      setLastUpdateTime(Date.now());
    });
  };

  const autoUpdateCode = () => {
    if (lastUpdateTime && Date.now() - lastUpdateTime < 2000) {
      message.warning('刷新太快啦, 先歇一会').then();
      return;
    }
    updateCode();
  };

  // 监听组件初次渲染时，自动刷新验证码
  useEffect(() => {
    autoUpdateCode();
  }, []);

  // 监听 `update` 变化，触发验证码刷新
  useEffect(() => {
    autoUpdateCode();
  }, [update]);

  // 设置1分钟后自动更新
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdateTime && Date.now() - lastUpdateTime >= 60000) {
        autoUpdateCode();
      }
    }, 60000);

    return () => clearInterval(interval); // 清除定时器
  }, [lastUpdateTime]);

  return (
    <div style={{ display: 'flex' }}>
      <img
        style={{
          width: '25%',
          height: '38px',
          marginRight: '5%',
          borderRadius: '5px',
          marginTop: '2px',
        }}
        src={code.image}
        onClick={autoUpdateCode}
        alt={'点击刷新'}
      />
      <ProFormText name="verifyId" hidden={true}>
        {code.id}
      </ProFormText>
      <ProFormText
        style={{ width: '70%', height: '35px' }}
        name="verifyValue"
        fieldProps={{
          size: 'large',
          prefix: <SafetyOutlined />,
        }}
        placeholder={'输入图形验证码'}
        rules={[
          {
            required: true,
            message: '验证码是必填项!',
          },
        ]}
      />
    </div>
  );
};

export const LoginTab: React.FC = () => {
  return (
    <>
      {/*cubeID*/}
      <ProFormText
        name="loginID"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined />,
        }}
        placeholder={'CubeId / Email / LoginId'}
        rules={[
          {
            required: true,
            message: '请输入CubeID 或 Email',
          },
        ]}
      ></ProFormText>

      {/*password*/}
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined />,
        }}
        placeholder={'password'}
        rules={[
          {
            required: true,
            message: '请输入密码！',
          },
        ]}
      />
    </>
  );
};

const LoginFormC: React.FC = () => {
  const [updateCode, setUpdateCode] = useState(0); // 管理 update 变量
  const [form] = Form.useForm();
  return (
    <LoginForm
      form={form}
      title="登录"
      initialValues={{ autoLogin: true }}
      onFinish={async (values) => {
        await loginOnfinish(values);
        setUpdateCode(updateCode + 1);
      }}
    >
      <div style={{ minWidth: 280, maxWidth: '70vw' }}>
        <h3 style={{ marginBottom: '20px' }}></h3>

        <LoginTab />
        <CaptchaCodeTab form={form} update={updateCode} />
      </div>
    </LoginForm>
  );
};

const Login: React.FC = () => {
  return (
    <div
      style={{
        textAlign: 'center',
      }}
    >
      <LoginFormC></LoginFormC>
      <Link to={'/user/reset_password'} style={{textAlign: 'center', color: '#a09d9d'}}>
        找回密码
      </Link>
      {' / '}
      <Link to={'/register'} style={{textAlign: 'center', color: '#a09d9d'}}>
        注册
      </Link>
    </div>
  );
};

export default Login;
