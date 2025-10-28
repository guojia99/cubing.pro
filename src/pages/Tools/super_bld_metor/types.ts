
export type CubeCodeMaps = {
  Name: string;
  Cube: string; // 目前只支持 333, 444, 555

  BaseCode: string; // 坐标， 朝向
  IsDefault: boolean; // 表示置顶默认编码

  // 缓冲
  Buffered: Map<string, string> // eg. {"Edge": "UF"}
  Codes: Map<string, Map<string, string>> // 编码列表 eg. {Edge: {UF: A}} 可以没有
}

export type AssociativeWords = {
  TableColumns:string[]; // A, B, C ....
  TableRows:string[]; // A, B, C....
  Words: Map<string, string[]>;  // 联想词 eg. AB -> 鳌拜
  OneWords: Map<string, string[]>; // 单音联想词 eg. AB -> ao1
  Images: Map<string, string[]>; // 联想词图, url
}


// 地点
export type MemoryPalaceLocation = {
  Name: string; // 地点名
  Pile: string[]; // 桩名
  Notes: string; // 解析
}

export type MemoryPalace = {
  Name: string;
  Cube: string;
  Group: string; // 分组
  Locations: Map<string, MemoryPalaceLocation[]> // 不同的地点桩
  Notes: string; // 解析
}


// 盲拧数据库
export type CodingDictionary = {
  CreateTime: string;
  UpdateTime: string;

  Cubes: Map<string, CubeCodeMaps[]> // 盲拧编码仓库
  AssociativeWords: AssociativeWords; // 联想词仓库
  AlgMap: Map<string, string[]>; // 公式仓库 eg. UF-UR-UB -> xxx, 必须用标准的位置公式
  MemoryPalaces: Map<string, MemoryPalace[]>; // 记忆宫殿, 333mbf, 444, 555， 一个魔方一个
}

