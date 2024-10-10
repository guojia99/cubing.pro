import { FormattedMessage } from '@@/exports';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { ProFormText } from '@ant-design/pro-components';
import { Form, Progress } from 'antd';
import { FC } from 'react';
import styles from './index.module.less';

const PasswordStrengthMeter: FC = () => {
  let zxcvbn = require('zxcvbn');
  const form = Form.useFormInstance();
  const password = Form.useWatch('password', form);

  const watchStrength = (password: string): number => {
    const analysisValue = zxcvbn(password);
    return (analysisValue.score + 1) * 20;
  };

  return (
    <>
      {/* 密码 */}
      <ProFormText.Password
        label="密码"
        name="password"
        fieldProps={{
          visibilityToggle: false,
          size: 'middle',
          prefix: <LockOutlined />,
        }}
        placeholder={'密码'}
        rules={[
          { min: 8, message: '密码必须大于8位' },
          { max: 24, message: '密码不能大于24位' },
          {
            required: true,
            message: (
              <FormattedMessage id="pages.login.password.required" defaultMessage="请输入密码！" />
            ),
          },
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
      </div>
      {/* 确认密码 */}
      <ProFormText.Password
        label="确认密码"
        name="confirmPassword"
        fieldProps={{
          visibilityToggle: false,
          size: 'middle',
          prefix: <SafetyOutlined />,
        }}
        placeholder={'请再次输入密码'}
        rules={[
          { required: true, message: '请输入确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次密码输入不一致'));
            },
          }),
        ]}
      />
    </>
  );
};

export default PasswordStrengthMeter;
