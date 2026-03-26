import type { CompGeo } from '@/services/cubing-pro/wca/types';
import { useIntl } from '@@/plugin-locale';
import { getLocale } from 'umi';
import { Button, Empty, Segmented, Space, Table, Typography } from 'antd';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  aggregateChinaProvinces,
  aggregateWorldByCountry,
  filterGeosForProvince,
  hasVisitedChina,
  splitWorldMapAndScatter,
} from './litCities/aggregateGeos';
import { displayProvinceName } from './litCities/chinaProvinceNormalize';
import { aggregatePrefectureCounts, matchCityToPrefecture } from './litCities/cityRegionMatch';
import { normalizeTaiwanCountyGeoJson, TAIWAN_COUNTY_GEOJSON_URL } from './litCities/taiwanCountyGeo';
import { safeGeoCount } from './litCities/safeCount';
import { wcaCountryIdToWorldMapName } from './litCities/worldCountryMap';
import './WCAPlayerLitCitiesTab.less';

const WORLD_JSON =
  'https://cdn.jsdelivr.net/gh/apache/echarts@5.6.0/test/data/map/json/world.json';
const CHINA_JSON = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

type GeoFeature = {
  properties?: { name?: string; adcode?: number; COUNTYNAME?: string };
};

type GeoFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoFeature[];
};

function mergeMapValues(rows: { name: string; value: number }[]): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.name, (m.get(r.name) || 0) + safeGeoCount(r.value));
  }
  return [...m.entries()].map(([name, value]) => ({ name, value: safeGeoCount(value) }));
}

function maxFinite(values: number[], fallback: number): number {
  const nums = values.filter(Number.isFinite);
  if (nums.length === 0) return fallback;
  return Math.max(fallback, ...nums);
}

interface WCAPlayerLitCitiesTabProps {
  geos: CompGeo[];
}

const WCAPlayerLitCitiesTab: React.FC<WCAPlayerLitCitiesTabProps> = ({ geos }) => {
  const intl = useIntl();
  const locale = getLocale() || intl.locale || 'zh-CN';
  const localeZh = locale.startsWith('zh');

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [scope, setScope] = useState<'world' | 'china'>('world');
  const [mapsReady, setMapsReady] = useState(false);
  const [chinaGeoJson, setChinaGeoJson] = useState<GeoFeatureCollection | null>(null);
  const [worldNames, setWorldNames] = useState<Set<string>>(new Set());
  const [provinceDrill, setProvinceDrill] = useState<{ adcode: number; nameZh: string } | null>(null);
  const [provinceGeo, setProvinceGeo] = useState<GeoFeatureCollection | null>(null);
  const [provinceMapReady, setProvinceMapReady] = useState(false);

  const chinaRegionToAdcode = useMemo(() => {
    const m = new Map<string, number>();
    if (!chinaGeoJson || chinaGeoJson.type !== 'FeatureCollection') return m;
    for (const f of chinaGeoJson.features) {
      const p = f.properties;
      if (p?.name && typeof p.adcode === 'number') m.set(p.name, p.adcode);
    }
    return m;
  }, [chinaGeoJson]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wRes, cRes] = await Promise.all([fetch(WORLD_JSON), fetch(CHINA_JSON)]);
        const [wJson, cJson] = await Promise.all([wRes.json(), cRes.json()]);
        if (cancelled) return;
        echarts.registerMap('world', wJson as Parameters<typeof echarts.registerMap>[1]);
        echarts.registerMap('china', cJson as Parameters<typeof echarts.registerMap>[1]);
        const names = new Set<string>();
        if (wJson.type === 'FeatureCollection') {
          for (const f of wJson.features) {
            const n = (f.properties as { name?: string })?.name;
            if (n) names.add(n);
          }
        }
        setWorldNames(names);
        setChinaGeoJson(cJson as GeoFeatureCollection);
        setMapsReady(true);
      } catch (e) {
        console.error('Lit cities map load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceDrill || !chinaGeoJson) {
      setProvinceGeo(null);
      setProvinceMapReady(false);
      return;
    }
    const { adcode } = provinceDrill;
    let cancelled = false;
    (async () => {
      try {
        if (adcode === 710000) {
          const resTw = await fetch(TAIWAN_COUNTY_GEOJSON_URL);
          const gj = await resTw.json();
          normalizeTaiwanCountyGeoJson(gj);
          if (cancelled) return;
          echarts.registerMap(`china_${adcode}`, gj as Parameters<typeof echarts.registerMap>[1]);
          setProvinceGeo(gj as GeoFeatureCollection);
          setProvinceMapReady(true);
          return;
        }
        const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
        const res = await fetch(url);
        const gj = await res.json();
        if (cancelled) return;
        echarts.registerMap(`china_${adcode}`, gj as Parameters<typeof echarts.registerMap>[1]);
        setProvinceGeo(gj);
        setProvinceMapReady(true);
      } catch (e) {
        console.error('Province map load failed', e);
        setProvinceGeo(null);
        setProvinceMapReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provinceDrill, chinaGeoJson]);

  const byWorld = useMemo(() => aggregateWorldByCountry(geos), [geos]);
  const byChinaProvince = useMemo(() => aggregateChinaProvinces(geos), [geos]);
  const unlockedChina = useMemo(() => hasVisitedChina(geos), [geos]);

  const { mapPieces, scatterPieces } = useMemo(
    () => splitWorldMapAndScatter(worldNames, byWorld),
    [worldNames, byWorld],
  );
  const mapDataMerged = useMemo(() => mergeMapValues(mapPieces), [mapPieces]);

  const maxWorldVal = useMemo(() => {
    const a = mapDataMerged.map(d => safeGeoCount(d.value));
    const b = scatterPieces.map(d => safeGeoCount(d.value));
    return maxFinite([...a, ...b], 1);
  }, [mapDataMerged, scatterPieces]);

  const worldOption = useMemo(() => {
    const scatterData = scatterPieces.map(s => ({
      name: wcaCountryIdToWorldMapName(s.name),
      value: [s.coord[0], s.coord[1], safeGeoCount(s.value)] as [number, number, number],
    }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: { seriesType?: string; name?: string; value?: unknown; data?: { name?: string } }) => {
          if (p.seriesType === 'map') {
            const raw = typeof p.value === 'number' ? p.value : (p.value as { value?: number })?.value;
            const v = safeGeoCount(raw);
            return `${p.name}<br/>${intl.formatMessage({ id: 'wca.litCities.count' })}: ${v}`;
          }
          if (p.seriesType === 'scatter' || p.seriesType === 'effectScatter') {
            const raw = Array.isArray(p.value) ? p.value[2] : p.value;
            const val = safeGeoCount(raw);
            const nm = p.data?.name || p.name;
            return `${nm}<br/>${intl.formatMessage({ id: 'wca.litCities.count' })}: ${val}`;
          }
          return '';
        },
      },
      visualMap: {
        min: 0,
        max: maxWorldVal,
        seriesIndex: 0,
        text: [
          intl.formatMessage({ id: 'wca.litCities.high' }),
          intl.formatMessage({ id: 'wca.litCities.low' }),
        ],
        realtime: false,
        calculable: true,
        inRange: { color: ['#e0f3ff', '#006edd'] },
      },
      geo: {
        map: 'world',
        roam: true,
        emphasis: { disabled: false, label: { show: false } },
        itemStyle: { areaColor: '#f5f5f5', borderColor: '#ccc' },
      },
      series: [
        {
          name: 'world',
          type: 'map',
          geoIndex: 0,
          data: mapDataMerged,
        },
        {
          name: 'extra',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          geoIndex: 0,
          data: scatterData.map(d => ({
            name: d.name,
            value: d.value,
          })),
          itemStyle: { color: '#722ed1' },
          symbolSize: (val: number | number[]) => {
            const arr = Array.isArray(val) ? val : [val];
            const n = safeGeoCount(arr[2]);
            return Math.max(8, Math.min(28, 6 + Math.sqrt(n) * 3));
          },
        },
      ],
    };
  }, [mapDataMerged, scatterPieces, maxWorldVal, intl]);

  const maxChinaVal = useMemo(() => {
    const vals = [...byChinaProvince.values()].map(safeGeoCount);
    return maxFinite(vals, 1);
  }, [byChinaProvince]);

  const chinaMapData = useMemo(() => {
    return [...byChinaProvince.entries()].map(([name, value]) => ({
      name,
      value: safeGeoCount(value),
    }));
  }, [byChinaProvince]);

  const chinaOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: (p: { name?: string; value?: unknown }) => {
          const raw = typeof p.value === 'number' ? p.value : (p.value as { value?: number })?.value;
          const v = safeGeoCount(raw);
          const zh = p.name || '';
          const label = displayProvinceName(zh, localeZh);
          return `${label}<br/>${intl.formatMessage({ id: 'wca.litCities.count' })}: ${v}`;
        },
      },
      visualMap: {
        min: 0,
        max: maxChinaVal,
        text: [
          intl.formatMessage({ id: 'wca.litCities.high' }),
          intl.formatMessage({ id: 'wca.litCities.low' }),
        ],
        realtime: false,
        calculable: true,
        inRange: { color: ['#fff7e6', '#fa541c'] },
      },
      series: [
        {
          name: 'china',
          type: 'map',
          map: 'china',
          roam: true,
          emphasis: { label: { show: true } },
          data: chinaMapData,
        },
      ],
    }),
    [chinaMapData, maxChinaVal, intl, localeZh],
  );

  const provinceGeosFiltered = useMemo(
    () => (provinceDrill ? filterGeosForProvince(geos, provinceDrill.nameZh) : []),
    [geos, provinceDrill],
  );

  const prefectureNames = useMemo(() => {
    if (!provinceGeo || provinceGeo.type !== 'FeatureCollection') return [];
    return provinceGeo.features
      .map(f => f.properties?.name || f.properties?.COUNTYNAME)
      .filter(Boolean) as string[];
  }, [provinceGeo]);

  const provincePrefectureData = useMemo(() => {
    const rows = provinceGeosFiltered.map(g => ({ city: g.city || '', count: g.count }));
    return aggregatePrefectureCounts(rows, prefectureNames, {
      taiwan: provinceDrill?.adcode === 710000,
    });
  }, [provinceGeosFiltered, prefectureNames, provinceDrill?.adcode]);

  const maxProvinceDetail = useMemo(() => {
    const vals = provincePrefectureData.map(d => safeGeoCount(d.value)).filter(v => v > 0);
    return maxFinite(vals, 1);
  }, [provincePrefectureData]);

  const provinceDetailOption = useMemo(() => {
    if (!provinceDrill || !provinceMapReady || !provinceGeo) return undefined;
    const data = provincePrefectureData
      .filter(d => d.name !== '__other__' && safeGeoCount(d.value) > 0)
      .map(d => ({ name: d.name, value: safeGeoCount(d.value) }));
    const other = provincePrefectureData.find(d => d.name === '__other__');
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: { name?: string; value?: unknown }) => {
          const raw = typeof p.value === 'number' ? p.value : (p.value as { value?: number })?.value;
          const v = safeGeoCount(raw);
          return `${p.name}<br/>${intl.formatMessage({ id: 'wca.litCities.count' })}: ${v}`;
        },
      },
      visualMap: {
        show: data.length > 0,
        min: 0,
        max: maxProvinceDetail,
        text: [
          intl.formatMessage({ id: 'wca.litCities.high' }),
          intl.formatMessage({ id: 'wca.litCities.low' }),
        ],
        realtime: false,
        calculable: true,
        inRange: { color: ['#f6ffed', '#52c41a'] },
      },
      series: [
        {
          type: 'map',
          map: `china_${provinceDrill.adcode}`,
          roam: true,
          data,
          emphasis: { label: { show: true } },
        },
      ],
      graphic: other
        ? [
            {
              type: 'text',
              left: 'center',
              bottom: 8,
              style: {
                text: `${intl.formatMessage({ id: 'wca.litCities.otherRegions' })}: ${safeGeoCount(other.value)}`,
                fill: '#666',
                fontSize: 12,
              },
            },
          ]
        : [],
    };
  }, [provinceDrill, provinceMapReady, provinceGeo, provincePrefectureData, maxProvinceDetail, intl]);

  const onChinaChartClick = useCallback(
    (params: { componentType?: string; name?: string }) => {
      if (params.componentType !== 'series' || !params.name) return;
      const ad = chinaRegionToAdcode.get(params.name);
      if (typeof ad === 'number') setProvinceDrill({ adcode: ad, nameZh: params.name });
    },
    [chinaRegionToAdcode],
  );

  /** 世界地图上点击中国区域 → 切换到中国地图 */
  const onWorldChartClick = useCallback(
    (params: { componentType?: string; seriesType?: string; name?: string }) => {
      if (params.componentType !== 'series') return;
      if (params.seriesType !== 'map') return;
      if (params.name !== 'China') return;
      setProvinceDrill(null);
      setScope('china');
    },
    [],
  );

  const worldListRows = useMemo(() => {
    const rows = [...byWorld.entries()]
      .map(([countryId, count]) => ({
        key: countryId,
        countryId,
        worldName: wcaCountryIdToWorldMapName(countryId),
        count: safeGeoCount(count),
      }))
      .sort((a, b) => b.count - a.count);
    return rows;
  }, [byWorld]);

  const chinaListRows = useMemo(() => {
    return [...byChinaProvince.entries()]
      .map(([mapNameZh, count]) => ({
        key: mapNameZh,
        mapNameZh,
        label: displayProvinceName(mapNameZh, localeZh),
        count: safeGeoCount(count),
      }))
      .sort((a, b) => b.count - a.count);
  }, [byChinaProvince, localeZh]);

  const empty = !geos?.length;

  return (
    <div className="wca-lit-cities">
      <Space wrap style={{ marginBottom: 12 }}>
        <Segmented
          value={viewMode}
          onChange={v => setViewMode(v as 'map' | 'list')}
          options={[
            { label: intl.formatMessage({ id: 'wca.litCities.modeMap' }), value: 'map' },
            { label: intl.formatMessage({ id: 'wca.litCities.modeList' }), value: 'list' },
          ]}
        />
        <Segmented
          value={scope}
          onChange={v => {
            setScope(v as 'world' | 'china');
            setProvinceDrill(null);
          }}
          options={[
            { label: intl.formatMessage({ id: 'wca.litCities.scopeWorld' }), value: 'world' },
            {
              label: intl.formatMessage({ id: 'wca.litCities.scopeChina' }),
              value: 'china',
              disabled: !unlockedChina,
            },
          ]}
        />
        {scope === 'china' && provinceDrill && (
          <Button type="link" onClick={() => setProvinceDrill(null)}>
            {intl.formatMessage({ id: 'wca.litCities.backToChina' })}
          </Button>
        )}
      </Space>

      {empty && <Empty description={intl.formatMessage({ id: 'wca.litCities.empty' })} />}

      {!empty && viewMode === 'list' && scope === 'world' && (
        <Table
          size="small"
          pagination={{ pageSize: 15 }}
          dataSource={worldListRows}
          columns={[
            {
              title: intl.formatMessage({ id: 'wca.litCities.country' }),
              dataIndex: 'countryId',
              render: (_: unknown, r: (typeof worldListRows)[0]) =>
                localeZh ? r.countryId : r.worldName,
            },
            {
              title: intl.formatMessage({ id: 'wca.litCities.count' }),
              dataIndex: 'count',
              width: 100,
            },
          ]}
        />
      )}

      {!empty && viewMode === 'list' && scope === 'china' && unlockedChina && !provinceDrill && (
        <Table
          size="small"
          pagination={{ pageSize: 15 }}
          dataSource={chinaListRows}
          columns={[
            {
              title: intl.formatMessage({ id: 'wca.litCities.province' }),
              dataIndex: 'label',
            },
            {
              title: intl.formatMessage({ id: 'wca.litCities.count' }),
              dataIndex: 'count',
              width: 100,
            },
          ]}
        />
      )}

      {!empty && viewMode === 'list' && scope === 'china' && unlockedChina && provinceDrill && (
        <Table
          size="small"
          pagination={{ pageSize: 20 }}
          dataSource={provinceGeosFiltered.map((g, i) => ({
            key: i,
            city: g.city,
            province: g.province,
            count: safeGeoCount(g.count),
            prefecture:
              matchCityToPrefecture(g.city || '', prefectureNames, {
                taiwan: provinceDrill?.adcode === 710000,
              }) || '—',
          }))}
          columns={[
            {
              title: intl.formatMessage({ id: 'wca.litCities.prefecture' }),
              dataIndex: 'prefecture',
            },
            {
              title: intl.formatMessage({ id: 'wca.litCities.cityRaw' }),
              dataIndex: 'city',
            },
            {
              title: intl.formatMessage({ id: 'wca.litCities.count' }),
              dataIndex: 'count',
              width: 90,
            },
          ]}
        />
      )}

      {!empty && viewMode === 'map' && mapsReady && scope === 'world' && (
        <ReactECharts
          option={worldOption}
          style={{ height: 480 }}
          opts={{ renderer: 'canvas' }}
          onEvents={{ click: onWorldChartClick }}
        />
      )}

      {!empty && viewMode === 'map' && mapsReady && scope === 'china' && unlockedChina && !provinceDrill && (
        <ReactECharts
          option={chinaOption}
          style={{ height: 520 }}
          opts={{ renderer: 'canvas' }}
          onEvents={{ click: onChinaChartClick }}
        />
      )}

      {!empty && viewMode === 'map' && scope === 'china' && unlockedChina && provinceDrill && (
        <div>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            {displayProvinceName(provinceDrill.nameZh, localeZh)}{' '}
            {intl.formatMessage({ id: 'wca.litCities.provinceDetail' })}
          </Typography.Title>
          {provinceDetailOption && (
            <ReactECharts
              option={provinceDetailOption}
              style={{ height: 480 }}
              opts={{ renderer: 'canvas' }}
            />
          )}
          <Table
            size="small"
            style={{ marginTop: 16 }}
            pagination={{ pageSize: 12 }}
            dataSource={provinceGeosFiltered.map((g, i) => ({
              key: i,
              city: g.city,
              count: safeGeoCount(g.count),
            }))}
            columns={[
              {
                title: intl.formatMessage({ id: 'wca.litCities.cityRaw' }),
                dataIndex: 'city',
              },
              {
                title: intl.formatMessage({ id: 'wca.litCities.count' }),
                dataIndex: 'count',
                width: 80,
              },
            ]}
          />
        </div>
      )}

      {!empty && viewMode === 'map' && scope === 'china' && !unlockedChina && (
        <Typography.Paragraph type="secondary">
          {intl.formatMessage({ id: 'wca.litCities.chinaLocked' })}
        </Typography.Paragraph>
      )}
    </div>
  );
};

export default WCAPlayerLitCitiesTab;
