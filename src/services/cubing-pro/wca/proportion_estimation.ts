import { Request } from '@/services/cubing-pro/request';

/** 与后端 types.ResultProportionEstimationType 一致 */
export type ResultProportionEstimationType = '333-333oh' | 'bigcube' | 'bld';

export interface ProportionEstimationSegment {
  anchor_min: number;
  anchor_max: number;
  n_persons: number;
  ratio: Record<string, number>;
}

export interface ProportionCurveSample {
  anchor_sec: number;
  estimates: Record<string, number>;
}

export interface ResultProportionEstimationResult {
  persons: string[];
  events: string[];
  segments: ProportionEstimationSegment[];
  global_ratio: Record<string, number>;
  curve_samples: ProportionCurveSample[];
  sample_count: number;
}

type OkEnvelope<T> = { code: string; data: T; msg: string };

/**
 * 顶尖选手池交集 + 近期 Attempts 静态拟合多项目比例曲线。
 * GET /wca/extend/resultProportionEstimation
 */
export async function getResultProportionEstimation(
  estimationType: ResultProportionEstimationType,
  wrN: number,
): Promise<ResultProportionEstimationResult> {
  const res = await Request.get<OkEnvelope<ResultProportionEstimationResult>>(
    '/wca/extend/resultProportionEstimation',
    {
      params: {
        estimationType,
        wrN,
      },
    },
  );
  return res.data.data;
}

/** 与后端分段插值一致：按段中心对比例线性插值，段外常数延拓 */
export function interpolateRatioAt(
  anchorCs: number,
  segments: ProportionEstimationSegment[],
  event: string,
  globalRatio: number,
): number {
  if (segments.length === 0) {
    return globalRatio;
  }
  const pairs = segments
    .map((s) => {
      const c = (s.anchor_min + s.anchor_max) / 2;
      let r = s.ratio?.[event] ?? 0;
      if (r <= 0) {
        r = globalRatio;
      }
      return { c, r };
    })
    .sort((a, b) => a.c - b.c);

  if (pairs.length === 1) {
    return pairs[0].r;
  }
  if (anchorCs <= pairs[0].c) {
    return pairs[0].r;
  }
  const last = pairs[pairs.length - 1];
  if (anchorCs >= last.c) {
    return last.r;
  }
  for (let i = 0; i < pairs.length - 1; i++) {
    if (anchorCs >= pairs[i].c && anchorCs <= pairs[i + 1].c) {
      const d = pairs[i + 1].c - pairs[i].c;
      if (d <= 0) {
        return pairs[i].r;
      }
      const w = (anchorCs - pairs[i].c) / d;
      return pairs[i].r * (1 - w) + pairs[i + 1].r * w;
    }
  }
  return last.r;
}

/**
 * 已知「展示锚点」项目 E 上的成绩（厘秒），反解后端拟合用的参考锚点（events[0]）厘秒 t_A。
 * 满足 t_A * r_E(t_A) ≈ t_E，其中 r_E 为 E 相对参考锚点的插值比例。
 */
export function solveBackendAnchorCs(
  targetEventCs: number,
  targetEvent: string,
  backendAnchor: string,
  segments: ProportionEstimationSegment[],
  globalRatio: Record<string, number>,
): number {
  if (targetEvent === backendAnchor) {
    return Math.max(0, targetEventCs);
  }
  const gE = globalRatio[targetEvent] ?? 1;
  const implied = (ta: number) =>
    ta * interpolateRatioAt(ta, segments, targetEvent, gE);

  if (targetEventCs <= 0) {
    return 0;
  }

  let lo = 1;
  let hi = Math.max(targetEventCs * 4, 5000);
  let guard = 0;
  while (implied(hi) < targetEventCs && guard < 48 && hi < 1e10) {
    hi *= 2;
    guard += 1;
  }
  if (implied(hi) < targetEventCs) {
    return hi;
  }

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (implied(mid) < targetEventCs) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * 参考锚点（厘秒）下各项目厘秒：T_j = t_A * r_j(t_A)。
 */
export function impliedCentisAllEvents(
  backendAnchorCs: number,
  events: string[],
  backendAnchor: string,
  segments: ProportionEstimationSegment[],
  globalRatio: Record<string, number>,
): Record<string, number> {
  const ta = Math.max(0, backendAnchorCs);
  const out: Record<string, number> = {};
  for (const ev of events) {
    if (ev === backendAnchor) {
      out[ev] = ta;
    } else {
      const gr = globalRatio[ev] ?? 1;
      out[ev] = ta * interpolateRatioAt(ta, segments, ev, gr);
    }
  }
  return out;
}

/**
 * 将后端「参考锚点」厘秒区间 [refMinCs, refMaxCs]，换算为当前所选锚点项目上的厘秒区间端点（用于分段表首列展示）。
 * 下沿、上沿分别在该段边界的参考锚点处取对应比例插值。
 */
export function segmentRefRangeAsAnchorCs(
  refMinCs: number,
  refMaxCs: number,
  anchorEvent: string,
  backendAnchor: string,
  segments: ProportionEstimationSegment[],
  globalRatio: Record<string, number>,
): [number, number] {
  if (anchorEvent === backendAnchor) {
    return [refMinCs, refMaxCs];
  }
  const g = globalRatio[anchorEvent] ?? 1;
  const low =
    refMinCs * interpolateRatioAt(refMinCs, segments, anchorEvent, g);
  const high =
    refMaxCs * interpolateRatioAt(refMaxCs, segments, anchorEvent, g);
  return [low, high];
}
