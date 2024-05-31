import React, {FC} from 'react'
import {Progress, Form, Row, Col} from 'antd';
import {ProFormText} from '@ant-design/pro-components'; // antd 高级组件
// import zxcvbn from 'zxcvbn'; // 密码强度校验
// import {zxcvbn} from 'zxcvbn'/**/
import styles from './index.module.less'
import {LockOutlined, SafetyOutlined} from "@ant-design/icons";
import {FormattedMessage, useIntl} from "@@/exports";

const PasswordStrengthMeter: FC = () => {
  const intl = useIntl();

  let zxcvbn = require('zxcvbn');
  // 获取上下文 form 实例
  const form = Form.useFormInstance();
  // 监听密码的改变
  const password = Form.useWatch('password', form);

  /**
   * @description: 监听密码强度相应变化
   * @param {string} password
   * @return {*}
   * @author: Cyan
   */
  const watchStrength = (password: string): number => {
    const analysisValue = zxcvbn(password)
    // score得分只有0~4，且只有整数范围并没有小数
    return (analysisValue.score + 1) * 20
  }

  return (
    <>
      {/* 密码 */}
      <ProFormText.Password
        // label="密码"
        name="password"
        fieldProps={{
          visibilityToggle: false,
          size: "middle",
          prefix: <LockOutlined/>,
        }}
        placeholder={intl.formatMessage({
          id: 'pages.login.password.placeholder',
          defaultMessage: '密码',
        })}
        rules={[
          {min: 8, message: "密码必须大于8位"},
          {max: 24, message: "密码不能大于24位"},
          {required: true, message: (<FormattedMessage id="pages.login.password.required" defaultMessage="请输入密码！"/>)},
        ]}
      />
      {/* 显示密码强度 */}
      <div hidden={!password}>
        <div className={styles['process-steps']}>
          <Progress
            percent={password ? watchStrength(password) : 0}
            steps={5}
            strokeColor={['#e74242', '#EFBD47', '#ffa500', '#1bbf1b', '#008000']}
            showInfo={false}
          />
        </div>
        <Row justify="space-around" className={styles['process-steps']} style={{marginTop: "-25px"}}>
          {['非常弱', '弱', '一般', '强', '非常强'].map(value => <Col span={4} key={value}>{value}</Col>)}
        </Row>
      </div>

      {/* 确认密码 */}
      <ProFormText.Password
        // label="确认密码"
        name="confirmPassword"
        fieldProps={{
          visibilityToggle: false,
          size: 'middle',
          prefix: <SafetyOutlined/>,
        }}
        placeholder={intl.formatMessage({
          id: 'pages.confirmPassword.placeholder',
          defaultMessage: '请再次输入密码',
        })}
        rules={[
          {required: true, message: "请输入确认密码"},
          ({getFieldValue}) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次密码输入不一致"));
            },
          })
        ]}
      />
    </>
  )
}

export default PasswordStrengthMeter
