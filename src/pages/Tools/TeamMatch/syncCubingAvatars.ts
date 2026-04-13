import { throttleBeforeCubingAvatarRequest } from '@/pages/Tools/TeamMatch/wcaRequestThrottle';
import { fetchCubingAvatarUrl } from '@/pages/Tools/TeamMatch/utils/cubingAvatar';
import type { Player } from '@/pages/Tools/TeamMatch/types';
import { playersWithWcaId } from '@/pages/Tools/TeamMatch/syncWcaAvatars';

export { playersWithWcaId };

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    const e = new Error('Aborted');
    e.name = 'AbortError';
    throw e;
  }
}

export type CubingAvatarSyncStep = {
  total: number;
  index: number;
  current: Player;
  previous: { player: Player; displayAvatar: string | null } | null;
};

export type SyncCubingAvatarsOptions = {
  signal?: AbortSignal;
  onSyncStep?: (step: CubingAvatarSyncStep) => void;
  onFinished?: (player: Player, displayAvatar: string | null) => void;
};

/**
 * 按顺序经后端拉取粗饼头像（仅 10 位 WCA ID），每人请求前节流。
 */
export async function syncCubingAvatarsForPlayers(
  players: Player[],
  onProgress?: (done: number, total: number) => void,
  options?: SyncCubingAvatarsOptions,
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
    await throttleBeforeCubingAvatarRequest();
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
      const url = await fetchCubingAvatarUrl(p.wcaId!);
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
