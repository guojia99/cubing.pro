/** 将接口可能返回的非法次数转为有限非负数，避免 NaN 进入聚合与 ECharts */
export function safeGeoCount(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return x;
}
