import {useIntl, Helmet} from '@umijs/max';
import {Form, Tabs, FormInstance} from 'antd';
import Settings from "../../../config/defaultSettings";
import {Footer} from "@/components";
import {LoginForm} from "@ant-design/pro-form";
import {CaptchaCodeTab, Lang, LoginTab, onfinish, RegisterTab, submitText, useStyles} from "@/pages/User/login_components";
import React, {useState} from "react";


const LoginFormC: React.FC = () => {
  const intl = useIntl();
  const [type, setType] = useState<string>('login');
  const [form] = Form.useForm()

  return (
    <div style={{
      marginTop: "12.5%"
    }}>
      <LoginForm
        form={form}
        contentStyle={{minWidth: 280, maxWidth: '75vw'}}
        title="Cubing Pro"
        initialValues={{autoLogin: true,}}
        submitter={{searchConfig: {submitText: submitText(type)}}}
        onFinish={async (values) => {
          console.log(values)
          await onfinish(values, type)
        }}
      >
        <Tabs
          centered
          activeKey={type}
          onChange={setType}
          items={[
            {key: 'login', label: submitText("login")},
            {key: 'register', label: submitText("register")},
          ]}
        />

        {/*登录*/}
        {type === 'login' && (<><LoginTab/> <CaptchaCodeTab form={form}/></>)}
        {type === "register" && (<RegisterTab form={form}/>)}
      </LoginForm>
    </div>
  )
}


const Login: React.FC = () => {
  const {styles} = useStyles();
  const intl = useIntl();


  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          - {Settings.title}
        </title>
      </Helmet>
      <Lang/>
      <LoginFormC></LoginFormC>
      <Footer/>
    </div>
  )
}


export default Login;
