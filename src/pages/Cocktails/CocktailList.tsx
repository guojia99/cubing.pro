import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  message,
  Pagination,
  Select,
  Segmented,
  Spin,
  theme,
} from 'antd';
import { useNavigate } from '@@/exports';
import {
  DownOutlined,
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
  SmileOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { Cocktail } from './types';
import CocktailTonightPickModal from './components/CocktailTonightPickModal';
import CocktailTonightReceipt from './components/CocktailTonightReceipt';
import { getCategoryLabelZh } from './categoryZh';
import { getCocktailZhName } from './cocktailNameZhMap';
import {
  addCocktailFavorite,
  getCocktailFavorites,
  isCocktailFavorite,
  removeCocktailFavorite,
} from './utils/cocktailFavoriteStorage';
import {
  addCocktailToTonight,
  getCocktailTonightList,
  isCocktailInTonight,
  removeCocktailFromTonight,
} from './utils/cocktailTonightStorage';
import '@/pages/Recipes/index.less';

const COCKTAILS_JSON = '/iba/cocktails.json';
const MAX_FAVORITES = 20;
const MAX_TONIGHT = 20;
const PAGE_SIZE = 15;

const CocktailCard: React.FC<{
  cocktail: Cocktail;
  onClick: () => void;
  isFav: boolean;
  onFavoriteChange: () => void;
  isInTonight: boolean;
  onTonightChange: () => void;
  inTonightMode?: boolean;
}> = ({ cocktail, onClick, isFav, onFavoriteChange, isInTonight, onTonightChange, inTonightMode }) => {
  const { token } = theme.useToken();
  const zh = getCocktailZhName(cocktail.slug, cocktail.name);
  const imgSrc = cocktail.image_path ? `/iba/${cocktail.image_path}` : '';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeCocktailFavorite(cocktail.slug);
      onFavoriteChange();
    } else {
      const added = addCocktailFavorite(cocktail.slug);
      if (added) {
        onFavoriteChange();
      } else {
        message.warning(`最多收藏 ${MAX_FAVORITES} 款`);
      }
    }
  };

  const handleTonightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inTonightMode) {
      removeCocktailFromTonight(cocktail.slug);
      onTonightChange();
    } else if (isInTonight) {
      removeCocktailFromTonight(cocktail.slug);
      onTonightChange();
    } else {
      const added = addCocktailToTonight(cocktail.slug);
      if (added) {
        onTonightChange();
        message.success('已添加到今晚喝什么');
      } else {
        message.warning(`今晚喝什么最多 ${MAX_TONIGHT} 款`);
      }
    }
  };

  const descPreview = (cocktail.ingredients ?? []).slice(0, 3).join('、') || '—';

  return (
    <div className="recipe-card-wrapper" style={{ height: '100%' }}>
      <Card
        hoverable
        className="recipe-card"
        onClick={onClick}
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${token.colorBorderSecondary}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div
          className="recipe-card-tonight-btn"
          onClick={handleTonightClick}
          style={{
            position: 'absolute',
            top: 12,
            right: 54,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}
          title={inTonightMode ? '从清单移除' : isInTonight ? '从今晚喝什么移除' : '添加到今晚喝什么'}
        >
          <ShoppingCartOutlined
            style={{
              color: isInTonight ? token.colorPrimary : token.colorTextSecondary,
              fontSize: 18,
            }}
          />
        </div>
        <div
          className="recipe-card-fav-btn"
          onClick={handleFavoriteClick}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}
        >
          {isFav ? (
            <HeartFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
          ) : (
            <HeartOutlined style={{ color: token.colorTextSecondary, fontSize: 18 }} />
          )}
        </div>
        {imgSrc ? (
          <div className="recipe-card-cover" style={{ flexShrink: 0 }}>
            <img
              src={imgSrc}
              alt={zh}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: 350, objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14'%3E暂无图片%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        ) : (
          <div
            className="recipe-card-no-cover"
            style={{
              flexShrink: 0,
              height: 350,
              background: `linear-gradient(135deg, ${token.colorPrimary}08 0%, ${token.colorPrimary}03 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              color: token.colorTextTertiary,
            }}
          >
            🍸
          </div>
        )}
        <div
          className="recipe-card-body"
          style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div
            className="recipe-card-title"
            style={{
              fontSize: imgSrc ? 16 : 20,
              fontWeight: 600,
              color: token.colorTextHeading,
              marginBottom: 4,
            }}
          >
            {zh}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 8 }}>
            {cocktail.name}
          </div>
          <div
            className="recipe-card-desc"
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
            {descPreview}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: token.colorTextTertiary }}>
            {getCategoryLabelZh(cocktail.category)}
          </div>
        </div>
      </Card>
    </div>
  );
};

const CocktailList: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [listMode, setListMode] = useState<'all' | 'favorites' | 'tonight'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pickModalOpen, setPickModalOpen] = useState(false);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [tonightVersion, setTonightVersion] = useState(0);
  const [receiptCollapsed, setReceiptCollapsed] = useState(false);

  const favorites = useCallback(() => getCocktailFavorites(), [favoritesVersion]);
  const refreshFavorites = useCallback(() => setFavoritesVersion((v) => v + 1), []);
  const tonightList = useCallback(() => getCocktailTonightList(), [tonightVersion]);
  const refreshTonight = useCallback(() => setTonightVersion((v) => v + 1), []);

  useEffect(() => {
    fetch(COCKTAILS_JSON)
      .then((r) => r.json())
      .then((data: Cocktail[]) => setCocktails(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (listMode === 'tonight') {
      refreshTonight();
    }
  }, [listMode, refreshTonight]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && listMode === 'tonight') {
        refreshTonight();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [listMode, refreshTonight]);

  const favList = favorites();
  const tonightRecipesList = tonightList();

  const baseList =
    listMode === 'favorites'
      ? cocktails.filter((c) => favList.some((f) => f.slug === c.slug))
      : listMode === 'tonight'
        ? cocktails.filter((c) => tonightRecipesList.some((t) => t.slug === c.slug))
        : cocktails;

  const filtered = baseList.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, listMode]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardClick = (c: Cocktail) => {
    navigate(`/other/cocktails/${encodeURIComponent(c.slug)}`);
  };

  const categorySelectOptions = useMemo(() => {
    const cats = [...new Set(cocktails.map((c) => c.category))];
    return cats.map((c) => ({ value: c, label: getCategoryLabelZh(c) }));
  }, [cocktails]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="recipe-list-page" style={{ padding: '16px 24px', maxWidth: 1600, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        {listMode !== 'tonight' && (
          <Select
            placeholder="全部分类"
            allowClear
            style={{ width: 160, borderRadius: 8 }}
            value={filterCategory || undefined}
            onChange={(v) => setFilterCategory(v ?? '')}
            options={categorySelectOptions}
          />
        )}
        <Segmented
          value={
            listMode === 'favorites' ? '我喜欢的' : listMode === 'tonight' ? '今晚喝什么' : '全部'
          }
          onChange={(v) =>
            setListMode(
              v === '我喜欢的' ? 'favorites' : v === '今晚喝什么' ? 'tonight' : 'all',
            )
          }
          options={[
            { label: '全部', value: '全部' },
            {
              label: `我喜欢的${favList.length ? ` (${favList.length})` : ''}`,
              value: '我喜欢的',
            },
            {
              label: `今晚喝什么${tonightRecipesList.length ? ` (${tonightRecipesList.length})` : ''}`,
              value: '今晚喝什么',
            },
          ]}
          style={{ borderRadius: 8 }}
        />
        <Button
          type="primary"
          icon={<SmileOutlined />}
          onClick={() => setPickModalOpen(true)}
          style={{ borderRadius: 8 }}
        >
          今晚喝什么
        </Button>
      </div>

      {listMode === 'tonight' ? (
        <div className="recipe-tonight-layout">
          <div className={`recipe-tonight-receipt-wrap ${receiptCollapsed ? 'collapsed' : ''}`}>
            <div className="recipe-tonight-receipt-inner">
              <CocktailTonightReceipt
                key={tonightVersion}
                cocktails={cocktails}
                tonightList={tonightRecipesList}
                onClear={refreshTonight}
              />
            </div>
            <Button
              type="text"
              size="small"
              className="recipe-tonight-receipt-toggle"
              icon={receiptCollapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={() => setReceiptCollapsed(!receiptCollapsed)}
            >
              {receiptCollapsed ? '展开小票' : '收起小票'}
            </Button>
          </div>
          <div className="recipe-tonight-recipes">
            {filtered.length === 0 ? (
              <Empty description="暂无酒款，去添加吧" />
            ) : (
              <div className="recipe-grid recipe-grid-responsive">
                {filtered.map((c) => (
                  <CocktailCard
                    key={c.slug}
                    cocktail={c}
                    onClick={() => handleCardClick(c)}
                    isFav={isCocktailFavorite(c.slug)}
                    onFavoriteChange={refreshFavorites}
                    isInTonight={isCocktailInTonight(c.slug)}
                    onTonightChange={refreshTonight}
                    inTonightMode
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Empty description="暂无匹配的酒款" />
      ) : (
        <>
          <div className="recipe-grid recipe-grid-responsive">
            {paginated.map((c) => (
              <CocktailCard
                key={c.slug}
                cocktail={c}
                onClick={() => handleCardClick(c)}
                isFav={isCocktailFavorite(c.slug)}
                onFavoriteChange={refreshFavorites}
                isInTonight={isCocktailInTonight(c.slug)}
                onTonightChange={refreshTonight}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={currentPage}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total) => `共 ${total} 款`}
                style={{ marginBottom: 24 }}
              />
            </div>
          )}
        </>
      )}

      <CocktailTonightPickModal
        open={pickModalOpen}
        onClose={() => setPickModalOpen(false)}
        cocktails={cocktails}
      />
    </div>
  );
};

export default CocktailList;
