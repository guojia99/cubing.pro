import React, { useEffect, useState } from 'react';
import { Button, Image, List, Spin, Typography, message, theme } from 'antd';
import {
  ArrowLeftOutlined,
  ExportOutlined,
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from '@@/exports';
import type { Cocktail } from './types';
import { getCategoryLabelZh } from './categoryZh';
import { getCocktailZhName } from './cocktailNameZhMap';
import {
  addCocktailFavorite,
  isCocktailFavorite,
  removeCocktailFavorite,
} from './utils/cocktailFavoriteStorage';
import {
  addCocktailToTonight,
  isCocktailInTonight,
  removeCocktailFromTonight,
} from './utils/cocktailTonightStorage';
import CocktailFirstVisitModal from './components/CocktailFirstVisitModal';
import './cocktailDetail.less';

const COCKTAILS_JSON = '/iba/cocktails.json';
const MAX_FAVORITES = 20;
const MAX_TONIGHT = 20;

const { Title, Paragraph, Text } = Typography;

const CocktailDetail: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam ? decodeURIComponent(slugParam) : '';

  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setFavState(isCocktailFavorite(slug));
    setTonightState(isCocktailInTonight(slug));
    fetch(COCKTAILS_JSON)
      .then((r) => r.json())
      .then((data: Cocktail[]) => {
        const c = Array.isArray(data) ? data.find((x) => x.slug === slug) : undefined;
        setCocktail(c ?? null);
      })
      .catch(() => setCocktail(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFavoriteClick = () => {
    if (!slug) return;
    if (favState) {
      removeCocktailFavorite(slug);
      setFavState(false);
    } else {
      const added = addCocktailFavorite(slug);
      if (added) {
        setFavState(true);
      } else {
        message.warning(`最多收藏 ${MAX_FAVORITES} 款`);
      }
    }
  };

  const handleTonightClick = () => {
    if (!slug) return;
    if (tonightState) {
      removeCocktailFromTonight(slug);
      setTonightState(false);
      message.success('已从今晚喝什么移除');
    } else {
      const added = addCocktailToTonight(slug);
      if (added) {
        setTonightState(true);
        message.success('已添加到今晚喝什么');
      } else {
        message.warning(`今晚喝什么最多 ${MAX_TONIGHT} 款`);
      }
    }
  };

  if (loading) {
    return (
      <>
        <CocktailFirstVisitModal />
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  if (!cocktail) {
    return (
      <>
        <CocktailFirstVisitModal />
        <div style={{ padding: 24 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/other/cocktails')}>
            返回列表
          </Button>
          <Paragraph style={{ marginTop: 24 }}>未找到该酒款，请检查链接。</Paragraph>
        </div>
      </>
    );
  }

  const zh = getCocktailZhName(cocktail.slug, cocktail.name);
  const imgSrc = cocktail.image_path ? `/iba/${cocktail.image_path}` : '';

  return (
    <>
      <CocktailFirstVisitModal />
      <div className="cocktail-detail-page" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/other/cocktails')}
          style={{ borderRadius: 8 }}
        >
          返回列表
        </Button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type={tonightState ? 'primary' : 'default'}
            icon={<ShoppingCartOutlined />}
            onClick={handleTonightClick}
            style={{ borderRadius: 8 }}
          >
            {tonightState ? '已在今晚喝什么' : '添加到今晚喝什么'}
          </Button>
          <Button
            type={favState ? 'primary' : 'default'}
            icon={favState ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleFavoriteClick}
            style={{ borderRadius: 8 }}
          >
            {favState ? '已收藏' : '收藏'}
          </Button>
        </div>
      </div>

      <div
        className="cocktail-detail-card"
        style={{
          borderRadius: 12,
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 24,
        }}
      >
        <div className="cocktail-detail-head" style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            {zh}
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            {cocktail.name} · {getCategoryLabelZh(cocktail.category)}
          </Text>
          {cocktail.source_url && (
            <div style={{ marginTop: 12 }}>
              <a href={cocktail.source_url} target="_blank" rel="noreferrer">
                <ExportOutlined /> IBA 原文
              </a>
            </div>
          )}
        </div>

        {imgSrc && (
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Image
              src={imgSrc}
              alt={zh}
              style={{
                width: '100%',
                maxWidth: 480,
                height: 350,
                objectFit: 'cover',
                borderRadius: 8,
              }}
              preview={{ mask: '点击放大' }}
            />
          </div>
        )}

        <Title level={4}>材料</Title>
        <List
          size="small"
          dataSource={cocktail.ingredients ?? []}
          renderItem={(item) => <List.Item style={{ paddingLeft: 0 }}>{item}</List.Item>}
          style={{ marginBottom: 24 }}
        />

        <Title level={4}>调制方法</Title>
        <List
          size="small"
          dataSource={cocktail.method ?? []}
          renderItem={(item, i) => (
            <List.Item style={{ paddingLeft: 0 }}>
              <Text strong>{i + 1}. </Text>
              {item}
            </List.Item>
          )}
          style={{ marginBottom: 24 }}
        />

        <Title level={4}>装饰</Title>
        <List
          size="small"
          dataSource={cocktail.garnish ?? []}
          renderItem={(item) => <List.Item style={{ paddingLeft: 0 }}>{item}</List.Item>}
        />
      </div>
    </div>
    </>
  );
};

export default CocktailDetail;
