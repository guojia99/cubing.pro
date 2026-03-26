import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, message, Modal, Spin, theme } from 'antd';
import { CloseOutlined, HeartFilled, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from '@@/exports';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import '@/components/Markdown/github-markdown.css';
import {
  addFavorite,
  isFavorite,
  removeFavorite,
} from '../utils/favoriteStorage';
import {
  addToTonight,
  isInTonight,
  removeFromTonight,
} from '../utils/tonightStorage';
import '../detail.less';
import './RecipeDetailModal.less';

const RECIPES_JSON = '/recipes.json';
const MAX_FAVORITES = 20;
const MAX_TONIGHT = 20;

interface RecipeDetailModalProps {
  open: boolean;
  category: string;
  id: string;
  onClose: () => void;
  onFavoriteChange?: () => void;
  onTonightChange?: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  open,
  category,
  id,
  onClose,
  onFavoriteChange,
  onTonightChange,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const [mdContent, setMdContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [mdPath, setMdPath] = useState<string>('');
  const [favState, setFavState] = useState(false);
  const [tonightState, setTonightState] = useState(false);
  const headingIndexRef = useRef(0);

  useEffect(() => {
    if (open && category && id) {
      setFavState(isFavorite(category, id));
      setTonightState(isInTonight(category, id));
    }
  }, [open, category, id]);

  useEffect(() => {
    if (!open || !category || !id) return;
    setLoading(true);
    const fallbackPath = `dishes/${category}/${id}.md`;

    fetch(RECIPES_JSON)
      .then((r) => r.json())
      .then((data) => {
        const recipe = data.recipes?.find(
          (r: { category: string; id: string }) => r.category === category && r.id === id,
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
  }, [open, category, id]);

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
              onClose();
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
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      const id = getHeadingId();
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      const id = getHeadingId();
      return <h3 id={id} {...props}>{children}</h3>;
    },
    h4({ children, ...props }) {
      const id = getHeadingId();
      return <h4 id={id} {...props}>{children}</h4>;
    },
  };

  const handleFavoriteClick = () => {
    if (favState) {
      removeFavorite(category, id);
      setFavState(false);
    } else {
      const added = addFavorite(category, id);
      if (added) {
        setFavState(true);
      } else {
        message.warning(`最多收藏 ${MAX_FAVORITES} 道菜`);
      }
    }
    onFavoriteChange?.();
  };

  const handleTonightClick = () => {
    if (tonightState) {
      removeFromTonight(category, id);
      setTonightState(false);
      message.success('已从今晚吃啥移除');
    } else {
      const added = addToTonight(category, id);
      if (added) {
        setTonightState(true);
        message.success('已添加到今晚吃啥');
      } else {
        message.warning(`今晚吃啥最多 ${MAX_TONIGHT} 道菜`);
      }
    }
    onTonightChange?.();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="100%"
      className="recipe-detail-modal-fullscreen"
      styles={{
        body: { padding: 0, maxHeight: 'calc(100vh - 110px)', overflow: 'auto' },
        wrapper: { maxWidth: '100%' },
        content: { maxWidth: 900, margin: '24px auto', padding: 0 },
      }}
      centered
      destroyOnClose
      closable={false}
    >
      <div className="recipe-detail-modal-inner" style={{ padding: 24 }}>
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
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ borderRadius: 8 }}
          >
            关闭
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
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
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
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
        )}
      </div>
    </Modal>
  );
};

export default RecipeDetailModal;
