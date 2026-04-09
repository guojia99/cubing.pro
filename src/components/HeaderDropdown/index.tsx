import { Dropdown } from 'antd';
import type { DropDownProps } from 'antd/es/dropdown';
import React from 'react';
import { createStyles } from 'antd-style';
import classNames from 'classnames';

const useStyles = createStyles(({ token }) => {
  return {
    dropdown: {
      // 小屏勿设 width:100%：默认 bottomLeft + 全宽会让菜单相对右侧 trigger 左对齐后整体挤出视口，
      // 配合 body overflow-x:hidden 会出现「只在左侧看到空白块、文字被裁掉」的现象。
      [`@media screen and (max-width: ${token.screenXS}px)`]: {
        maxWidth: 'calc(100vw - 16px)',
      },
      '.ant-dropdown-menu-item, .ant-dropdown-menu-submenu-title': {
        color: token.colorText,
      },
      '.ant-dropdown-menu-item .ant-dropdown-menu-item-icon': {
        color: token.colorIcon,
      },
    },
  };
});

export type HeaderDropdownProps = {
  overlayClassName?: string;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter';
} & Omit<DropDownProps, 'overlay'>;

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
  overlayClassName: cls,
  placement = 'bottomRight',
  ...restProps
}) => {
  const { styles } = useStyles();
  return (
    <Dropdown overlayClassName={classNames(styles.dropdown, cls)} placement={placement} {...restProps} />
  );
};

export default HeaderDropdown;
