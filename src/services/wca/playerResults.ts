/**
 * WCA 比赛成绩记录
 */
export interface WCAResult {
  /**
   * 记录唯一 ID
   */
  id: number;

  /**
   * 当前排名
   */
  pos: number;

  /**
   * 轮次 ID
   */
  round_id: number;

  /**
   * 单次最佳成绩（单位：毫秒或特定格式）
   * 例如：19 表示 0.19 秒（在 FMC 中可能为步数）
   */
  best: number;

  /**
   * 平均成绩（单位：毫秒或特定格式）
   * 例如：2033 表示 20.33 秒
   */
  average: number;

  /**
   * 选手姓名
   */
  name: string;

  /**
   * 国家/地区 ISO 2 字母代码
   */
  country_iso2: string;

  /**
   * 比赛 ID
   */
  competition_id: string;

  /**
   * 项目 ID（如 333, 333fm, 444 等）
   */
  event_id: string;

  /**
   * 轮次类型 ID（如 1, 2, 3, f 等）
   */
  round_type_id: string;

  /**
   * 比赛形式 ID（如 m=平均, a=单次, 3=三轮制等）
   */
  format_id: string;

  /**
   * WCA 唯一 ID
   */
  wca_id: string;

  /**
   * 五次尝试的成绩数组
   * 0 通常表示未完成（DNF）或未使用
   */
  attempts: number[];

  /**
   * 最佳成绩在 attempts 中的索引（从 0 开始）
   */
  best_index: number;

  /**
   * 最差成绩在 attempts 中的索引（从 0 开始）
   */
  worst_index: number;

  /**
   * 区域单次记录标记
   * 可能值：null, "NR", "AsR", "WR" 等
   */
  regional_single_record: 'NR' | 'AsR' | 'WR' | 'CR' | null;

  /**
   * 区域平均记录标记
   * 可能值：null, "NR", "AsR", "WR" 等
   */
  regional_average_record: 'NR' | 'AsR' | 'WR' | 'CR' | null;
}

export async function getWCAPersonResults(wcaID: string): Promise<WCAResult[]> {
  const personsAPI = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}/results`; // 2017XUYO01

  if (wcaID.length !== 10){
    throw new Error("WCAID错误");
  }

  try {
    const response = await fetch(personsAPI);
    if (!response.ok) {
      throw new Error(`找不到该选手成绩数据: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('WCA服务器异常错误:', error);
    throw error;
  }
}
