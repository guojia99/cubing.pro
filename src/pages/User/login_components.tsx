import {Alert, Button, Form, Input, message} from "antd";
import React, {useEffect, useRef, useState} from "react";
import {SelectLang} from "@@/exports";
import {createStyles} from "antd-style";
import {ProFormCaptcha, ProFormInstance, ProFormText} from "@ant-design/pro-form";
import {LockOutlined, MailOutlined, SafetyOutlined, UserOutlined} from "@ant-design/icons";
import {FormattedMessage, useIntl} from "@umijs/max";
import {captchaCode, getEmailCode} from "@/services/cubing-pro/auth/api";
import PasswordStrengthMeter from "@/components/Inputs/password";
import {FormInstance} from "antd/es/form/hooks/useForm";
import * as crypto from 'crypto';

export const useStyles = createStyles(({token}) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '80vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
  };
});


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

export const Lang = () => {
  const {styles} = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang/>}
    </div>
  );
};

export const submitText = (type: string) => {
  const intl = useIntl();
  switch (type) {
    case "login":
      return intl.formatMessage({
        id: 'pages.login.accountLogin.tab',
        defaultMessage: '登录',
      })
    case "register":
      return intl.formatMessage({
        id: 'pages.login.register.tab',
        defaultMessage: '注册',
      })
    case 'register_with_cube':
      return intl.formatMessage({
        id: 'pages.login.register.tab',
        defaultMessage: 'V2玩家注册',
      })
  }
  return "登录/注册"
}

export const handleSubmit = async (values: AuthAPI.LoginRequest) => {
  return
}
//
//
export const LoginTab: React.FC = () => {
  const intl = useIntl();

  return (
    <>
      {/*cubeID*/}
      <ProFormText
        name="loginID"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined/>
        }}
        placeholder={intl.formatMessage({
          id: 'pages.login.form.loginId.placeholder',
          defaultMessage: 'CubeId / Email',
        })}
        rules={[
          {
            required: true,
            message: (<FormattedMessage id="pages.login.form.loginId.required"/>)
          },
          // {
          //   pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\d{4}[A-Za-z]{4}\d{2,4}$/,
          //   message: (<FormattedMessage id="pages.login.form.loginId.pattern" defaultMessage="请输入合法Email地址"/>)
          // }
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
        placeholder={intl.formatMessage({
          id: 'pages.login.password.placeholder',
          defaultMessage: 'password',
        })}
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="pages.login.password.required"
                defaultMessage="请输入密码！"
              />
            ),
          },
        ]}
      />
    </>
  )
}

export const RegisterTab: React.FC<{ form?: FormInstance<any> }> = (form) => {
  const intl = useIntl();
  return (
    <>
      <ProFormText
        name="loginID"
        fieldProps={{
          size: "middle",
          prefix: <UserOutlined/>
        }}
        placeholder={intl.formatMessage({
          id: 'pages.register.loginID.placeholder',
          defaultMessage: "自定义ID"
        })}
        rules={[
          {required: true, message: (<FormattedMessage id="pages.none.empty"/>)},
          {min: 8, max: 24, message: (<FormattedMessage id="pages.length.in.8-24"/>)}
        ]}
      >
      </ProFormText>

      <ProFormText
        name="userName"
        fieldProps={{
          size: "middle",
          prefix: <UserOutlined/>
        }}
        placeholder={intl.formatMessage({
          id: 'pages.register.userName.placeholder',
          defaultMessage: "昵称"
        })}
        rules={[
          {required: true, min: 2, max: 24, message: (<FormattedMessage id="pages.register.name.placeholder.rules1" defaultMessage="用户名长度只能在2-24之间"/>)},
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
          placeholder={intl.formatMessage({
            id: "pages.register.email.placeholder",
            defaultMessage: "请输入邮箱"
          })}
          rules={[
            {required: true, message: (<FormattedMessage id="pages.register.email.placeholder.rule1" defaultMessage="邮箱不能为空!"/>)},
            {
              pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
              message: (<FormattedMessage id="pages.register.email.placeholder.rule2" defaultMessage="请输入正确的邮箱"/>)
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
          placeholder={intl.formatMessage({
            id: "pages.register.emailCode.placeholder",
            defaultMessage: "请输入邮箱验证码"
          })}
          captchaTextRender={(timing, count) => {
            if (timing) {
              return `${count} ${'重新获取'}`;
            }
            return '获取验证码';
          }}
          name="emailCode"
          rules={[
            {required: true, message: (<FormattedMessage id="pages.register.emailCode.placeholder.rule1" defaultMessage="邮箱验证码不能为空!"/>)},
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
              throw new Error("存在未知错误")
            })
            message.success(`已成功发送验证码到邮箱!`);

          }}
        />
      </>
      <PasswordStrengthMeter/>
    </>
  )
}


export const CaptchaCodeTab: React.FC<{ form?: FormInstance<any> }> = (form) => {
  const intl = useIntl();
  const [code, setCode] = useState<AuthAPI.captchaCodeResp>({
      ext: "", id: "", image: ""
    }
  );
  //
  // const onFill = () => {
  //   formRef?.current?.setFieldsValue({
  //     name: '张三',
  //     company: '蚂蚁金服',
  //   });
  // };


  const [lastUpdateTime, setLastUpdateTime] = useState<number>()
  const updateCode = () => {
    // 判断是否大于刷新间隔小于2秒
    if (lastUpdateTime && (Date.now() - lastUpdateTime) < 2000) {
      message.warning("刷新太快啦, 先歇一会")
      return; // 如果上次更新时间存在且距离当前时间不足3秒，则不执行更新操作
    }
    captchaCode().then((value => {
      setCode(value)
      form.form?.setFieldsValue({verifyId: value.id})
      setLastUpdateTime(Date.now())
    }))
  }

  useEffect(() => {
    updateCode();
  }, []);

  return (
    <div style={{display: "flex"}}>
      <img style={{width: '25%', height: '38px', marginRight: "5%", borderRadius: "5px", marginTop: "2px"}}
           src={code.image} onClick={updateCode} alt={"点击刷新"}/>
      <ProFormText name="verifyId" hidden={true}>{code.id}</ProFormText>
      <ProFormText
        style={{width: '70%', height: '35px'}}
        name="verifyValue"
        fieldProps={{
          size: 'large',
          prefix: <SafetyOutlined/>
        }}
        placeholder={intl.formatMessage({
          id: 'pages.verifyValue.placeholder',
          defaultMessage: '输入图形验证码',
        })}
        rules={[
          {
            required: true,
            message: (<FormattedMessage id="pages.verifyValue.required" defaultMessage="验证码是必填项!"/>)
          },
        ]}>
      </ProFormText>
    </div>
  )
}


function generateRandomKey(timestamp: number): string {
  let data: string = `${timestamp}cubing-pro-key`;
  while (data.length < 32) {
    data += '=';
  }
  return data.slice(0, 32);
}

function encrypt(plaintext: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  // Encoding timestamp and appending to the plaintext

  // const iv = crypto.randomBytes(12); // 12 bytes IV for GCM
  // const cipher = crypto.createCipheriv(algorithm, key, iv);

  const block = crypto.createCipher(algorithm, key)
  const gcm = crypto.randomBytes(12); // 12 bytes IV for GCM

  const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
  plaintext += `:${timestamp}`;





  const encryptedData = Buffer.concat([iv, Buffer.from(encrypted, 'base64'), tag]);

  // https://www.cnblogs.com/haima/p/12611372.html


  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get the authentication tag
  const tag = cipher.getAuthTag();



  // Concatenate IV and encrypted data
  const encryptedData = Buffer.concat([iv, Buffer.from(encrypted, 'base64'), tag]);
  return encryptedData.toString('base64');
}

export const loginOnfinish = async (values: any) => {
  const req = values as AuthAPI.LoginRequest
  req.timestamp = Date.now();

  const key = generateRandomKey(12345)
  const password = await encrypt("12345", generateRandomKey(12345))
  console.log(password, key)
}

export const registerOnfinish = async (values: any) => {

}

export const onfinish = async (values: any, type: string) => {
  await message.warning(type + "|" + values)
  switch (type) {
    case "login":
      await loginOnfinish(values)
      return;
    case "register":
      await registerOnfinish(values)
      return;
  }

}
