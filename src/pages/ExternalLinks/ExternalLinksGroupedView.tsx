import { useIntl } from '@@/plugin-locale';
import type { OtherLinks } from '@/services/cubing-pro/auth/typings';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import ExternalLinkCard from './ExternalLinkCard';
import './ExternalLinks.less';
import { buildGroupSections, filterGroupSectionsByQuery } from './utils';

/** 与前台「魔方导航 / Cubing Hub」单页一致：一行最多 4 列（窄屏递减） */
export const EXTERNAL_LINKS_LIST_GRID_CLASS = 'external-links-grid--max4';

/** 与前台一致：描述最多展示字数（卡片内完整展示，超出截断） */
export const EXTERNAL_LINKS_LIST_DESC_MAX = 128;

type Props = {
  data: OtherLinks;
  /** 默认与前台魔方导航页相同，一般无需传入 */
  gridClassName?: string;
  descMaxChars?: number;
  /** 前台搜索：按分组名与链接字段过滤 */
  searchQuery?: string;
};

const ExternalLinksGroupedView: React.FC<Props> = ({
  data,
  gridClassName = EXTERNAL_LINKS_LIST_GRID_CLASS,
  descMaxChars = EXTERNAL_LINKS_LIST_DESC_MAX,
  searchQuery = '',
}) => {
  const intl = useIntl();
  const sections = useMemo(() => {
    const raw = buildGroupSections(data, false);
    return filterGroupSectionsByQuery(raw, searchQuery);
  }, [data, searchQuery]);

  if (sections.length === 0) {
    if (searchQuery.trim()) {
      return (
        <Empty
          className="external-links-search-empty"
          description={intl.formatMessage({ id: 'menu.ExternalLinks.searchEmpty' })}
        />
      );
    }
    return null;
  }
  return (
    <div className="external-links-page">
      {sections.map((s) => (
        <section key={s.title} className="external-links-group">
          <div className="external-links-group-shell">
            <h2 className="external-links-groupTitle">{s.title}</h2>
            <div className={classNames('external-links-grid', gridClassName)}>
              {s.links.map((l) => (
                <ExternalLinkCard key={l.key} link={l} descMaxChars={descMaxChars} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default ExternalLinksGroupedView;
