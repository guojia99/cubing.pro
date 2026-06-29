import type { CompGeo } from '@/services/cubing-pro/wca/types';
import { resolveChinaProvinceMeta } from './chinaProvinceNormalize';
import { safeGeoCount } from './safeCount';
import { wcaCountryIdToWorldMapName } from './worldCountryMap';

/** 世界地图中无法单独成区的 WCA 国家/地区 → 经纬度（气泡） */
export const WORLD_SCATTER_COORDS: Record<string, [number, number]> = {
  Taiwan: [121.3, 24.8],
  'Hong Kong': [114.17, 22.32],
  Macau: [113.54, 22.19],
};

export function hasVisitedChina(geos: CompGeo[]): boolean {
  return geos.some(g => g.countryId === 'China');
}

export function aggregateWorldByCountry(geos: CompGeo[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of geos) {
    const id = g.countryId;
    m.set(id, (m.get(id) || 0) + safeGeoCount(g.count));
  }
  return m;
}

export function aggregateChinaProvinces(geos: CompGeo[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of geos) {
    if (g.countryId !== 'China' && g.iso2 !== 'CN') continue;
    const meta = resolveChinaProvinceMeta(g.province || '', g.city || '');
    if (!meta) continue;
    const k = meta.mapNameZh;
    m.set(k, (m.get(k) || 0) + safeGeoCount(g.count));
  }
  return m;
}

export function filterGeosForProvince(geos: CompGeo[], mapNameZh: string): CompGeo[] {
  return geos.filter(g => {
    if (g.countryId !== 'China' && g.iso2 !== 'CN') return false;
    const meta = resolveChinaProvinceMeta(g.province || '', g.city || '');
    return meta?.mapNameZh === mapNameZh;
  });
}

export function splitWorldMapAndScatter(
  worldNameSet: Set<string>,
  byCountry: Map<string, number>,
): {
  mapPieces: { name: string; value: number }[];
  scatterPieces: { name: string; value: number; coord: [number, number] }[];
} {
  const mapPieces: { name: string; value: number }[] = [];
  const scatterPieces: { name: string; value: number; coord: [number, number] }[] = [];

  for (const [countryId, value] of byCountry) {
    const worldName = wcaCountryIdToWorldMapName(countryId);
    const scatterCoord = WORLD_SCATTER_COORDS[countryId] || WORLD_SCATTER_COORDS[worldName];
    if (scatterCoord) {
      scatterPieces.push({
        name: countryId,
        value,
        coord: scatterCoord,
      });
      continue;
    }
    if (worldNameSet.has(worldName)) {
      mapPieces.push({ name: worldName, value });
      continue;
    }
    /** 少数别名再试 countryId 本身 */
    if (worldNameSet.has(countryId)) {
      mapPieces.push({ name: countryId, value });
      continue;
    }
    /** 无对应地图要素且无坐标时不在地图上绘制，仅在列表中展示 */
  }

  return { mapPieces, scatterPieces };
}
