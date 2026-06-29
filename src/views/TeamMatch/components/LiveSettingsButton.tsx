import { Button, type ButtonProps } from 'antd';
import React from 'react';

/** 正赛顶栏与全屏对战共用的「正赛与对战设置」按钮 */
const LiveSettingsButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} {...props}>
    正赛与对战设置
  </Button>
));

LiveSettingsButton.displayName = 'LiveSettingsButton';

export default LiveSettingsButton;
