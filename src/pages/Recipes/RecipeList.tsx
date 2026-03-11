import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Image, message, Select, Segmented, Spin, theme } from 'antd';
import { useNavigate } from '@@/exports';
import { HeartFilled, HeartOutlined, SmileOutlined } from '@ant-design/icons';
import type { Recipe, RecipesData } from './types';
import TodayPickModal from './components/TodayPickModal';
import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
} from './utils/favoriteStorage';
import './index.less';

const RECIPES_JSON = '/recipes.json';
const DATA_SOURCE_URL = 'https://github.com/Anduin2017/HowToCook';
const MAX_FAVORITES = 20;

const RecipeCard: React.FC<{
  recipe: Recipe;
  onClick: () => void;
  isFav: boolean;
  onFavoriteChange: () => void;
}> = ({ recipe, onClick, isFav, onFavoriteChange }) => {
  const { token } = theme.useToken();
  const hasImage = recipe.hasImage && recipe.coverImage;
  const coverImg = hasImage ? `/HowToCook/${recipe.coverImage}` : '';
  const displayName = recipe.title.replace(/的做法$/, '');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFavorite(recipe.category, recipe.id);
      onFavoriteChange();
    } else {
      const added = addFavorite(recipe.category, recipe.id);
      if (added) {
        onFavoriteChange();
      } else {
        message.warning(`最多收藏 ${MAX_FAVORITES} 道菜`);
      }
    }
  };

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
        {coverImg ? (
          <div className="recipe-card-cover" style={{ flexShrink: 0 }}>
            <Image
              src={coverImg}
              alt={recipe.title}
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14'%3E暂无图片%3C/text%3E%3C/svg%3E"
              preview={false}
              style={{ width: '100%', height: 160, objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div
            className="recipe-card-no-cover"
            style={{
              flexShrink: 0,
              height: 160,
              background: `linear-gradient(135deg, ${token.colorPrimary}08 0%, ${token.colorPrimary}03 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              color: token.colorTextTertiary,
            }}
          >
            🍳
          </div>
        )}
        <div className="recipe-card-body" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            className="recipe-card-title"
            style={{
              fontSize: coverImg ? 16 : 20,
              fontWeight: 600,
              color: token.colorTextHeading,
              marginBottom: 8,
            }}
          >
            {displayName}
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
            {recipe.description || '暂无描述'}
          </div>
          <div
            className="recipe-card-stars"
            style={{ marginTop: 8, color: token.colorWarning }}
          >
            {'★'.repeat(recipe.difficulty)}
            {'☆'.repeat(5 - recipe.difficulty)}
            <span style={{ marginLeft: 6, fontSize: 12, color: token.colorTextTertiary }}>
              {recipe.difficulty}星
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const RecipeList: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [data, setData] = useState<RecipesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<number | ''>('');
  const [showOnlyWithImage, setShowOnlyWithImage] = useState(false);
  const [listMode, setListMode] = useState<'all' | 'favorites'>('all');
  const [todayPickModalOpen, setTodayPickModalOpen] = useState(false);
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  const favorites = useCallback(() => getFavorites(), [favoritesVersion]);
  const refreshFavorites = useCallback(() => setFavoritesVersion((v) => v + 1), []);

  useEffect(() => {
    fetch(RECIPES_JSON)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const recipes = data?.recipes ?? [];
  const categories = data?.categories ?? [];
  const favList = favorites();

  const baseRecipes =
    listMode === 'favorites'
      ? recipes.filter((r) => favList.some((f) => f.category === r.category && f.id === r.id))
      : recipes;

  const filteredRecipes = baseRecipes.filter((r) => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterDifficulty !== '' && r.difficulty !== filterDifficulty) return false;
    if (showOnlyWithImage && !r.hasImage) return false;
    return true;
  });

  const handleCardClick = (recipe: Recipe) => {
    navigate(`/recipes/${encodeURIComponent(recipe.category)}/${encodeURIComponent(recipe.id)}`);
  };

  const handleTodayPick = () => {
    setTodayPickModalOpen(true);
  };

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
        <Select
          placeholder="全部分类"
          allowClear
          style={{ width: 140, borderRadius: 8 }}
          value={filterCategory || undefined}
          onChange={(v) => setFilterCategory(v ?? '')}
          options={[
            ...new Map(
              recipes.map((r) => [r.category, { value: r.category, label: r.categoryName }]),
            ).values(),
          ].filter((o) => o.value !== 'template')}
        />
        <Select
          placeholder="全部难度"
          allowClear
          style={{ width: 120, borderRadius: 8 }}
          value={filterDifficulty === '' ? undefined : filterDifficulty}
          onChange={(v) => setFilterDifficulty(v ?? '')}
          options={[1, 2, 3, 4, 5].map((d) => ({
            value: d,
            label: `${d}星`,
          }))}
        />
        <Segmented
          value={listMode === 'favorites' ? '我喜欢的' : '全部'}
          onChange={(v) => setListMode(v === '我喜欢的' ? 'favorites' : 'all')}
          options={[
            { label: '全部', value: '全部' },
            { label: `我喜欢的${favList.length ? ` (${favList.length})` : ''}`, value: '我喜欢的' },
          ]}
          style={{ borderRadius: 8 }}
        />
        <Segmented
          value={showOnlyWithImage ? '带图' : '全部'}
          onChange={(v) => setShowOnlyWithImage(v === '带图')}
          options={[
            { label: '全部', value: '全部' },
            { label: '带图', value: '带图' },
          ]}
          style={{ borderRadius: 8 }}
        />
        <Button
          type="primary"
          icon={<SmileOutlined />}
          onClick={handleTodayPick}
          style={{ borderRadius: 8 }}
        >
          今天吃什么
        </Button>
      </div>
      <div
        style={{
          marginBottom: 16,
          fontSize: 13,
          color: token.colorTextTertiary,
        }}
      >
        数据来源：
        <a
          href={DATA_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: 4, color: token.colorPrimary }}
        >
          HowToCook
        </a>
      </div>

      {filteredRecipes.length === 0 ? (
        <Empty description="暂无匹配的菜谱" />
      ) : (
        <div className="recipe-grid recipe-grid-responsive">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={`${recipe.category}-${recipe.id}`}
              recipe={recipe}
              onClick={() => handleCardClick(recipe)}
              isFav={isFavorite(recipe.category, recipe.id)}
              onFavoriteChange={refreshFavorites}
            />
          ))}
        </div>
      )}

      <TodayPickModal
        open={todayPickModalOpen}
        onClose={() => setTodayPickModalOpen(false)}
        data={data}
      />
    </div>
  );
};

export default RecipeList;
