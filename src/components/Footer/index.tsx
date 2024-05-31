import {GithubOutlined} from '@ant-design/icons';
import {DefaultFooter} from '@ant-design/pro-components';
import React from 'react';

import cubingProConfig from "../../../config/cubing-pro";

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
        marginTop: "20%",
      }}
      links={[
        {
          key: 'Cubing Pro',
          title: 'Cubing Pro',
          href: 'https://github.com/guojia99/cubing-pro',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined/>,
          href: 'https://github.com/guojia99/cubing.pro',
          blankTarget: true,
        },
        {
          key: 'filing',
          title: cubingProConfig.Filing,
          href: 'https://beian.miit.gov.cn/',
          blankTarget: true,
        }
      ]}
      copyright={"Cubing Pro Inc"}
    />
  );
};

export default Footer;
