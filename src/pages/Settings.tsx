import { USER_KV_KEYS, setUserKv } from '@/services/cubing-pro/user/user_kv';
import { getToken } from '@/services/cubing-pro/auth/token';
import {
  applyWebsiteUiToDocument,
  layoutPatchFromWebsiteUi,
  readWebsiteUiFromStorage,
  writeWebsiteUiToStorage,
  type WebsiteUiConfig,
  type WebsiteUiNavPreference,
} from '@/utils/websiteUiConfig';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { Button, Form, InputNumber, Select, Space, message } from 'antd';
import defaultSettings from '../../config/defaultSettings';
import React, { useMemo } from 'react';

const Settings: React.FC = () => {
  const intl = useIntl();
  const { setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm<WebsiteUiConfig>();

  const initial = useMemo(() => {
    const local = readWebsiteUiFromStorage();
    return {
      navTheme: (local.navTheme ??
        (defaultSettings.navTheme as WebsiteUiNavPreference)) as WebsiteUiNavPreference,
      fontSizeBase: local.fontSizeBase ?? 14,
    };
  }, []);

  const onFinish = async (values: WebsiteUiConfig) => {
    const cfg: WebsiteUiConfig = {
      navTheme: values.navTheme,
      fontSizeBase: values.fontSizeBase,
    };
    writeWebsiteUiToStorage(cfg);
    applyWebsiteUiToDocument(cfg);
    setInitialState((s: any) => ({
      ...s,
      settings: {
        ...s?.settings,
        ...layoutPatchFromWebsiteUi(cfg),
      },
    }));

    const tok = getToken();
    if (tok?.token) {
      try {
        const raw = JSON.stringify(cfg);
        await setUserKv(USER_KV_KEYS.website_ui_config, raw, 3);
        message.success(intl.formatMessage({ id: 'settings.saveOkCloud' }));
      } catch {
        message.warning(intl.formatMessage({ id: 'settings.saveLocalOnly' }));
      }
    } else {
      message.success(intl.formatMessage({ id: 'settings.saveOkLocal' }));
    }
  };

  return (
    <PageContainer title={intl.formatMessage({ id: 'settings.title' })}>
      <Form<WebsiteUiConfig>
        form={form}
        layout="vertical"
        style={{ maxWidth: 480 }}
        initialValues={initial}
        onFinish={(v) => void onFinish(v)}
      >
        <Form.Item
          name="navTheme"
          label={intl.formatMessage({ id: 'settings.theme' })}
        >
          <Select
            options={[
              { value: 'light', label: intl.formatMessage({ id: 'settings.themeLight' }) },
              { value: 'realDark', label: intl.formatMessage({ id: 'settings.themeDark' }) },
              { value: 'system', label: intl.formatMessage({ id: 'settings.themeSystem' }) },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="fontSizeBase"
          label={intl.formatMessage({ id: 'settings.fontSize' })}
          extra={intl.formatMessage({ id: 'settings.fontSizeHint' })}
        >
          <InputNumber min={12} max={22} step={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {intl.formatMessage({ id: 'settings.save' })}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </PageContainer>
  );
};

export default Settings;
