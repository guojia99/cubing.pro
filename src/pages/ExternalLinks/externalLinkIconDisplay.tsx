import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import type { OtherLink } from '@/services/cubing-pro/auth/typings';
import React from 'react';
import {
  OTHER_LINK_ANTD_ICON_MAP,
  OTHER_LINK_FC_ICON_MAP,
  OTHER_LINK_GI_ICON_MAP,
} from './externalLinkIconRegistry';
import {
  DEFAULT_LINK_ICON,
  parseAntdIconKey,
  parseCubeIconKey,
  parseFcIconKey,
  parseGiIconKey,
  parseLetterIconKey,
  resolveIconSrc,
} from './utils';

export type ExternalLinkIconMediaSize = 'card' | 'field';

const cardAntdClass = 'external-link-card__iconAntd';
const cardRiClass = 'external-link-card__iconRi';
const cardCubeWrapClass = 'external-link-card__iconCubeWrap';

const fieldWrap = (node: React.ReactNode, size: ExternalLinkIconMediaSize) =>
  size === 'field' ? (
    <div className="external-link-icon-field__previewBox">{node}</div>
  ) : (
    node
  );

/** 与 {@link ExternalLinkCard} 中图标逻辑一致，供表单预览等复用 */
export const ExternalLinkIconMedia: React.FC<{
  link: Pick<OtherLink, 'icon' | 'icon_url'>;
  size?: ExternalLinkIconMediaSize;
}> = ({ link, size = 'card' }) => {
  const src = resolveIconSrc(link);
  const iconRaw = link.icon?.trim();

  if (src) {
    return fieldWrap(
      <img
        src={src}
        alt=""
        className="external-link-card__icon"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_LINK_ICON;
        }}
      />,
      size,
    );
  }

  const antd = parseAntdIconKey(iconRaw);
  if (antd && OTHER_LINK_ANTD_ICON_MAP[antd]) {
    const Comp = OTHER_LINK_ANTD_ICON_MAP[antd];
    return fieldWrap(<Comp className={cardAntdClass} />, size);
  }

  const fc = parseFcIconKey(iconRaw);
  if (fc && OTHER_LINK_FC_ICON_MAP[fc]) {
    const Comp = OTHER_LINK_FC_ICON_MAP[fc];
    return fieldWrap(<Comp className={cardRiClass} />, size);
  }

  const gi = parseGiIconKey(iconRaw);
  if (gi && OTHER_LINK_GI_ICON_MAP[gi]) {
    const Comp = OTHER_LINK_GI_ICON_MAP[gi];
    return fieldWrap(<Comp className={cardRiClass} />, size);
  }

  const letter = parseLetterIconKey(iconRaw);
  if (letter) {
    return fieldWrap(<span className="external-link-card__letterIcon">{letter}</span>, size);
  }

  const cube = parseCubeIconKey(iconRaw);
  if (cube) {
    return fieldWrap(
      <span className={cardCubeWrapClass}>
        {CubeIcon(cube, `extlink-cube-${cube}`, {
          fontSize: size === 'field' ? 30 : 40,
          lineHeight: 1,
        })}
      </span>,
      size,
    );
  }

  return fieldWrap(
    <img src={DEFAULT_LINK_ICON} alt="" className="external-link-card__icon" />,
    size,
  );
};
