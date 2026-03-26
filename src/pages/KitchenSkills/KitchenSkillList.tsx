import React, { useEffect, useState } from 'react';
import { Card, Empty, Select, Spin, theme } from 'antd';
import { useNavigate } from '@@/exports';
import type { KitchenTip, KitchenTipsData } from './types';
import './index.less';

const TIPS_JSON = '/tips.json';

const TipCard: React.FC<{
  tip: KitchenTip;
  onClick: () => void;
}> = ({ tip, onClick }) => {
  const { token } = theme.useToken();
  const displayName = tip.title;

  return (
    <Card
      hoverable
      className="tip-card"
      onClick={onClick}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: token.colorTextHeading,
          marginBottom: 8,
        }}
      >
        {displayName}
      </div>
      <div
        style={{
          fontSize: 13,
          color: token.colorTextSecondary,
          lineHeight: 1.5,
          height: 40,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {tip.description || '暂无描述'}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: token.colorTextTertiary,
        }}
      >
        {tip.categoryName}
      </div>
    </Card>
  );
};

const KitchenSkillList: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [data, setData] = useState<KitchenTipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    fetch(TIPS_JSON)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const tips = data?.tips ?? [];
  const categories = data?.categories ?? [];

  const filteredTips = tips.filter((t) => {
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  const handleCardClick = (tip: KitchenTip) => {
    navigate(`/other/kitchen-skills/${encodeURIComponent(tip.category)}/${encodeURIComponent(tip.id)}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="kitchen-skill-list-page" style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Select
          placeholder="全部分类"
          allowClear
          style={{ width: 140, borderRadius: 8 }}
          value={filterCategory || undefined}
          onChange={(v) => setFilterCategory(v ?? '')}
          options={categories.map((c) => ({
            value: c,
            label: tips.find((t) => t.category === c)?.categoryName ?? c,
          }))}
        />
      </div>

      {filteredTips.length === 0 ? (
        <Empty description="暂无厨房技能" />
      ) : (
        <div className="tip-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredTips.map((tip) => (
            <TipCard
              key={`${tip.category}-${tip.id}`}
              tip={tip}
              onClick={() => handleCardClick(tip)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenSkillList;
