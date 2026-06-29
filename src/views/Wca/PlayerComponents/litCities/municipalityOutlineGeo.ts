/**
 * 直辖市及香港等在省详图中使用「全国省级轮廓」单要素（来自已加载的 china 地图），
 * 而非 `{adcode}_full.json` 区县拼图，避免地图上仍显示区内分界线。
 */

export type LitChinaGeoJson = {
  type: string;
  features?: Array<{
    type?: string;
    properties?: { adcode?: number; name?: string; [k: string]: unknown };
    geometry?: unknown;
  }>;
};

export type LitGeoFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties?: Record<string, unknown>;
    geometry?: unknown;
  }>;
};

export function outlineGeoForChinaDirectMunicipality(
  chinaGeoJson: LitChinaGeoJson | null,
  adcode: number,
  displayNameZh: string,
): LitGeoFeatureCollection | null {
  const features = chinaGeoJson?.features;
  if (!features?.length) return null;
  const src = features.find(
    f =>
      f.type === 'Feature' &&
      typeof f.properties?.adcode === 'number' &&
      f.properties.adcode === adcode,
  );
  if (!src || src.type !== 'Feature' || !src.geometry) return null;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: src.geometry,
        properties: {
          ...(src.properties as Record<string, unknown>),
          name: displayNameZh,
        },
      },
    ],
  };
}
