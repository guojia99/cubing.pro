import React, { useEffect, useRef, useState } from 'react';
import { Anchor, Button, Spin, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from '@@/exports';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import '@/components/Markdown/github-markdown.css';
import './detail.less';

const TIPS_JSON = '/tips.json';

const KitchenSkillDetail: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { category, id } = useParams<{ category: string; id: string }>();
  const contentRef = useRef<HTMLDivElement>(null);

  const [mdContent, setMdContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const headingIndexRef = useRef(0);

  useEffect(() => {
    if (!category || !id) return;
    const cat = decodeURIComponent(category);
    const rid = decodeURIComponent(id);

    const fallbackPath = `tips/${cat}/${rid}.md`;

    fetch(TIPS_JSON)
      .then((r) => r.json())
      .then((data) => {
        const tip = data.tips?.find(
          (t: { category: string; id: string }) => t.category === cat && t.id === rid,
        );
        return tip?.mdPath || fallbackPath;
      })
      .catch(() => fallbackPath)
      .then((path) => fetch(`/HowToCook/${path}`))
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.text();
      })
      .then((text) => {
        setMdContent(text);
        extractHeadings(text);
      })
      .catch(() => setMdContent('# 文档加载失败\n请检查链接是否正确。'))
      .finally(() => setLoading(false));
  }, [category, id]);

  const baseDir = category && id
    ? `tips/${decodeURIComponent(category)}/`
    : '';

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
        let hId = baseId;
        let n = 0;
        while (seen.has(hId)) {
          n += 1;
          hId = `${baseId}-${n}`;
        }
        seen.add(hId);
        items.push({ id: hId, text, level });
      }
    }
    setHeadings(items);
  }

  const imageBase = baseDir ? `/HowToCook/${baseDir}` : '/HowToCook/tips/';

  const getHeadingId = () => {
    const idx = headingIndexRef.current;
    headingIndexRef.current += 1;
    return headings[idx]?.id ?? `h-${idx}`;
  };
  headingIndexRef.current = 0;

  const mdComponents: Components = {
    img({ src, alt }) {
      if (!src) return null;
      let fullSrc = src;
      if (src.startsWith('./')) {
        fullSrc = `${imageBase}${src.slice(1)}`;
      } else if (!src.startsWith('http') && !src.startsWith('/')) {
        fullSrc = `${imageBase}${src}`;
      }
      return <img src={fullSrc} alt={alt || ''} style={{ maxWidth: '100%', borderRadius: 8 }} />;
    },
    a({ href, children, ...props }) {
      if (href?.endsWith('.md') && href.includes('tips/')) {
        const match = href.match(/tips\/([^/]+)\/([^/]+)\.md$/);
        if (match) {
          const [, cat, tipId] = match;
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/other/kitchen-skills/${encodeURIComponent(cat)}/${encodeURIComponent(tipId)}`);
              }}
              {...props}
            >
              {children}
            </a>
          );
        }
      }
      if (href?.startsWith('#')) {
        return <a href={href} {...props}>{children}</a>;
      }
      if (href?.startsWith('/')) {
        return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
      }
      return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
    },
    h1({ children, ...props }) {
      const hId = getHeadingId();
      return <h1 id={hId} {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      const hId = getHeadingId();
      return <h2 id={hId} {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      const hId = getHeadingId();
      return <h3 id={hId} {...props}>{children}</h3>;
    },
    h4({ children, ...props }) {
      const hId = getHeadingId();
      return <h4 id={hId} {...props}>{children}</h4>;
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

  return (
    <div className="kitchen-skill-detail-page" style={{ padding: 24 }}>
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
          onClick={() => navigate('/other/kitchen-skills')}
          style={{ borderRadius: 8 }}
        >
          返回列表
        </Button>
      </div>

      <div className="kitchen-skill-detail-layout" style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={contentRef}
            className="markdown-body kitchen-skill-detail-content"
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
            className="kitchen-skill-detail-anchor"
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

export default KitchenSkillDetail;
