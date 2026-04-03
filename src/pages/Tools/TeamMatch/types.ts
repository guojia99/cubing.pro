/** WCA 项目 id，如 333 */
export type WcaEventId = string;

/** 成绩：秒（浮点）或 DNF */
export type ResultValue = number | 'DNF';

export type MatchSessionStatus =
  | 'draft'
  | 'schools'
  | 'players'
  | 'teams'
  | 'seeding'
  | 'draw'
  | 'live'
  | 'completed';

export type School = {
  id: string;
  name: string;
};

export type Player = {
  id: string;
  wcaId: string | null;
  name: string;
  schoolId: string;
  avatarDataUrl: string | null;
};

export type Team = {
  id: string;
  name: string;
  schoolId: string;
  playerIds: string[];
  disabled: boolean;
  /** 由种子步骤写入 */
  isSeed: boolean;
};

/** 种子阶段：每人每条项目上的录入 */
export type SeedingEntry = {
  playerId: string;
  eventId: WcaEventId;
  single: number | 'DNF' | null;
  average: number | 'DNF' | null;
};

export type SeedingPrimary = 'average' | 'single';

/** 16 槽位：teamId 或 null 表示该槽为轮空位 */
export type BracketSlot16 = (string | null)[];

/** PK 中单人一条成绩 */
export type PkPlayerResult = {
  playerId: string;
  teamId: string;
  value: ResultValue;
};

export type PkComputedSummary = {
  teamATotal: number | 'dnf_team' | 'incomplete';
  teamBTotal: number | 'dnf_team' | 'incomplete';
  bothSidesDnf: boolean;
  /** 可自动判定时非 null */
  computedWinnerTeamId: string | null;
};

export type PkScoreSnapshot = {
  id: string;
  recordedAt: number;
  reason: 'submit' | 'replay' | 'correct';
  results: PkPlayerResult[];
  computed?: PkComputedSummary;
};

export type PkResolution =
  | { mode: 'computed'; winnerTeamId: string }
  | { mode: 'manual'; winnerTeamId: string }
  | { mode: 'pending_both_dnf' };

export type PkMatchState = {
  teamAId: string;
  teamBId: string;
  currentResults: PkPlayerResult[];
  scoreHistory: PkScoreSnapshot[];
  resolution: PkResolution | null;
  /** 展示用：最近一次结算时的计算结果 */
  lastComputed?: PkComputedSummary;
};

export type BracketMatch = {
  id: string;
  roundIndex: number;
  indexInRound: number;
  teamAId: string | null;
  teamBId: string | null;
  /** 轮空或仅一队：直接晋级，无需 PK */
  byeWinnerId: string | null;
  winnerId: string | null;
  pk: PkMatchState | null;
};

export type TeamMatchSession = {
  id: string;
  name: string;
  status: MatchSessionStatus;
  createdAt: number;
  updatedAt: number;
  /** 本场比赛项目 */
  eventIds: WcaEventId[];
  seedingPrimary: SeedingPrimary;
  schools: School[];
  players: Player[];
  teams: Team[];
  seeding: SeedingEntry[];
  /** 抽签版本号，每次重随机 +1 */
  drawVersion: number;
  /** 4 区 × 4 槽，槽内存 teamId | null；null 为轮空槽 */
  regionSlots: [BracketSlot16, BracketSlot16, BracketSlot16, BracketSlot16];
  /** 由种子顺序确定的 4 个种子队 id，对应四区第一行 */
  seedTeamIds: [string | null, string | null, string | null, string | null];
  /** 扁平 16 槽（与 region 布局一致展开） */
  flatSlots: BracketSlot16 | null;
  rounds: BracketMatch[][];
  /** 半决赛负者之间的铜牌战（独立于 rounds） */
  bronzeMatch: BracketMatch | null;
  wizardStep: number;
  /** 当前聚焦的淘汰赛轮次/场次（UI） */
  uiFocusMatchId: string | null;
};

export type ArchivedSessionMeta = {
  id: string;
  name: string;
  updatedAt: number;
  status: MatchSessionStatus;
  summary: string;
};

export type TeamMatchStorageRoot = {
  version: 1;
  currentSessionId: string | null;
  sessions: Record<string, TeamMatchSession>;
  historyIds: string[];
};

export const TEAM_PLAYERS = 3;
export const MAX_TEAMS = 16;
export const MIN_TEAMS = 8;
export const HISTORY_LIMIT = 15;
export const STORAGE_KEY = 'cubing-pro:team-match:v1';
