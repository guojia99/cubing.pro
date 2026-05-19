import { WCALink, WCALinkWithCnName } from '@/components/Link/Links';
import { getWCAPersons } from '@/services/cubing-pro/wca/player';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Table, Typography, Alert, Spin } from 'antd';
import { useIntl } from '@@/plugin-locale';
import { getCountryNameByIso2 } from '@/pages/WCA/PlayerComponents/region/all_contiry';
const { Title } = Typography;
// 🔒 安全校验：确保是合法的 WCAPerson 数组
function isValidWCAPersonArray(data) {
    if (!Array.isArray(data))
        return false;
    return data.every((item) => item &&
        typeof item === 'object' &&
        typeof item.wca_id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.country_id === 'string');
}
const inputStyle = {
    width: '100%',
    maxWidth: 600,
    fontSize: '18px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};
const WCAPlayerSearchPage = () => {
    const intl = useIntl();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed === '') {
            setResults([]);
            setError(null);
            return;
        }
        if (trimmed.length > 32) {
            setError(intl.formatMessage({ id: 'wca.players.errorMaxLength' }));
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
                }
                else {
                    // API 返回了非预期结构（如 null, {}, {error: ...} 等）
                    console.error('Unexpected API response:', data);
                    setResults([]);
                    setError(intl.formatMessage({ id: 'wca.players.errorFormat' }));
                }
            }
            catch (err) {
                console.error('Search request failed:', err);
                setError(err.message || intl.formatMessage({ id: 'wca.players.errorNetwork' }));
                setResults([]);
            }
            finally {
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
            title: intl.formatMessage({ id: 'wca.players.wcaId' }),
            dataIndex: 'wca_id',
            key: 'wca_id',
            width: 150,
            render: (text) => WCALink(text, text),
        },
        {
            title: intl.formatMessage({ id: 'wca.players.country' }),
            dataIndex: 'iso2',
            key: 'iso2',
            width: 120,
            render: (text) => {
                return (<>{getCountryNameByIso2(text)}</>);
            }
        },
        {
            title: intl.formatMessage({ id: 'wca.players.name' }),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (_, record) => WCALinkWithCnName(record.wca_id, record.name),
        },
        {
            title: intl.formatMessage({ id: 'wca.players.gender' }),
            dataIndex: 'gender',
            key: 'gender',
            width: 120,
            render: (gender) => {
                if (gender === 'm')
                    return intl.formatMessage({ id: 'wca.players.genderMale' });
                if (gender === 'f')
                    return intl.formatMessage({ id: 'wca.players.genderFemale' });
                return intl.formatMessage({ id: 'wca.players.genderOther' });
            },
        },
    ];
    const isEmptyState = !query && results.length === 0 && !loading && !error;
    return (<div style={{
            padding: '24px',
            maxWidth: 1000,
            margin: '0 auto',
            display: isEmptyState ? 'flex' : 'block',
            flexDirection: isEmptyState ? 'column' : undefined,
            justifyContent: isEmptyState ? 'center' : undefined,
            alignItems: isEmptyState ? 'center' : undefined,
            minHeight: isEmptyState ? '50vh' : undefined,
            boxSizing: 'border-box',
        }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        {intl.formatMessage({ id: 'wca.players.title' })}
      </Title>

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={intl.formatMessage({ id: 'wca.players.placeholder' })} allowClear size="large" style={inputStyle}/>

      {error && (<div style={{ marginTop: 16, width: '100%', maxWidth: 600 }}>
          <Alert message={intl.formatMessage({ id: 'wca.players.queryTip' })} description={error} type="error" showIcon closable onClose={() => setError(null)}/>
        </div>)}

      {loading && results.length === 0 && (<div style={{ marginTop: 24 }}>
          <Spin tip={intl.formatMessage({ id: 'wca.players.searching' })}/>
        </div>)}

      {results.length > 0 && (<div style={{ marginTop: 24, width: '100%' }}>
          <Table dataSource={results} columns={columns} rowKey={(record) => `${record.wca_id}`} pagination={{ pageSize: 10, showSizeChanger: true }}/>
        </div>)}
    </div>);
};
export default WCAPlayerSearchPage;
//# sourceMappingURL=Players.jsx.map