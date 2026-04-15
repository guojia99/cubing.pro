import type { EventsAPI } from '@/services/cubing-pro/events/typings';

/** 从 events 元数据解析 scrambleValue「222,333,…」 */
export function parseScramblePuzzleIds(scrambleValue?: string): string[] {
  if (!scrambleValue?.trim()) {
    return [];
  }
  return scrambleValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isMbfEventId(eventId: string): boolean {
  return eventId === '333mbf';
}

/** 连拧等：class 或 id 含 relay（events 接口含 class 字段） */
export function isRelayMetaEvent(base: EventsAPI.Event): boolean {
  const ext = base as EventsAPI.Event & { class?: string };
  const cls = ext.class ?? '';
  if (cls.includes('连拧')) {
    return true;
  }
  const id = base.id ?? '';
  return typeof id === 'string' && id.toLowerCase().includes('relay');
}

/** 连拧 / 多盲：打乱区不生成 cube 图 */
export function shouldHideScrambleImage(
  eventId: string,
  base: EventsAPI.Event,
): boolean {
  return isMbfEventId(eventId) || isRelayMetaEvent(base);
}

/**
 * 将一整包打乱拆成 expectCount 段（服务端常把多段合成一条字符串）。
 * 优先空行分段，再单行，再识别 #n 独立行。
 */
export function splitScrambleBlob(blob: string, expectCount: number): string[] | null {
  if (expectCount < 1) {
    return null;
  }
  const t = blob.trim();
  if (!t) {
    return null;
  }
  if (expectCount === 1) {
    return [t];
  }

  const paras = t
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paras.length === expectCount) {
    return paras;
  }

  const lines = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length === expectCount) {
    return lines;
  }

  const chunks: string[] = [];
  let cur: string[] = [];
  for (const line of lines) {
    if (/^#\d+\s*$/.test(line)) {
      if (cur.length) {
        chunks.push(cur.join('\n'));
        cur = [];
      }
    } else {
      cur.push(line);
    }
  }
  if (cur.length) {
    chunks.push(cur.join('\n'));
  }
  if (chunks.length === expectCount) {
    return chunks;
  }

  return null;
}

export type ResolvedSegments = {
  segments: string[] | null;
  /** 无法拆分时整包原文，用于降级一行展示 */
  fallbackBlob: string | null;
};

export function resolveStructuredSegments(ssc: string[], puzzleIds: string[]): ResolvedSegments {
  if (puzzleIds.length < 2) {
    return { segments: null, fallbackBlob: null };
  }
  if (ssc.length === puzzleIds.length) {
    return { segments: [...ssc], fallbackBlob: null };
  }
  if (ssc.length === 1) {
    const split = splitScrambleBlob(ssc[0], puzzleIds.length);
    if (split) {
      return { segments: split, fallbackBlob: null };
    }
    return { segments: null, fallbackBlob: ssc[0] };
  }
  return { segments: null, fallbackBlob: ssc.join('\n\n') };
}

/** 群赛计时器单行：连拧为「222\\n打乱\\n\\n333\\n…」；多盲为「#1\\n…」 */
export function formatTimerSingleBlob(
  segments: string[],
  puzzleIds: string[],
  isMbf: boolean,
): string {
  return segments
    .map((s, i) => {
      if (isMbf) {
        return `#${i + 1}\n${s}`;
      }
      const label = puzzleIds[i] ?? String(i + 1);
      return `${label}\n${s}`;
    })
    .join('\n\n');
}
