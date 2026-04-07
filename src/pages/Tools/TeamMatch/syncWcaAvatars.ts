import { throttleBeforeWcaAvatarRequest } from '@/pages/Tools/TeamMatch/wcaRequestThrottle';
import { fetchWcaAvatarThumbUrl } from '@/pages/Tools/TeamMatch/utils/wcaAvatar';
import type { Player } from '@/pages/Tools/TeamMatch/types';

export function playersWithWcaId(players: Player[]): Player[] {
  return players.filter((p) => p.wcaId && p.wcaId.trim().length === 10);
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    const e = new Error('Aborted');
    e.name = 'AbortError';
    throw e;
  }
}

/** 单次「开始拉取某人」时的 UI 状态：当前人 + 上一位（已拉取完） */
export type WcaAvatarSyncStep = {
  total: number;
  index: number;
  current: Player;
  previous: { player: Player; displayAvatar: string | null } | null;
};

export type SyncWcaAvatarsOptions = {
  signal?: AbortSignal;
  /** 每人开始请求前（节流之后） */
  onSyncStep?: (step: WcaAvatarSyncStep) => void;
  /** 每人请求结束后（用于滚动历史） */
  onFinished?: (player: Player, displayAvatar: string | null) => void;
};

/**
 * 按顺序拉取 WCA 头像（仅 10 位 WCA ID），每人请求前间隔至少 1 秒。
 */
export async function syncWcaAvatarsForPlayers(
  players: Player[],
  onProgress?: (done: number, total: number) => void,
  options?: SyncWcaAvatarsOptions,
): Promise<{ players: Player[]; updatedCount: number }> {
  const signal = options?.signal;
  const targets = playersWithWcaId(players);
  const total = targets.length;
  if (total === 0) return { players, updatedCount: 0 };

  const byId = new Map<string, string>();
  let done = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i]!;
    throwIfAborted(signal);
    await throttleBeforeWcaAvatarRequest();
    throwIfAborted(signal);

    const previous =
      i > 0
        ? {
            player: targets[i - 1]!,
            displayAvatar:
              byId.get(targets[i - 1]!.id) ?? targets[i - 1]!.avatarDataUrl ?? null,
          }
        : null;

    options?.onSyncStep?.({ total, index: i, current: p, previous });

    try {
      const url = await fetchWcaAvatarThumbUrl(p.wcaId!);
      if (url) byId.set(p.id, url);
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      /* 单人失败则跳过 */
    }

    const displayAvatar = byId.get(p.id) ?? p.avatarDataUrl ?? null;
    options?.onFinished?.(p, displayAvatar);

    done += 1;
    onProgress?.(done, total);
  }

  let updatedCount = 0;
  const next = players.map((p) => {
    const url = byId.get(p.id);
    if (!url) return p;
    if (p.avatarDataUrl === url) return p;
    updatedCount += 1;
    return { ...p, avatarDataUrl: url };
  });

  return { players: next, updatedCount };
}
