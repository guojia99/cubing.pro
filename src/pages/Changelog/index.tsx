import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Tag, Typography, Spin, Segmented } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChangelogEntry {
  date: string;
  year?: string;
  isYear?: boolean;
  items: {
    scope: 'frontend' | 'backend';
    text: string;
  }[];
}

function parseChangelog(md: string): ChangelogEntry[] {
  const lines = md.split('\n');
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentScope: 'frontend' | 'backend' | null = null;

  for (const line of lines) {
    const yearMatch = line.match(/^## (\d{4})/);
    if (yearMatch) {
      currentEntry = { date: yearMatch[1], isYear: true, items: [] };
      entries.push(currentEntry);
      currentScope = null;
      continue;
    }

    const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentEntry = { date: dateMatch[1], items: [] };
      entries.push(currentEntry);
      currentScope = null;
      continue;
    }

    const scopeMatch = line.match(/^\*\*(前端|后端|全栈)\*\*$/);
    if (scopeMatch && currentEntry) {
      currentScope = scopeMatch[1] === '前端' ? 'frontend' : 'backend';
      continue;
    }

    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentEntry && currentScope) {
      currentEntry.items.push({ scope: currentScope, text: itemMatch[1] });
      continue;
    }
  }

  return entries;
}

const scopeConfig = {
  frontend: { color: '#1677ff', bg: '#e6f4ff', label: '前端' },
  backend: { color: '#52c41a', bg: '#f6ffed', label: '后端' },
};

const ChangelogPage: React.FC = () => {
  const intl = useIntl();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/CHANGELOG.md')
      .then((r) => r.text())
      .then((md) => {
        setEntries(parseChangelog(md));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (!e.isYear) set.add(e.date.slice(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [entries]);

  const scopeOptions = [
    { key: 'all', label: intl.formatMessage({ id: 'menu.Changelog.all' }) },
    { key: 'frontend', label: intl.formatMessage({ id: 'menu.Changelog.frontend' }) },
    { key: 'backend', label: intl.formatMessage({ id: 'menu.Changelog.backend' }) },
  ];

  const yearOptions = useMemo(() => {
    const opts = [
      { label: intl.formatMessage({ id: 'menu.Changelog.allYears' }), value: 'all' },
      ...years.map((y) => ({ label: y, value: y })),
    ];
    return opts;
  }, [years, intl]);

  const filteredEntries = entries
    .filter((e) => !e.isYear)
    .filter((e) => !yearFilter || e.date.startsWith(yearFilter))
    .map((e) => ({
      ...e,
      items:
        scopeFilter === 'all'
          ? e.items
          : e.items.filter((i) => i.scope === scopeFilter),
    }))
    .filter((e) => e.items.length > 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
  };

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({ id: 'menu.Changelog' }),
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <Segmented
          value={yearFilter || 'all'}
          onChange={(v) => setYearFilter(v === 'all' ? null : (v as string))}
          options={yearOptions}
          style={{ fontWeight: 500 }}
        />
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {scopeOptions.map(({ key, label }) => (
            <Tag.CheckableTag
              key={key}
              checked={scopeFilter === key}
              onChange={() => setScopeFilter(key)}
              style={{
                padding: '4px 14px',
                borderRadius: 16,
                fontSize: 13,
                border: scopeFilter === key ? undefined : '1px solid #d9d9d9',
              }}
            >
              {label}
            </Tag.CheckableTag>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredEntries.map((entry) => {
            const frontendItems = entry.items.filter((i) => i.scope === 'frontend');
            const backendItems = entry.items.filter((i) => i.scope === 'backend');
            return (
              <Card
                key={entry.date}
                size="small"
                style={{ borderRadius: 12, overflow: 'hidden' }}
                styles={{
                  header: {
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  },
                  body: {
                    padding: '12px 20px 16px',
                  },
                }}
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>
                      {formatDate(entry.date)}
                    </span>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 13, fontWeight: 400 }}
                    >
                      {entry.date}
                    </Typography.Text>
                    {scopeFilter === 'all' && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        {frontendItems.length > 0 && (
                          <Tag
                            color="processing"
                            style={{ margin: 0, borderRadius: 10, fontSize: 12 }}
                          >
                            {frontendItems.length} 前端
                          </Tag>
                        )}
                        {backendItems.length > 0 && (
                          <Tag
                            color="success"
                            style={{ margin: 0, borderRadius: 10, fontSize: 12 }}
                          >
                            {backendItems.length} 后端
                          </Tag>
                        )}
                      </div>
                    )}
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {entry.items.map((item, idx) => {
                    const cfg = scopeConfig[item.scope];
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '6px 0',
                        }}
                      >
                        <Tag
                          style={{
                            marginTop: 2,
                            fontSize: 12,
                            lineHeight: '20px',
                            padding: '0 8px',
                            borderRadius: 4,
                            flexShrink: 0,
                            color: cfg.color,
                            background: cfg.bg,
                            border: 'none',
                          }}
                        >
                          {cfg.label}
                        </Tag>
                        <div
                          style={{
                            flex: 1,
                            color: 'rgba(0,0,0,0.75)',
                            fontSize: 14,
                            lineHeight: '22px',
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <span style={{ margin: 0 }}>{children}</span>
                              ),
                              code: ({ children }) => (
                                <code
                                  style={{
                                    background: 'rgba(0,0,0,0.04)',
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    fontSize: '0.9em',
                                  }}
                                >
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {item.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default ChangelogPage;
