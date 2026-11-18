import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import '../TeamMatch.css';
import { useTeamMatchI18n } from '../i18n';

type Corner = 'bottom-left' | 'bottom-right' | 'bottom-center';

type Props = {
  corner: Corner;
  running: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function PkArenaTeamCarouselBtn({ corner, running, disabled, onClick }: Props) {
  const { t } = useTeamMatchI18n();
  return (
    <div className={classNames('tmPkArenaTeamCarouselBtn', `tmPkArenaTeamCarouselBtn--${corner}`)}>
      <Tooltip title={running ? t('teamMatch.stopCarousel') : t('teamMatch.carouselTitle')}>
        <Button
          type="default"
          size="small"
          shape="round"
          ghost
          disabled={disabled}
          icon={running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="tmPkArenaTeamCarouselBtnInner"
        >
          {running ? t('teamMatch.stop') : t('teamMatch.carousel')}
        </Button>
      </Tooltip>
    </div>
  );
}

export default PkArenaTeamCarouselBtn;
