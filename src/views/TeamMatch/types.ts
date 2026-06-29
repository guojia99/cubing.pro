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

/** 普通学校；`freelancer` 为自由人池（全场仅宜一个），选手可挂靠后参与自由人队 */
export type SchoolKind = 'standard' | 'freelancer';

export type School = {
  id: string;
  name: string;
  kind?: SchoolKind;
};

/** `school`：至少两名同校（普通校）队员的代表队；`freelancer`：自由人队（如三校各一人、双自由人等） */
export type TeamKind = 'school' | 'freelancer';

export type Player = {
  id: string;
  wcaId: string | null;
  /** One 平台数字 uid，用于拉取 ss.sxmfxh.com 成绩 */
  oneId: string | null;
  name: string;
  schoolId: string;
  avatarDataUrl: string | null;
  /** 作战宣言（对战全屏英雄详情等展示） */
  battlecry?: string;
};

export type Team = {
  id: string;
  name: string;
  schoolId: string;
  /** 学校队或自由人队；缺省为 `school`（兼容旧存档） */
  kind?: TeamKind;
  playerIds: string[];
  disabled: boolean;
  /** 由种子步骤写入 */
  isSeed: boolean;
  /** 队伍作战宣言 */
  battlecry?: string;
};

/** 种子成绩采用来源（录入表与种子计算用 `single`/`average`） */
export type SeedingScoreSource = 'wca' | 'one' | 'preliminary' | 'manual';

/**
 * 正式成绩采用策略：自动最佳平均，或固定采用某一来源，或仅手填。
 * WCA 可能偏旧、选手退步时可改选初赛 / One / 手填。
 */
export type SeedingAdoptStrategy = 'best_average' | 'preliminary' | 'wca' | 'one' | 'manual';

/** WCA / One 拉取缓存（秒，无记录为 null） */
export type SeedingEntrySnapshot = {
  single: number | null;
  average: number | null;
};

/** 初赛手填（可与正式录入一致或单独维护） */
export type SeedingEntryPreliminary = {
  single: number | 'DNF' | null;
  average: number | 'DNF' | null;
};

/** 种子阶段：每人每条项目上的录入 */
export type SeedingEntry = {
  playerId: string;
  eventId: WcaEventId;
  /** 正式采用（排序/种子）；与 {@link activeSource} 对应 */
  single: number | 'DNF' | null;
  average: number | 'DNF' | null;
  /** 当前采用来源；`manual` 表示用户在「当前采用」中手改 */
  activeSource?: SeedingScoreSource;
  /** 采用策略；缺省视为 `best_average` */
  adoptStrategy?: SeedingAdoptStrategy;
  wcaBest?: SeedingEntrySnapshot | null;
  oneBest?: SeedingEntrySnapshot | null;
  preliminary?: SeedingEntryPreliminary | null;
};

export type SeedingPrimary = 'average' | 'single';

/** 分区随机：按成绩（与现有算法一致）或完全随机 */
export type DrawRandomMode = 'score' | 'pure';

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

export type PkMultiTeamComputedSummary = {
  teamTotals: Record<string, number | 'dnf_team' | 'incomplete'>;
  /** 参赛队成绩均为 DNF 队伍 */
  allTeamsDnf: boolean;
  computedWinnerTeamId: string | null;
};

export type PkScoreSnapshot = {
  id: string;
  recordedAt: number;
  reason: 'submit' | 'replay' | 'correct';
  results: PkPlayerResult[];
  computed?: PkComputedSummary | PkMultiTeamComputedSummary;
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
  /** 分区随机方式 */
  drawRandomMode: DrawRandomMode;
  /** 首轮是否尽量同校避战（学校队）；完全随机与按成绩均生效 */
  drawAvoidSameSchool: boolean;
  /** 4 区 × 4 槽，槽内存 teamId | null；null 为轮空槽 */
  regionSlots: [BracketSlot16, BracketSlot16, BracketSlot16, BracketSlot16];
  /** 由种子顺序确定的 4 个种子队 id，对应四区第一行 */
  seedTeamIds: [string | null, string | null, string | null, string | null];
  /** 扁平 16 槽（与 region 布局一致展开） */
  flatSlots: BracketSlot16 | null;
  rounds: BracketMatch[][];
  /** 半决赛负者之间的铜牌战（独立于 rounds） */
  bronzeMatch: BracketMatch | null;
  /** 为 true 时不进行季军赛；领奖台第三名为半决赛两名负者并列（第三、四名） */
  skipBronzeMatch: boolean;
  wizardStep: number;
  /** 当前聚焦的淘汰赛轮次/场次（UI） */
  uiFocusMatchId: string | null;
  /**
   * 向导步骤 schema：1=旧版；2=拆分成绩/确认；3=合并「学校」与「选手」为一步。
   * 用于从旧存档迁移 wizardStep。
   */
  wizardSchemaVersion?: number;
  /** One 平台初赛导入：比赛 c_id、轮次（e_id 与「比赛项目」对应） */
  oneCompImport?: {
    cId: number | null;
    eRound: number;
  };
  /**
   * 正赛 16 强名单：超过 16 队时由淘汰赛晋级结果或「跳过淘汰赛」写入；未设置时抽签仍用成绩排名前 16。
   */
  mainBracketTeamIds: string[] | null;
  /** 预选赛（小组战：每组多队同场，仅 1 队晋级）：超过 16 队时可选 */
  elimination: EliminationPhaseState | null;
};

/** 每组同场 PK 的队伍数（2/3/4 队上场，仅 1 队晋级） */
export type ElimGroupSize = 2 | 3 | 4;

/** 预选赛一场小组战：多队同场比总秒，胜者唯一晋级 */
export type ElimGroupPkState = {
  teamIds: string[];
  currentResults: PkPlayerResult[];
  scoreHistory: PkScoreSnapshot[];
  resolution: PkResolution | null;
  lastComputed?: PkComputedSummary | PkMultiTeamComputedSummary;
};

export type EliminationGroupMatch = {
  id: string;
  teamIds: string[];
  winnerId: string | null;
  pk: ElimGroupPkState | null;
};

export type EliminationPhaseState = {
  /** 主办选择跳过预选赛，直接按成绩取前 16 进入正赛抽签 */
  skipped: boolean;
  /** 每组上场队伍数（仅 1 队晋级） */
  groupSize: ElimGroupSize;
  /** 保送队伍（最多 15），不参与预选赛 PK，直接进入晋级池 */
  byeTeamIds: string[];
  /** 每次重新抽签 +1 */
  drawVersion: number;
  /** 抽签后不足一组、仅 1 队无法开赛时直接进晋级池（2 队及以上剩余会另组一场 PK） */
  naturalByeTeamIds: string[];
  /** @deprecated 使用 naturalByeTeamIds */
  naturalByeTeamId?: string | null;
  /** 每波包含几场小组；新抽签固定为单波 [总场数] */
  waveSizes: number[];
  matches: EliminationGroupMatch[];
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
/** 淘汰赛签表固定 16 槽；报名可超过，按成绩排名取前 16 进入正赛 */
export const BRACKET_TEAM_COUNT = 16;
/** 预选赛保送队伍上限 */
export const MAX_ELIMINATION_BYE_TEAMS = 15;
/** 单场比赛最多登记的有效队伍数 */
export const MAX_ROSTER_TEAMS = 64;
export const MIN_TEAMS = 8;
export const HISTORY_LIMIT = 15;
export const STORAGE_KEY = 'cubing-pro:team-match:v1';

/** 向导：队伍选择末步（0–3）后为预选赛与正赛抽签 */
export const WIZARD_STEP_ELIM_DRAW = 4;
export const WIZARD_STEP_ELIM_LIVE = 5;
/** 正赛 16 强名单确认（排序预览） */
export const WIZARD_STEP_MAIN_POOL_CONFIRM = 6;
export const WIZARD_STEP_MAIN_DRAW = 7;
export const WIZARD_STEP_MAIN_LIVE = 8;
export const WIZARD_STEP_PODIUM = 9;
