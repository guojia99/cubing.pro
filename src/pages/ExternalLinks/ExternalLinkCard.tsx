import type { OtherLink } from '@/services/cubing-pro/auth/typings';
import { GlobalOutlined } from '@ant-design/icons';
import { Card, Switch, theme } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { ExternalLinkIconMedia } from './externalLinkIconDisplay';

export type ExternalLinkCardAdminProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  pinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  pinDisabled?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
};

export type ExternalLinkCardProps = {
  link: OtherLink;
  className?: string;
  style?: React.CSSProperties;
  admin?: ExternalLinkCardAdminProps;
  /** 设置后描述按字数完整展示（仍会做截断+省略号），不限制行数 */
  descMaxChars?: number;
};

const ExternalLinkCard: React.FC<ExternalLinkCardProps> = ({
  link,
  className,
  style,
  admin,
  descMaxChars,
}) => {
  const { token } = theme.useToken();

  const descDisplay = (() => {
    const raw = (link.desc ?? '').trim();
    if (descMaxChars !== undefined) {
      const t = raw.length > descMaxChars ? `${raw.slice(0, descMaxChars)}…` : raw;
      return { text: t || ' ', fullClass: true as const };
    }
    return { text: link.desc || ' ', fullClass: false as const };
  })();

  const iconBlock = (
    <div className="external-link-card__iconWrap">
      <ExternalLinkIconMedia link={link} size="card" />
    </div>
  );

  const textBlock = (
    <div className="external-link-card__text">
      {admin ? (
        <a
          href={link.url || '#'}
          className="external-link-card__titleLink"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!link.url?.trim()) e.preventDefault();
          }}
        >
          <div className="external-link-card__title">{link.name || '未命名'}</div>
        </a>
      ) : (
        <div className="external-link-card__title">{link.name || '未命名'}</div>
      )}
      <div
        className={classNames(
          'external-link-card__desc',
          descDisplay.fullClass && 'external-link-card__desc--full',
        )}
        title={descMaxChars !== undefined ? (link.desc ?? '').trim() : link.desc}
      >
        {descDisplay.text}
      </div>
    </div>
  );

  const mainRow = (
    <div className="external-link-card__row">
      {admin?.dragHandleProps && (
        <span className="external-link-card__drag" {...admin.dragHandleProps} title="拖动排序">
          ⋮⋮
        </span>
      )}
      {iconBlock}
      {textBlock}
    </div>
  );

  const toolbar =
    admin &&
    (typeof admin.onPinChange === 'function' || admin.onEdit || admin.onDelete || admin.onMove) && (
      <div className="external-link-card__toolbar">
        {typeof admin.onPinChange === 'function' && (
          <span className="external-link-card__pin">
            <span className="external-link-card__pinLabel">首页置顶</span>
            <Switch
              size="small"
              checked={admin.pinned}
              disabled={admin.pinDisabled && !admin.pinned}
              onChange={(v) => admin.onPinChange?.(v)}
            />
          </span>
        )}
        <span className="external-link-card__actions">
          {admin.onMove && (
            <span
              role="button"
              tabIndex={0}
              className="external-link-card__actionBtn"
              onClick={() => admin.onMove?.()}
            >
              移动
            </span>
          )}
          {admin.onEdit && (
            <span
              role="button"
              tabIndex={0}
              className="external-link-card__actionBtn"
              onClick={() => admin.onEdit?.()}
            >
              编辑
            </span>
          )}
          {admin.onDelete && (
            <span
              role="button"
              tabIndex={0}
              className="external-link-card__actionBtn"
              onClick={() => admin.onDelete?.()}
            >
              删除
            </span>
          )}
        </span>
      </div>
    );

  if (admin) {
    return (
      <Card
        className={classNames('external-link-card', 'external-link-card--admin', className)}
        style={style}
        styles={{ body: { padding: 16, height: '100%', display: 'flex', flexDirection: 'column' } }}
      >
        <div className="external-link-card__main">
          <div className="external-link-card__openHint" style={{ color: token.colorTextSecondary }}>
            <GlobalOutlined /> 标题可点击在新标签页打开
          </div>
          {mainRow}
        </div>
        {toolbar}
      </Card>
    );
  }

  return (
    <Card
      className={classNames('external-link-card', className)}
      style={style}
      styles={{ body: { padding: 16, height: '100%' } }}
    >
      <a
        href={link.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="external-link-card__link"
        onClick={(e) => {
          if (!link.url?.trim()) e.preventDefault();
        }}
      >
        <div className="external-link-card__main">
          {mainRow}
        </div>
      </a>
    </Card>
  );
};

export default ExternalLinkCard;
