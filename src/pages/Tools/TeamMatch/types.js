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
//# sourceMappingURL=types.js.map