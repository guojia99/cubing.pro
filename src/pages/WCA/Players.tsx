import { WCALink, WCALinkWithCnName } from '@/components/Link/Links';
import { getWCAPersons } from '@/services/cubing-pro/wca/player';
import { WCAPerson } from '@/services/cubing-pro/wca/types';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Table, Typography, Alert, Spin } from 'antd';
import { getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';

const { Title } = Typography;

// 🔒 安全校验：确保是合法的 WCAPerson 数组
function isValidWCAPersonArray(data: any): data is WCAPerson[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.wca_id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.country_id === 'string'
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 600,
  fontSize: '18px',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #d9d9d9',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const WCAPlayerSearchPage: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<WCAPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed === '') {
      setResults([]);
      setError(null);
      return;
    }

    if (trimmed.length > 32) {
      setError('输入内容不能超过32个字符');
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await getWCAPersons(trimmed);

        if (isValidWCAPersonArray(data)) {
          setResults(data);
        } else {
          // API 返回了非预期结构（如 null, {}, {error: ...} 等）
          console.error('Unexpected API response:', data);
          setResults([]);
          setError('查询结果格式异常，请稍后再试');
        }
      } catch (err: any) {
        console.error('Search request failed:', err);
        setError(err.message || '网络请求失败，请检查网络后重试');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const columns = [
    {
      title: 'WCA ID',
      dataIndex: 'wca_id',
      key: 'wca_id',
      width: 150,
      render: (text: string) => WCALink(text, text),
    },
    {
      title: '国家/地区',
      dataIndex: 'iso2',
      key: 'iso2',
      width: 120,
      render: (text: string) => {
        return (<>{getCountryNameByIso2(text)}</>)
      }
    },
    {
      title: '名字',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (_: string, record: WCAPerson) =>
        WCALinkWithCnName(record.wca_id, record.name),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 120,
      render: (gender: string) => {
        if (gender === 'm') return '男';
        if (gender === 'f') return '女';
        return '外星人';
      },
    },
  ];

  const isEmptyState = !query && results.length === 0 && !loading && !error;

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: 1000,
        margin: '0 auto',
        display: isEmptyState ? 'flex' : 'block',
        flexDirection: isEmptyState ? 'column' : undefined,
        justifyContent: isEmptyState ? 'center' : undefined,
        alignItems: isEmptyState ? 'center' : undefined,
        minHeight: isEmptyState ? '50vh' : undefined,
        boxSizing: 'border-box',
      }}
    >
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        WCA 选手查询
      </Title>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入WCAID或名字"
        allowClear
        size="large"
        style={inputStyle}
      />

      {error && (
        <div style={{ marginTop: 16, width: '100%', maxWidth: 600 }}>
          <Alert
            message="查询提示"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </div>
      )}

      {loading && results.length === 0 && (
        <div style={{ marginTop: 24 }}>
          <Spin tip="搜索中..." />
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 24, width: '100%' }}>
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(record) => `${record.wca_id}`}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </div>
      )}
    </div>
  );
};

export default WCAPlayerSearchPage;
