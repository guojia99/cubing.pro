import React, { useEffect, useRef, useState } from 'react';
import { Anchor, Button, Image, message, Spin, theme } from 'antd';
import { ArrowLeftOutlined, HeartFilled, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from '@@/exports';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import '@/components/Markdown/github-markdown.css';
import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from './utils/favoriteStorage';
import {
  addToTonight,
  isInTonight,
  removeFromTonight,
} from './utils/tonightStorage';
import './detail.less';

const RECIPES_JSON = '/recipes.json';
const MAX_FAVORITES = 20;
const MAX_TONIGHT = 20;

const RecipeDetail: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { category, id } = useParams<{ category: string; id: string }>();
  const contentRef = useRef<HTMLDivElement>(null);

  const [mdContent, setMdContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [mdPath, setMdPath] = useState<string>('');
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);
  const headingIndexRef = useRef(0);

  useEffect(() => {
    if (category && id) {
      const cat = decodeURIComponent(category);
      const rid = decodeURIComponent(id);
      setFavState(isFavorite(cat, rid));
      setTonightState(isInTonight(cat, rid));
    }
  }, [category, id]);

  useEffect(() => {
    if (!category || !id) return;
    const cat = decodeURIComponent(category);
    const rid = decodeURIComponent(id);

    const fallbackPath = `dishes/${cat}/${rid}.md`;

    fetch(RECIPES_JSON)
      .then((r) => r.json())
      .then((data) => {
        const recipe = data.recipes?.find(
          (r: { category: string; id: string }) => r.category === cat && r.id === rid,
        );
        return recipe?.mdPath || fallbackPath;
      })
      .catch(() => fallbackPath)
      .then((path) => {
        setMdPath(path);
        return fetch(`/HowToCook/${path}`);
      })
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.text();
      })
      .then((text) => {
        const cleaned = text.replace(
          /\n*如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。\s*$/,
          '',
        );
        setMdContent(cleaned);
        extractHeadings(cleaned);
      })
      .catch(() => setMdContent('# 菜谱加载失败\n请检查链接是否正确。'))
      .finally(() => setLoading(false));
  }, [category, id]);

  const baseDir = mdPath ? mdPath.replace(/\/[^/]+\.md$/, '/') : '';

  function extractHeadings(text: string) {
    const items: { id: string; text: string; level: number }[] = [];
    const lines = text.split('\n');
    const seen = new Set<string>();
    for (const line of lines) {
      const m = line.match(/^(#{1,6})\s+(.+)$/);
      if (m) {
        const level = m[1].length;
        const text = m[2].trim();
        let baseId = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 30);
        let id = baseId;
        let n = 0;
        while (seen.has(id)) {
          n += 1;
          id = `${baseId}-${n}`;
        }
        seen.add(id);
        items.push({ id, text, level });
      }
    }
    setHeadings(items);
  }

  const imageBase = baseDir ? `/HowToCook/${baseDir}` : '/HowToCook/dishes/';

  const getHeadingId = () => {
    const idx = headingIndexRef.current;
    headingIndexRef.current += 1;
    return headings[idx]?.id ?? `h-${idx}`;
  };
  headingIndexRef.current = 0;

  const resolveTipsLink = (href: string | undefined): { category: string; id: string } | null => {
    if (!href || !href.endsWith('.md')) return null;
    const match = href.match(/tips\/([^/]+)\/([^/]+)\.md$/);
    if (match) {
      return { category: match[1], id: match[2] };
    }
    return null;
  };

  const mdComponents: Components = {
    a({ href, children, ...props }) {
      const tipsTarget = resolveTipsLink(href ?? undefined);
      if (tipsTarget) {
        return (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(
                `/other/kitchen-skills/${encodeURIComponent(tipsTarget.category)}/${encodeURIComponent(tipsTarget.id)}`,
              );
            }}
            style={{ color: token.colorPrimary }}
            {...props}
          >
            {children}
          </a>
        );
      }
      if (href?.startsWith('#')) {
        return <a href={href} {...props}>{children}</a>;
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img({ src, alt }) {
      if (!src) return null;
      let fullSrc = src;
      if (src.startsWith('./')) {
        fullSrc = `${imageBase}${src.slice(1)}`;
      } else if (!src.startsWith('http') && !src.startsWith('/')) {
        fullSrc = `${imageBase}${src}`;
      }
      return (
        <Image
          src={fullSrc}
          alt={alt || ''}
          style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }}
          preview={{
            mask: '点击放大',
          }}
        />
      );
    },
    h1({ children, ...props }) {
      const id = getHeadingId();
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }) {
      const id = getHeadingId();
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }) {
      const id = getHeadingId();
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    h4({ children, ...props }) {
      const id = getHeadingId();
      return (
        <h4 id={id} {...props}>
          {children}
        </h4>
      );
    },
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const anchorItems = headings.map((h) => ({
    key: h.id,
    href: `#${h.id}`,
    title: h.text,
  }));

  const handleFavoriteClick = () => {
    if (!category || !id) return;
    const cat = decodeURIComponent(category);
    const rid = decodeURIComponent(id);
    if (favState) {
      removeFavorite(cat, rid);
      setFavState(false);
    } else {
      const added = addFavorite(cat, rid);
      if (added) {
        setFavState(true);
      } else {
        message.warning(`最多收藏 ${MAX_FAVORITES} 道菜`);
      }
    }
  };

  const handleTonightClick = () => {
    if (!category || !id) return;
    const cat = decodeURIComponent(category);
    const rid = decodeURIComponent(id);
    if (tonightState) {
      removeFromTonight(cat, rid);
      setTonightState(false);
      message.success('已从今晚吃啥移除');
    } else {
      const added = addToTonight(cat, rid);
      if (added) {
        setTonightState(true);
        message.success('已添加到今晚吃啥');
      } else {
        message.warning(`今晚吃啥最多 ${MAX_TONIGHT} 道菜`);
      }
    }
  };

  return (
    <div className="recipe-detail-page" style={{ padding: 24 }}>
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
          onClick={() => navigate('/other/recipes')}
          style={{ borderRadius: 8 }}
        >
          返回列表
        </Button>
        <Button
          type={tonightState ? 'primary' : 'default'}
          icon={<ShoppingCartOutlined />}
          onClick={handleTonightClick}
          style={{ borderRadius: 8 }}
        >
          {tonightState ? '已在今晚吃啥' : '添加到今晚吃啥'}
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

      <div className="recipe-detail-layout" style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={contentRef}
            className="markdown-body recipe-detail-content"
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
              components={mdComponents}
            >
              {mdContent}
            </ReactMarkdown>
          </div>
        </div>

        {headings.length > 0 && (
          <div
            className="recipe-detail-anchor"
            style={{
              width: 200,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
              alignSelf: 'flex-start',
            }}
          >
            <Anchor
              affix={false}
              items={anchorItems}
              offsetTop={80}
              style={{ borderRadius: 8 }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;
