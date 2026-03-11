import { getIntl } from '@@/exports';
import { Avatar, Button, Card, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import { WCALink } from '@/components/Link/Links';
import { getAcknowledgments } from '@/services/cubing-pro/public/orgs';
import { Thank } from '@/services/cubing-pro/auth/typings';
import { apiGetWCAPersonProfile } from '@/services/cubing-pro/wca/wca_api';

const intl = getIntl();

const DEFAULT_AVATAR =
  'https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png';

export type ThanksPerson = {
  wcaID: string;
  nickname: string;
  amount: number;
  avatar?: string;
};

const MAX_VISIBLE = 12;

function hasValidWcaId(wcaID: string): boolean {
  return !!wcaID && wcaID !== '-' && wcaID.length === 10;
}

function thankToThanksPerson(t: Thank): ThanksPerson {
  return {
    wcaID: t.wcaID ?? '',
    nickname: t.nickname ?? '',
    amount: t.amount ?? 0,
    avatar: t.avatar || undefined,
  };
}

/**
 * 获取头像 URL：优先使用 JSON 中的 avatar，否则从 WCA API 拉取
 */
function getAvatarUrl(
  person: ThanksPerson,
  avatarCache: Record<string, string>,
): string {
  if (person.avatar) return person.avatar;
  if (avatarCache[person.wcaID]) return avatarCache[person.wcaID];
  return DEFAULT_AVATAR;
}

/**
 * 致谢栏 - 感谢支持者的赞助
 */
const ThanksSection: React.FC<{ data?: Thank[] }> = ({ data }) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const [thanksList, setThanksList] = useState<ThanksPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const list = data ?? (await getAcknowledgments());
        setThanksList(list.map(thankToThanksPerson));
      } catch (err) {
        console.warn('Failed to fetch acknowledgments:', err);
        setThanksList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [data]);

  const hasMore = thanksList.length > MAX_VISIBLE;
  const displayList = expanded ? thanksList : thanksList.slice(0, MAX_VISIBLE);

  // 对没有头像的致谢人，从 WCA API 异步拉取头像
  useEffect(() => {
    const toFetch = thanksList.filter((p) => !p.avatar && p.wcaID?.length === 10);
    toFetch.forEach((person) => {
      apiGetWCAPersonProfile(person.wcaID)
        .then((res) => {
          const url = res.person?.avatar?.thumb_url;
          if (url) {
            setAvatarCache((prev) => ({ ...prev, [person.wcaID]: url }));
          }
        })
        .catch((err) => {
          console.warn(`Failed to fetch avatar for ${person.wcaID}:`, err);
        });
    });
  }, [thanksList]);

  if (loading || thanksList.length === 0) return null;

  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: '20px',
          color: token.colorTextHeading,
          marginBottom: 4,
        }}
      >
        {intl.formatMessage({ id: 'home.thanks.title' })}
      </div>
      <div
        style={{
          fontSize: 12,
          color: token.colorTextTertiary,
          marginBottom: 16,
        }}
      >
        {intl.formatMessage({ id: 'home.thanks.sponsorNote' })}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {displayList.map((person, index) => (
          <div
            key={hasValidWcaId(person.wcaID) ? person.wcaID : `anon-${index}`}
            style={{
              backgroundColor: token.colorBgContainer,
              boxShadow: token.boxShadow,
              borderRadius: 8,
              padding: 16,
              minWidth: 160,
              flex: '1 1 160px',
              maxWidth: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Avatar
              src={getAvatarUrl(person, avatarCache)}
              alt={person.nickname}
              size={56}
              style={{ flexShrink: 0 }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: token.colorText, marginBottom: 2 }}>
                {hasValidWcaId(person.wcaID)
                  ? WCALink(person.wcaID, person.nickname)
                  : person.nickname}
              </div>
              {hasValidWcaId(person.wcaID) && (
                <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 4 }}>
                  {person.wcaID}
                </div>
              )}
              <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                ¥{person.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button type="link" onClick={() => setExpanded(!expanded)}>
            {expanded
              ? intl.formatMessage({ id: 'home.thanks.collapse' })
              : intl.formatMessage({ id: 'home.thanks.expand' }, { count: thanksList.length - MAX_VISIBLE })}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ThanksSection;
