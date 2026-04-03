import { useIntl } from '@@/plugin-locale';
import { getOtherLinks } from '@/services/cubing-pro/public/orgs';
import { PageContainer } from '@ant-design/pro-components';
import { Empty, Input, Spin } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import type { OtherLinks } from '@/services/cubing-pro/auth/typings';
import { emptyOtherLinks } from '@/services/cubing-pro/otherLinksNormalize';
import ExternalLinksGroupedView from './ExternalLinksGroupedView';
import './ExternalLinks.less';
import { buildGroupSections } from './utils';

const ExternalLinksPage: React.FC = () => {
  const intl = useIntl();
  const [data, setData] = useState<OtherLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getOtherLinks();
      setData(d ?? emptyOtherLinks());
    } catch {
      setData(emptyOtherLinks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empty = data !== null && buildGroupSections(data, false).length === 0;

  return (
    <PageContainer
      title={intl.formatMessage({ id: 'menu.ExternalLinks' })}
      subTitle={intl.formatMessage({ id: 'menu.ExternalLinks.subtitle' })}
    >
      <Spin spinning={loading}>
        {empty ? (
          <Empty description={intl.formatMessage({ id: 'menu.ExternalLinks.empty' })} />
        ) : (
          data && (
            <div className="external-links-page-wrap">
              <Input.Search
                allowClear
                className="external-links-page__search"
                placeholder={intl.formatMessage({ id: 'menu.ExternalLinks.searchPlaceholder' })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ExternalLinksGroupedView data={data} searchQuery={search} />
            </div>
          )
        )}
      </Spin>
    </PageContainer>
  );
};

export default ExternalLinksPage;
