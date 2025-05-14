import { CheckOutlined, GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import React, { useMemo } from 'react';
import { getLocale, setLocale } from 'umi';
import {locales} from "@/locales/locales";



// 高清国旗图标地址，使用 flagcdn 40px 宽图像（@2x高清）
const getFlagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

const LanguageSelect: React.FC = () => {
  const currentLocale = getLocale();

  const menuItems: MenuProps['items'] = useMemo(() => {
    return locales.map((lang) => ({
      key: lang.key,
      label: (
        <Space>
          <img
            src={getFlagUrl(lang.flag)}
            alt={lang.label}
            style={{
              width: 16,
              height: 12,
              objectFit: 'cover',
              borderRadius: 2,
              boxShadow: lang.key === currentLocale ? '0 0 0 1px #1890ff' : undefined,
            }}
          />
          <span>{lang.label}</span>
          {lang.key === currentLocale && <CheckOutlined style={{ color: '#1890ff' }} />}
        </Space>
      ),
    }));
  }, [currentLocale]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key !== currentLocale) {
      setLocale(e.key, true); // 不刷新页面切换语言
    }
  };

  const currentLang = locales.find((l) => l.key === currentLocale);

  return (
    <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
      <a onClick={(e) => e.preventDefault()} style={{ padding: '0 12px' }} title="切换语言">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <GlobalOutlined style={{ fontSize: 16 }} />
          <img
            src={getFlagUrl(currentLang?.flag || 'cn')}
            alt="当前语言"
            style={{
              width: 16,
              height: 12,
              objectFit: 'cover',
              borderRadius: 2,
            }}
          />
        </span>
      </a>
    </Dropdown>
  );
};

export default LanguageSelect;
