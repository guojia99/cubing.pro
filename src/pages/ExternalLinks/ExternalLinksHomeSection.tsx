import { Link } from '@@/exports';
import { useIntl } from '@@/plugin-locale';
import { getOtherLinks } from '@/services/cubing-pro/public/orgs';
import { emptyOtherLinks } from '@/services/cubing-pro/otherLinksNormalize';
import { Card, Spin, theme } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import type { OtherLinks } from '@/services/cubing-pro/auth/typings';
import ExternalLinkCard from './ExternalLinkCard';
import './ExternalLinks.less';
import { getTopLinks } from './utils';

const ExternalLinksHomeSection: React.FC = () => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const [data, setData] = useState<OtherLinks | null>(null);
  const [loading, setLoading] = useState(true);

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

  const tops = data ? getTopLinks(data) : [];
  const hasLinks = data ? (data.links?.length ?? 0) > 0 : false;

  if (!loading && !hasLinks) {
    return null;
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        marginBottom: 24,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div className="external-links-home">
        <div className="external-links-home__head">
          <div className="external-links-home__title" style={{ color: token.colorTextHeading }}>
            {intl.formatMessage({ id: 'menu.ExternalLinks.homeSectionTitle' })}
          </div>
          <Link to="/external-links" style={{ fontSize: 14 }}>
            {intl.formatMessage({ id: 'menu.ExternalLinks.viewAll' })}
          </Link>
        </div>
        <Spin spinning={loading}>
          {tops.length > 0 ? (
            <div className="external-links-home__grid">
              {tops.map((l) => (
                <ExternalLinkCard key={l.key} link={l} />
              ))}
            </div>
          ) : (
            !loading && (
              <div style={{ fontSize: 14, color: token.colorTextSecondary, lineHeight: 1.6 }}>
                {intl.formatMessage({ id: 'menu.ExternalLinks.homeTip' })}
              </div>
            )
          )}
        </Spin>
      </div>
    </Card>
  );
};

export default ExternalLinksHomeSection;
