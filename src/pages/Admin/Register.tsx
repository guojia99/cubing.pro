import PasswordStrengthMeter from '@/components/Inputs/password';
import { getEmailCode, register } from '@/services/cubing-pro/auth/auth';
import { Link, history } from '@@/exports';
import {
  LockOutlined,
  MailOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProFormCaptcha, ProFormText } from '@ant-design/pro-form';
import { Alert, Button, Form, Steps, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { FaIdCardAlt, FaRegIdBadge, FaRegUserCircle, FaUserEdit } from 'react-icons/fa';
import { FaQq } from 'react-icons/fa6';
import { RiEnglishInput, RiLockPasswordLine } from 'react-icons/ri';
import {AuthAPI} from "@/services/cubing-pro/auth/typings";

interface StepFields {
  [key: number]: string[];
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};
const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<string | undefined>();
  const [formData, setFormData] = useState<any>({});

  const [, forceUpdate] = useState({});

  useEffect(() => {
    forceUpdate({});
  }, []);
  const steps = [
    {
      title: '基础信息',
      content: (
        <>
          <ProFormText
            label="昵称"
            name="userName"
            fieldProps={{
              size: 'middle',
              prefix: <FaUserEdit />,
            }}
            placeholder={'昵称'}
            rules={[{ required: true, min: 2, max: 24, message: '用户名长度只能在2-24之间' }]}
          ></ProFormText>

          <ProFormText
            label="自定义ID"
            name="loginID"
            fieldProps={{
              size: 'middle',
              prefix: <FaRegUserCircle />,
            }}
            placeholder={'自定义ID'}
            rules={[
              { required: true, message: '不能为空' },
              { min: 8, max: 24, message: '长度必须在8~24之间' },
            ]}
          ></ProFormText>

          <ProFormText
            label="QQ"
            name="QQ"
            fieldProps={{
              size: 'middle',
              prefix: <FaQq />,
            }}
            placeholder={'QQ号'}
          ></ProFormText>

          <ProFormText
            label="真实姓名"
            name="actualName"
            fieldProps={{
              size: 'middle',
              prefix: <FaIdCardAlt />,
            }}
            placeholder={'真实姓名'}
          ></ProFormText>

          <ProFormText
            label="英文名"
            name="enName"
            fieldProps={{
              size: 'middle',
              prefix: <RiEnglishInput />,
            }}
            placeholder={'英文名'}
          ></ProFormText>
        </>
      ),
      description: '输入你的基础用户信息',
      icon: <UserOutlined />,
    },
    {
      title: 'V2用户',
      content: (
        <>
          <Alert
            message="V2群赛用户须知"
            description={
              <>
                <p>
                  1.如果你已经拥有一个CubeId并拥有了成绩,请你查询自己的帐号ID后输入，查询地址:{' '}
                  <Link to={'/players'}>选手列表</Link>
                </p>
                <p>
                  2.如果注册时未输入原有的CubeID，旧数据将与你注册的新帐号无法绑定，你也无法在网站上对原有的帐号执行任何操作。
                </p>
                <p>3.认领密码请联系管理员或你所在群赛群主，获取后再申请注册。</p>
              </>
            }
            type="info"
            showIcon
          />
          <br />

          <ProFormText
            label="cubeID"
            name="cubeID"
            fieldProps={{
              size: 'middle',
              prefix: <FaRegIdBadge />,
            }}
            placeholder={'已有CubeID'}
            rules={[{ min: 10, max: 10, message: 'Cube ID 的长度只能为10' }]}
          ></ProFormText>
          <ProFormText
            label="认领密码"
            name="initPassword"
            fieldProps={{
              size: 'middle',
              prefix: <RiLockPasswordLine />,
            }}
            placeholder={'认领密码'}
          ></ProFormText>
        </>
      ),
      description: '已有CubeID帐号',
      icon: <TeamOutlined />,
    },
    {
      title: '验证',
      content: (
        <>
          <ProFormText
            label="邮箱"
            name="email"
            fieldProps={{
              size: 'middle',
              prefix: <MailOutlined />,
            }}
            placeholder={'请输入邮箱'}
            rules={[
              { required: true, message: '邮箱不能为空!' },
              {
                pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                message: '请输入正确的邮箱',
              },
            ]}
          ></ProFormText>
          <ProFormCaptcha
            label="验证码"
            countDown={120}
            fieldProps={{
              size: 'middle',
              prefix: <LockOutlined className={'prefixIcon'} />,
            }}
            captchaProps={{
              size: 'middle',
            }}
            placeholder={'请输入邮箱验证码'}
            captchaTextRender={(timing, count) => {
              if (timing) {
                return `${count} ${'重新获取'}`;
              }
              return '获取验证码';
            }}
            name="emailCode"
            rules={[{ required: true, message: '邮箱验证码不能为空!' }]}
            onGetCaptcha={async () => {
              const name = formData['userName'];
              const email = form?.getFieldValue('email');
              if (!(name && email)) {
                message.warning('请输入用户名和邮箱再获取验证码');
              }
              const emailRegex: RegExp = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
              if (!emailRegex.test(email)) {
                message.warning('Email格式不合法');
              }

              await getEmailCode({ email: email, name: name })
                .then((value) => {
                  message.success(
                    `已成功发送验证码到邮箱!请注意查收;有效期至: ${value.data.data.timeout}`,
                  );
                })
                .catch((error) => {
                  if (error.response) {
                    message.error('注册错误: ' + error.response.data.error);
                  }
                });
            }}
          />
          <PasswordStrengthMeter />
        </>
      ),
      description: '验证你的邮箱和密码',
      icon: <SolutionOutlined />,
    },
  ];
  //
  const stepFields: StepFields = {
    0: ['loginID', 'userName'],
    1: ['cubeID', 'initPassword'],
    2: ['email', 'emailCode'],
    3: ['password', 'confirmPassword'],
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
    setStatus(undefined);
  };

  const next = async () => {
    try {
      const values = await form.validateFields(stepFields[currentStep]);
      setFormData((prevData: any) => ({ ...prevData, ...values }));
      setCurrentStep(currentStep + 1);
      setStatus(undefined);
    } catch (error) {
      setStatus('error');
    }
  };

  const onFinish = async (values: any) => {
    try {
      await form.validateFields(stepFields[currentStep]);
      // setFormData((prevData: any) => ({ ...prevData, ...values }));
    } catch (error) {
      return;
    }

    const req = { ...values, ...formData } as AuthAPI.RegisterRequest;
    req.timestamp = 0;
    console.log('===> req', req);
    register(req)
      .then((value) => {
        console.log(value);
        message.success('注册成功');
        history.replace({ pathname: '/login' });
      })
      .catch((error) => {
        // 检查 error 对象是否包含响应数据
        if (error.response) {
          message.error('注册错误: ' + error.response.data.error);
        } else if (error.request) {
          console.log('Error: No response received', error.request);
        } else {
          console.log('Error:', error.message);
        }
      });
  };

  return (
    <>
      <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>
        <strong>注册</strong>
      </h2>

      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: '40px' }}
        // @ts-ignore
        status={status}
      ></Steps>

      <Form form={form} onFinish={onFinish} style={{ minHeight: '60vh' }} {...formItemLayout}>
        {steps[currentStep].content}
        <div style={{ marginTop: '40px', float: 'right' }}>
          {currentStep > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev}>
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              下一步
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" htmlType="submit" onClick={onFinish}>
              注册
            </Button>
          )}
        </div>
      </Form>

      <div style={{ textAlign: 'center', color: '#a09d9d' }}>
        <Link to={'/login'}>登录</Link>
      </div>
    </>
  );
};

export default Register;
