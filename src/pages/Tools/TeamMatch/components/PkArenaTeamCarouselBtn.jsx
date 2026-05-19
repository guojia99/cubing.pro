import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import '../TeamMatch.less';
function PkArenaTeamCarouselBtn({ corner, running, disabled, onClick }) {
    return (<div className={classNames('tmPkArenaTeamCarouselBtn', `tmPkArenaTeamCarouselBtn--${corner}`)}>
      <Tooltip title={running ? '停止轮播' : '按顺序轮播队员（英雄弹窗）'}>
        <Button type="default" size="small" shape="round" ghost disabled={disabled} icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={(e) => {
            e.stopPropagation();
            onClick();
        }} className="tmPkArenaTeamCarouselBtnInner">
          {running ? '停止' : '队员轮播'}
        </Button>
      </Tooltip>
    </div>);
}
export default PkArenaTeamCarouselBtn;
//# sourceMappingURL=PkArenaTeamCarouselBtn.jsx.map