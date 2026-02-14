import React, { useEffect, useState } from 'react';
import { Card, Col, Divider, Empty, Row, Select, Spin } from 'antd';
import { useIntl } from '@@/plugin-locale';
import { useNavigate } from '@@/exports';
import { getAlgCubeMap } from '@/services/cubing-pro/algs/algs';
import type { AlgorithmGroupsResponse, OutputClass } from '@/services/cubing-pro/algs/typings';
import SvgRenderer from './components/SvgRenderer';
import RandomPickModal from './components/RandomPickModal';
import { ALGS_COLORS } from './constants';
import './index.less';

const RANDOM_PICK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="44" fill="rgba(230,240,255,0.8)" stroke="rgba(100,149,237,0.5)" stroke-width="3"/>
  <path d="M50 50 L50 10 L54 50 Z" fill="rgba(100,149,237,0.7)"/>
  <path d="M50 50 L77 27 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L77 73 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L50 90 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L23 73 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <path d="M50 50 L23 27 L54 50 Z" fill="rgba(100,149,237,0.5)"/>
  <circle cx="50" cy="50" r="10" fill="rgba(100,149,237,0.9)"/>
</svg>`;

const AlgsList: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [data, setData] = useState<AlgorithmGroupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCube, setFilterCube] = useState<string>('');
  const [randomPickModalOpen, setRandomPickModalOpen] = useState(false);

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

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card
            hoverable
            onClick={() => setRandomPickModalOpen(true)}
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
                svg={RANDOM_PICK_ICON_SVG}
                maxWidth={100}
                maxHeight={100}
                style={{ marginTop: 24, marginBottom: 28 }}
              />
              <div style={{ fontWeight: 600, color: 'rgba(0,0,0,0.85)' }}>
                {intl.formatMessage({ id: 'algs.randomPick.title' })}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {filteredCubes.flatMap((c) => classMap[c] ?? []).length === 0 ? (
        <Empty description={intl.formatMessage({ id: 'algs.empty' })} />
      ) : (
        <>
        <RandomPickModal
          open={randomPickModalOpen}
          onClose={() => setRandomPickModalOpen(false)}
          classMap={classMap}
          cubeKeys={filteredCubes}
        />
        {filteredCubes
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
          })}
        </>
      )}
    </div>
  );
};

export default AlgsList;
