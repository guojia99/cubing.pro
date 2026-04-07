import type { Player } from '@/pages/Tools/TeamMatch/types';

export type ParsedOneUidRow = {
  rank?: string;
  name: string;
  oneId: string;
  rawLine: string;
};

/** 解析单行：支持「序号 Tab 姓名 Tab uid」或「姓名 Tab uid」；无 Tab 时支持「序号 姓名 uid」或「姓名 uid」 */
export function parseOneUidLine(line: string): ParsedOneUidRow | null {
  const t = line.trim();
  if (!t || t.startsWith('#')) return null;

  const tabParts = t.split(/\t/).map((s) => s.trim()).filter((p) => p !== '');
  if (tabParts.length >= 3 && (tabParts[0] === '排名' || tabParts[0] === '序号') && tabParts[1] === '姓名') {
    return null;
  }
  if (tabParts.length >= 2) {
    if (tabParts.length === 2) {
      const [a, b] = tabParts;
      if (!/^\d+$/.test(b)) return null;
      return { name: a, oneId: b, rawLine: line };
    }
    const uid = tabParts[tabParts.length - 1];
    if (!/^\d+$/.test(uid)) return null;
    if (tabParts.length === 3) {
      return { rank: tabParts[0], name: tabParts[1], oneId: uid, rawLine: line };
    }
    const name = tabParts.slice(1, -1).join(' ');
    if (!name) return null;
    return { rank: tabParts[0], name, oneId: uid, rawLine: line };
  }

  const ws = t.split(/\s+/).filter(Boolean);
  if (ws.length >= 3 && /^\d+$/.test(ws[ws.length - 1]!)) {
    const uid = ws[ws.length - 1]!;
    const name = ws.slice(1, -1).join(' ');
    if (!name) return null;
    const rank = /^\d+$/.test(ws[0]!) ? ws[0] : undefined;
    return { rank, name, oneId: uid, rawLine: line };
  }
  if (ws.length === 2 && /^\d+$/.test(ws[1]!)) {
    return { name: ws[0]!, oneId: ws[1]!, rawLine: line };
  }
  return null;
}

export function parseBulkOneUidText(text: string): ParsedOneUidRow[] {
  const out: ParsedOneUidRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const p = parseOneUidLine(line);
    if (p) out.push(p);
  }
  return out;
}

export type SyncOneIdResult = {
  /** 应用更新后的完整选手列表；与 players 结构一致 */
  nextPlayers: Player[];
  /** 文档中有、但当前名单无此姓名的行（忽略，不新增选手） */
  unmatched: ParsedOneUidRow[];
  /** 粘贴中同一姓名出现多次，仅采用第一次 */
  batchDuplicateNameSkipped: ParsedOneUidRow[];
  /** 姓名已匹配且 uid 与当前一致，无需改 */
  unchanged: { player: Player; row: ParsedOneUidRow }[];
  /** 将写入的更新（姓名 -> 新 uid） */
  applied: { player: Player; oldOneId: string | null; newOneId: string; row: ParsedOneUidRow }[];
};

export type SyncOneIdFailure = {
  ok: false;
  /** 导致冲突的重复 One ID（数字字符串） */
  duplicateOneIds: string[];
};

export type SyncOneIdOutcome = { ok: true; data: SyncOneIdResult } | SyncOneIdFailure;

/**
 * 仅按「姓名」与当前已有选手匹配，更新匹配者的 One ID；名单外的姓名忽略。
 * 若应用全部更新后任意两名选手 One ID 相同，则整批不应用（返回 ok: false）。
 */
export function syncOneIdFromPaste(parsed: ParsedOneUidRow[], players: Player[]): SyncOneIdOutcome {
  const byName = (n: string) => players.find((p) => p.name.trim() === n.trim());

  const firstByName = new Map<string, ParsedOneUidRow>();
  const batchDuplicateNameSkipped: ParsedOneUidRow[] = [];

  for (const row of parsed) {
    const name = row.name.trim();
    if (!name || !/^\d+$/.test(row.oneId.trim())) continue;
    if (firstByName.has(name)) {
      batchDuplicateNameSkipped.push(row);
      continue;
    }
    firstByName.set(name, row);
  }

  const unmatched: ParsedOneUidRow[] = [];
  const unchanged: { player: Player; row: ParsedOneUidRow }[] = [];
  const applied: SyncOneIdResult['applied'] = [];

  const nextPlayers: Player[] = players.map((p) => ({ ...p }));

  for (const [name, row] of firstByName) {
    const uid = row.oneId.trim();
    const player = byName(name);
    if (!player) {
      unmatched.push(row);
      continue;
    }
    const cur = (player.oneId ?? '').trim();
    if (cur === uid) {
      unchanged.push({ player, row });
      continue;
    }
    const idx = nextPlayers.findIndex((x) => x.id === player.id);
    if (idx < 0) continue;
    nextPlayers[idx] = { ...nextPlayers[idx], oneId: uid };
    applied.push({ player, oldOneId: player.oneId, newOneId: uid, row });
  }

  const oneIds = nextPlayers.map((p) => (p.oneId ?? '').trim()).filter(Boolean);
  if (new Set(oneIds).size !== oneIds.length) {
    const cnt = new Map<string, number>();
    for (const id of oneIds) cnt.set(id, (cnt.get(id) ?? 0) + 1);
    const duplicateOneIds = [...cnt.entries()].filter(([, c]) => c > 1).map(([id]) => id);
    return { ok: false, duplicateOneIds };
  }

  return {
    ok: true,
    data: {
      nextPlayers,
      unmatched,
      batchDuplicateNameSkipped,
      unchanged,
      applied,
    },
  };
}
