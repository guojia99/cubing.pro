import React, { useEffect, useState } from 'react';
import { Card, Col, Divider, Empty, Row, Select, Spin } from 'antd';
import { useIntl } from '@@/plugin-locale';
import { useNavigate } from '@@/exports';
import { getAlgCubeMap } from '@/services/cubing-pro/algs/algs';
import type { AlgorithmGroupsResponse, OutputClass } from '@/services/cubing-pro/algs/typings';
import SvgRenderer from './components/SvgRenderer';
import { ALGS_COLORS } from './constants';
import './index.less';

const AlgsList: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [data, setData] = useState<AlgorithmGroupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCube, setFilterCube] = useState<string>('');

  useEffect(() => {
    getAlgCubeMap()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const cubeKeys = data?.CubeKeys ?? [];
  const classMap = data?.ClassMap ?? {};

  const filteredCubes = filterCube ? [filterCube] : cubeKeys;

  const handleCardClick = (cube: string, cls: OutputClass) => {
    navigate(`/algs/${encodeURIComponent(cube)}/${encodeURIComponent(cls.name)}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <h2 style={{ marginBottom: 16, color: 'rgba(0,0,0,0.85)' }}>
        {intl.formatMessage({ id: 'algs.title' })}
      </h2>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder={intl.formatMessage({ id: 'algs.filter.placeholder' })}
          allowClear
          style={{ minWidth: 180 }}
          value={filterCube}
          onChange={(v) => setFilterCube(v ?? '')}
          options={[
            { value: '', label: intl.formatMessage({ id: 'algs.filter.all' }) },
            ...cubeKeys.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {filteredCubes.flatMap((c) => classMap[c] ?? []).length === 0 ? (
        <Empty description={intl.formatMessage({ id: 'algs.empty' })} />
      ) : (
        filteredCubes
          .filter((cube) => (classMap[cube] ?? []).length > 0)
          .map((cube) => {
            const classes = classMap[cube] ?? [];
            return (
            <div key={cube} style={{ marginBottom: 32 }}>
              <Divider
                orientation="left"
                style={{
                  borderColor: ALGS_COLORS.cardBorder,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'rgba(0,0,0,0.85)',
                }}
              >
                {cube}
              </Divider>
              <Row gutter={[16, 16]}>
                {classes.map((cls) => (
                  <Col key={`${cube}-${cls.name}`} xs={24} sm={12} md={8} lg={6} xl={6}>
                    <Card
                      hoverable
                      onClick={() => handleCardClick(cube, cls)}
                      style={{
                        borderRadius: 12,
                        backgroundColor: ALGS_COLORS.cardBg,
                        borderColor: ALGS_COLORS.cardBorder,
                        overflow: 'hidden',
                        animation: 'algsFloat 3s ease-in-out infinite',
                        minHeight: 120,
                      }}
                      bodyStyle={{ padding: 20 }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <SvgRenderer
                          svg={cls.image}
                          maxWidth={180}
                          maxHeight={260}
                          style={{ marginTop: 24, marginBottom: 28 }}
                        />
                        <div style={{ fontWeight: 600, color: 'rgba(0,0,0,0.85)' }}>{cls.name}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            );
          })
      )}
    </div>
  );
};

export default AlgsList;
