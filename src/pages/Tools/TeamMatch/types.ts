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
/** 单场比赛最多登记的有效队伍数 */
export const MAX_ROSTER_TEAMS = 64;
export const MIN_TEAMS = 8;
export const HISTORY_LIMIT = 15;
export const STORAGE_KEY = 'cubing-pro:team-match:v1';
