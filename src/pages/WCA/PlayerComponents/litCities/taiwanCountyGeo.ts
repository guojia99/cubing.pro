/** g0v twgeojson：台湾省县市边界（与 WCA 城市明细对应） */
export const TAIWAN_COUNTY_GEOJSON_URL =
  'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json';

type TwProps = { name?: string; COUNTYNAME?: string };

/** 保证 ECharts map 使用 properties.name 与 COUNTYNAME 一致 */
export function normalizeTaiwanCountyGeoJson(gj: {
  type: string;
  features: Array<{ properties?: TwProps }>;
}): void {
  for (const f of gj.features) {
    const p = f.properties;
    if (!p) continue;
    if (!p.name && p.COUNTYNAME) p.name = p.COUNTYNAME;
  }
}
