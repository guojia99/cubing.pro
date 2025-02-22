import {GithubOutlined} from '@ant-design/icons';
import {DefaultFooter} from '@ant-design/pro-components';
import React from 'react';

import cubingProConfig from "../../../config/cubing-pro";

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
        marginTop: "5%",
      }}
      links={[
        {
          key: 'index',
          title: "CubingPro",
          href: '/',
          blankTarget: false,
        },
        // {
        //   key: 'Cubing Pro',
        //   title: 'Cubing Pro',
        //   href: 'https://github.com/guojia99/cubing-pro',
        //   blankTarget: true,
        // },
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
        },
        // {
        //   key: 'copyright',
        //   title: "Cubing Pro Inc",
        //   href: 'https://github.com/guojia99/cubing.pro',
        //   blankTarget: true,
        // }
      ]}
      copyright={false}
    />
  );
};

export default Footer;
