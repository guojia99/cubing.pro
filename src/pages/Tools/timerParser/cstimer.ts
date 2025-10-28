export function NewCsTimerResult(
  results: number[], // 分段成绩
  sc: string, // 打乱,
  node: string,// 注释
  createTime: number, // 时间
) : any[]{
  return [
    results,
    sc,
    node,
    createTime,
  ];
}


export const sessionDataKey = "sessionData"
export const sessionNameKey = "sessionName";
export const sessionScrKey = "sessionScr";
