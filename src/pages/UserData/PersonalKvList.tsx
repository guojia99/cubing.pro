import { Auth, checkAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import { getUserKv, listUserKvs, type UserKvListItem } from '@/services/cubing-pro/user/user_kv';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@@/plugin-locale';
import { Button, Modal, Space, Spin, Table, Typography, message, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

function prettifyJson(raw: string): string {
  try {
    const o = JSON.parse(raw);
    return JSON.stringify(o, null, 2);
  } catch {
    return raw;
  }
}

const PersonalKvList: React.FC = () => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const user = checkAuth([Auth.AuthPlayer]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserKvListItem[]>([]);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalTitle, setJsonModalTitle] = useState('');
  const [jsonModalBody, setJsonModalBody] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const jsonPreStyle = useMemo(
    () =>
      ({
        margin: 0,
        padding: token.paddingMD,
        background: token.colorFillAlter,
        color: token.colorText,
        border: `1px solid ${token.colorSplit}`,
        borderRadius: token.borderRadiusLG,
        maxHeight: 'min(72vh, calc(100vh - 220px))',
        overflow: 'auto',
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeight,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: token.fontFamilyCode,
        boxShadow: `inset 0 0 0 1px ${token.colorFillSecondary}`,
      }) as React.CSSProperties,
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listUserKvs();
      setRows(list);
    } catch (e) {
      message.error(intl.formatMessage({ id: 'userKv.listLoadError' }));
    } finally {
      setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const openDetail = async (key: string) => {
    setJsonModalTitle(key);
    setJsonModalOpen(true);
    setDetailLoading(true);
    setJsonModalBody('');
    try {
      const rec = await getUserKv(key);
      setJsonModalBody(prettifyJson(rec.value));
    } catch {
      message.error(intl.formatMessage({ id: 'userKv.detailLoadError' }));
      setJsonModalBody('');
    } finally {
      setDetailLoading(false);
    }
  };

  if (user === null) {
    return (
      <PageContainer>
        <Typography.Text type="danger">{intl.formatMessage({ id: 'userKv.needLogin' })}</Typography.Text>
      </PageContainer>
    );
  }

  const columns: ColumnsType<UserKvListItem> = [
    {
      title: intl.formatMessage({ id: 'userKv.col.key' }),
      dataIndex: 'key',
      key: 'key',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'userKv.col.type' }),
      dataIndex: 'type',
      key: 'type',
      width: 88,
    },
    {
      title: intl.formatMessage({ id: 'userKv.col.valueLen' }),
      dataIndex: 'valueLen',
      key: 'valueLen',
      width: 120,
    },
    {
      title: intl.formatMessage({ id: 'userKv.col.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 220,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: intl.formatMessage({ id: 'userKv.col.action' }),
      key: 'action',
      width: 120,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => void openDetail(r.key)}>
          {intl.formatMessage({ id: 'userKv.viewJson' })}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer title={intl.formatMessage({ id: 'userKv.pageTitle' })}>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => void load()} loading={loading}>
          {intl.formatMessage({ id: 'userKv.refresh' })}
        </Button>
      </Space>
      <Table<UserKvListItem>
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
      />
      <Modal
        title={jsonModalTitle}
        open={jsonModalOpen}
        onCancel={() => setJsonModalOpen(false)}
        footer={null}
        width="min(96vw, 1120px)"
        centered
        styles={{
          body: { paddingTop: token.paddingSM },
        }}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: token.paddingLG }}>
            <Spin />
          </div>
        ) : (
          <pre style={jsonPreStyle}>{jsonModalBody || '—'}</pre>
        )}
      </Modal>
    </PageContainer>
  );
};

export default PersonalKvList;
