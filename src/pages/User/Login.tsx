import { CaptchaCodeTab, LoginTab, RegisterTab, submitText } from '@/pages/User/Login_components';
import { login } from '@/services/cubing-pro/auth/auth';
import { LoginForm } from '@ant-design/pro-form';
import { Form, Tabs, message } from 'antd';
import React, { useState } from 'react';
import {Link} from "@umijs/max";

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
    .catch((values) => {
      message.error('登陆失败：' + values);
    });
};

const registerOnfinish = async (values: any) => {
  console.log(values);
};

const LoginFormC: React.FC = () => {
  const [type, setType] = useState<string>('login');
  const [updateCode, setUpdateCode] = useState(0); // 管理 update 变量
  const [form] = Form.useForm();
  return (
    <LoginForm
      form={form}
      contentStyle={{ minWidth: 280, maxWidth: '70vw' }}
      title="Cubing Pro"
      initialValues={{ autoLogin: true }}
      submitter={{ searchConfig: { submitText: submitText(type) } }}
      onFinish={async (values) => {
        switch (type) {
          case 'login':
            await loginOnfinish(values);
            break;
          case 'register':
            await registerOnfinish(values);
            break;
        }
        setUpdateCode(updateCode + 1);
      }}
    >
      <Tabs
        centered
        activeKey={type}
        onChange={setType}
        items={[
          { key: 'login', label: submitText('login') },
          { key: 'register', label: submitText('register') },
        ]}
      />

      {/*登录*/}
      {type === 'login' && (
        <>
          <LoginTab />
          <CaptchaCodeTab form={form} update={updateCode} />

        </>
      )}
      {type === 'register' && <RegisterTab form={form} />}
    </LoginForm>
  );
};

const Login: React.FC = () => {
  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: '25vh',
      }}
    >
      <LoginFormC></LoginFormC>
      <Link to={"/user/reset_password"} style={{textAlign:"center", color:"#a09d9d"}}>找回密码</Link>
    </div>
  );
};

export default Login;
