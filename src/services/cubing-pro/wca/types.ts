/**
 * WCA 比赛成绩记录
 */
export interface WCAResult {
  id: number; // 记录唯一 ID
  pos: number; // 当前排名
  round_id: number; // 轮次 ID
  best: number; // 单次最佳成绩（单位：毫秒或特定格式）
  average: number; // 平均成绩（单位：毫秒或特定格式）
  name: string; // 选手姓名
  country_iso2: string; // 国家/地区 ISO 2 字母代码
  competition_id: string; // 比赛 ID
  event_id: string; // 项目 ID（如 333, 333fm, 444 等）
  round_type_id: string; // 轮次类型 ID（如 1, 2, 3, f 等）
  format_id: string; // 比赛形式 ID（如 m=平均, a=单次, 3=三轮制等）
  wca_id: string; // WCA 唯一 ID
  attempts: number[]; // 五次尝试的成绩数组， 0 通常表示未完成（DNF）或未使用， -1,-2 代表DNF或DNS
  best_index: number; // 最佳成绩在 attempts 中的索引（从 0 开始）
  worst_index: number; // 最差成绩在 attempts 中的索引（从 0 开始）
  regional_single_record: 'NR' | 'AsR' | 'WR' | 'CR' | null; // 区域单次记录标记， 可能值：null, "NR", "AsR", "WR" 等
  regional_average_record: 'NR' | 'AsR' | 'WR' | 'CR' | null; // 区域平均记录标记， 可能值：null, "NR", "AsR", "WR" 等
}

export interface WCAPerson {
  wca_id: string;
  wcaId: string;
  sub_id: number;
  name: string;
  country_id: string;
  gender: string;
}

// 定义API响应数据的TypeScript接口
interface RoleWCAUser {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  wca_id: string;
  gender: string;
  country_iso2: string;
  url: string;
  country: {
    id: string;
    name: string;
    continent_id: string;
    iso2: string;
  };
  email: string;
  class: string;
  avatar: {
    id: number;
    status: string;
    thumbnail_crop_x: number;
    thumbnail_crop_y: number;
    thumbnail_crop_w: number;
    thumbnail_crop_h: number;
    url: string;
    thumb_url: string;
    is_default: boolean;
    can_edit_thumbnail: boolean;
  };
}

interface WCAUserGroupMetadata {
  id: number;
  email?: string;
  friendly_id?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
}

interface WCAUserGroup {
  id: number;
  name: string;
  group_type: string;
  parent_group_id: number | null;
  is_active: boolean;
  is_hidden: boolean;
  metadata_id: number;
  metadata_type: string;
  created_at: string;
  updated_at: string;
  metadata: WCAUserGroupMetadata;
}

interface WCAUserRoleMetadata {
  id: number;
  status: string;
  location?: string;
  first_delegated?: string;
  last_delegated?: string;
  total_delegated?: number;
  created_at: string;
  updated_at: string;
}

export interface WCAUserRole {
  id: number;
  start_date: string;
  end_date: string | null;
  user: RoleWCAUser;
  group: WCAUserGroup;
  metadata?: WCAUserRoleMetadata;
  class: string;
}

// API响应结构
export interface WCAUserRoleResponse {
  data: WCAUserRole[];
}


/**
 * WCA 比赛信息结构体
 */
export interface WCACompetition {
  /**
   * 比赛唯一 ID
   */
  id: string;

  /**
   * 比赛全名
   */
  name: string;

  /**
   * 比赛场馆
   */
  venue: string;

  /**
   * 注册开始时间（ISO 8601 格式）
   */
  registration_open: string | null;

  /**
   * 注册结束时间（ISO 8601 格式）
   */
  registration_close: string | null;

  /**
   * 成绩发布时间（ISO 8601 格式）
   */
  results_posted_at: string;

  /**
   * 比赛公告时间（ISO 8601 格式）
   */
  announced_at: string;

  /**
   * 比赛开始日期（YYYY-MM-DD）
   */
  start_date: string;

  /**
   * 比赛结束日期（YYYY-MM-DD）
   */
  end_date: string;

  /**
   * 参赛人数上限
   */
  competitor_limit: number;

  /**
   * 取消比赛时间（ISO 8601 格式），若未取消则为 null
   */
  cancelled_at: string | null;

  /**
   * WCA 官网链接
   */
  url: string;

  /**
   * 比赛官网链接
   */
  website: string;

  /**
   * 比赛简称
   */
  short_name: string;

  /**
   * 比赛显示名称
   */
  short_display_name: string;

  /**
   * 比赛城市
   */
  city: string;

  /**
   * 场馆地址
   */
  venue_address: string;

  /**
   * 场馆详情
   */
  venue_details: string;

  /**
   * 纬度（度）
   */
  latitude_degrees: number;

  /**
   * 经度（度）
   */
  longitude_degrees: number;

  /**
   * 国家/地区 ISO 2 代码
   */
  country_iso2: string;

  /**
   * 比赛项目 ID 列表
   */
  event_ids: string[];

  /**
   * 距离注册开始时间（如果未开始）
   */
  time_until_registration: string | null;

  /**
   * 比赛日期范围（格式化字符串）
   */
  date_range: string;

  /**
   * 比赛代表信息列表
   */
  delegates: WCAUser[];

  /**
   * 比赛组织者信息列表
   */
  organizers: WCAUser[];

  /**
   * 对象类型标识
   */
  class: string;


  indexNum: number;
}

/**
 * WCA 用户（代表/组织者）信息结构体
 */
export interface WCAUser {
  /**
   * 用户唯一 ID
   */
  id: number;

  /**
   * 创建时间（ISO 8601 格式）
   */
  created_at: string;

  /**
   * 更新时间（ISO 8601 格式）
   */
  updated_at: string;

  /**
   * 用户姓名
   */
  name: string;

  /**
   * WCA 唯一 ID
   */
  wca_id: string;

  /**
   * 性别（m/f/o）
   */
  gender: string;

  /**
   * 国家/地区 ISO 2 代码
   */
  country_iso2: string;

  /**
   * WCA 个人页面链接
   */
  url: string;

  /**
   * 用户国家信息
   */
  country: {
    id: string;
    name: string;
    continent_id: string;
    iso2: string;
  };

  /**
   * 用户位置信息（可能为 null）
   */
  location: string | null;

  /**
   * 代表区域 ID（仅代表用户有）
   */
  region_id: number | null;

  /**
   * 代表状态（仅代表用户有）
   */
  delegate_status: string | null;

  /**
   * 用户邮箱（可能为 null）
   */
  email: string | null;

  /**
   * 对象类型标识
   */
  class: string;

  /**
   * 所属团队列表
   */
  teams: any[]; // 具体结构未在示例中给出

  /**
   * 用户头像信息
   */
  avatar: {
    id: number | null;
    status: string;
    thumbnail_crop_x: number;
    thumbnail_crop_y: number;
    thumbnail_crop_w: number;
    thumbnail_crop_h: number;
    url: string;
    thumb_url: string;
    is_default: boolean;
    can_edit_thumbnail: boolean;
  };
}


interface Person {
  name: string;
  gender: string;
  url: string;
  country: Country | undefined;
  location: string;
  region_id: number;
  delegate_status: string;
  email: string;
  class: string;
  teams: any[];
  avatar: Avatar;
  wca_id: string;
  country_iso2: string;
  id: string;
}

export interface Country {
  id: string;
  name: string;
  continent_id: string;
  iso2: string;
}

interface Avatar {
  id: number;
  status: string;
  thumbnail_crop_x: number;
  thumbnail_crop_y: number;
  thumbnail_crop_w: number;
  thumbnail_crop_h: number;
  url: string;
  thumb_url: string;
  is_default: boolean;
  can_edit_thumbnail: boolean;
}

interface PersonalRecord {
  id: number;
  person_id: string;
  event_id: string;
  best: number;
  world_rank: number;
  continent_rank: number;
  country_rank: number;
}

interface EventRecords {
  single?: PersonalRecord;
  average?: PersonalRecord;
}

interface PersonalRecords {
  [event: string]: EventRecords; // Map of event_id to EventRecords
}

interface Medals {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

interface Records {
  national: number;
  continental: number;
  world: number;
  total: number;
}

export interface WcaProfilePerson {
  person: Person;
}

export interface WcaProfile {

  name: string;
  wcaId : string;
  countryId : string;
  gender: string;
  thumb_url: string;
  country_iso2: string;

  competition_count: number;
  personal_records: PersonalRecords;
  medals: Medals;
  records: Records;
}



export interface StaticWithTimerRank {
  wcaId: string;
  wcaName: string;
  eventId: string;
  year: number;
  month: number;
  week: number;
  single: number;
  average: number;
  country: string;
  singleCountryRank: number;
  singleWorldRank: number;
  singleContinentRank: number;
  avgCountryRank: number;
  avgWorldRank: number;
  avgContinentRank: number;
}
