import {Alert, message} from "antd";
import React, {useEffect, useState} from "react";
import {ProFormCaptcha, ProFormText} from "@ant-design/pro-form";
import {LockOutlined, MailOutlined, SafetyOutlined, UserOutlined} from "@ant-design/icons";
import {captchaCode, getEmailCode, login} from "@/services/cubing-pro/auth/auth";
import PasswordStrengthMeter from "@/components/Inputs/password";
import {FormInstance} from "antd/es/form/hooks/useForm";
//
// export const useStyles = createStyles(({token}) => {
//   return {
//     action: {
//       marginLeft: '8px',
//       color: 'rgba(0, 0, 0, 0.2)',
//       fontSize: '24px',
//       verticalAlign: 'middle',
//       cursor: 'pointer',
//       transition: 'color 0.3s',
//       '&:hover': {
//         color: token.colorPrimaryActive,
//       },
//     },
//     lang: {
//       width: 42,
//       height: 42,
//       lineHeight: '42px',
//       position: 'fixed',
//       right: 16,
//       borderRadius: token.borderRadius,
//       ':hover': {
//         backgroundColor: token.colorBgTextHover,
//       },
//     },
//     container: {
//       display: 'flex',
//       flexDirection: 'column',
//       // height: '80vh',
//       overflow: 'auto',
//       // backgroundImage:
//       //   "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
//       // backgroundSize: '100% 100%',
//     },
//   };
// });


export const LoginMessage: React.FC<{
  content: string;
}> = ({content}) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};


export const submitText = (type: string) => {
  switch (type) {
    case "login":
      return "登录"
    case "register":
      return '注册'
    case 'register_with_cube':
      return 'V2玩家注册'
  }
  return "登录/注册"
}

export const LoginTab: React.FC = () => {
  return (
    <>
      {/*cubeID*/}
      <ProFormText
        name="loginID"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined/>
        }}
        placeholder={'CubeId / Email'}
        rules={[
          {
            required: true,
            message: "请输入CubeID 或 Email"
          },
        ]}
      >
      </ProFormText>


      {/*password*/}
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined/>,
        }}
        placeholder={'password'}
        rules={[
          {
            required: true,
            message: "请输入密码！",
          },
        ]}
      />
    </>
  )
}

export const RegisterTab: React.FC<{ form?: FormInstance<any> }> = (form) => {
  return (
    <>
      <ProFormText
        name="loginID"
        fieldProps={{
          size: "middle",
          prefix: <UserOutlined/>
        }}
        placeholder={"自定义ID"}
        rules={[
          {required: true, message:  "不能为空"},
          {min: 8, max: 24, message: "长度必须在8~24之间"}
        ]}
      >
      </ProFormText>

      <ProFormText
        name="userName"
        fieldProps={{
          size: "middle",
          prefix: <UserOutlined/>
        }}
        placeholder={"昵称"}
        rules={[
          {required: true, min: 2, max: 24, message: "用户名长度只能在2-24之间"},
        ]}
      >
      </ProFormText>

      <>
        <ProFormText
          name="email"
          fieldProps={{
            size: "middle",
            prefix: <MailOutlined/>,
          }}
          placeholder={ "请输入邮箱"}
          rules={[
            {required: true, message: "邮箱不能为空!"},
            {
              pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
              message: "请输入正确的邮箱",
            }
          ]}
        >
        </ProFormText>
        <ProFormCaptcha
          countDown={120}
          fieldProps={{
            size: 'middle',
            prefix: <LockOutlined className={'prefixIcon'}/>,
          }}
          captchaProps={{
            size: 'middle',
          }}
          placeholder={"请输入邮箱验证码"}
          captchaTextRender={(timing, count) => {
            if (timing) {
              return `${count} ${'重新获取'}`;
            }
            return '获取验证码';
          }}
          name="emailCode"
          rules={[
            {required: true, message: "邮箱验证码不能为空!"},
          ]}
          onGetCaptcha={async () => {
            const name = form.form?.getFieldValue("name")
            const email = form.form?.getFieldValue("email")
            if (!(name && email)) {
              message.warning("请输入用户名和邮箱再获取验证码")
              throw new Error("请输入用户名和邮箱再获取验证码");
            }
            const emailRegex: RegExp = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            if (!emailRegex.test(email)) {
              message.warning("Email格式不合法")
              throw new Error("Email格式不合法");
            }

            await getEmailCode({email: email, name: name}).then((value) => {
              message.success(`已成功发送验证码到邮箱!请注意查收;有效期至: ${value.data.data.timeout}`);
            }).catch((value) => {
              throw new Error("存在未知错误:" + value)
            })
            message.success(`已成功发送验证码到邮箱!`);

          }}
        />
      </>
      <PasswordStrengthMeter/>
    </>
  )
}


export const CaptchaCodeTab: React.FC<{ form?: FormInstance<any>; update: number }> = ({ form, update }) => {
  const [code, setCode] = useState<AuthAPI.captchaCodeResp>({
    ext: "",
    id: "",
    image: ""
  });

  const [lastUpdateTime, setLastUpdateTime] = useState<number>();

  const updateCode = () => {
    captchaCode().then(value => {
      setCode(value);
      form?.setFieldsValue({ verifyId: value.id });
      setLastUpdateTime(Date.now());
    });
  };

  const autoUpdateCode = () => {
    if (lastUpdateTime && Date.now() - lastUpdateTime < 2000) {
      message.warning("刷新太快啦, 先歇一会").then();
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
    <div style={{ display: "flex" }}>
      <img
        style={{
          width: "25%",
          height: "38px",
          marginRight: "5%",
          borderRadius: "5px",
          marginTop: "2px"
        }}
        src={code.image}
        onClick={autoUpdateCode}
        alt={"点击刷新"}
      />
      <ProFormText name="verifyId" hidden={true}>
        {code.id}
      </ProFormText>
      <ProFormText
        style={{ width: "70%", height: "35px" }}
        name="verifyValue"
        fieldProps={{
          size: "large",
          prefix: <SafetyOutlined />
        }}
        placeholder={"输入图形验证码"}
        rules={[
          {
            required: true,
            message: "验证码是必填项!"
          }
        ]}
      />
    </div>
  );
};
