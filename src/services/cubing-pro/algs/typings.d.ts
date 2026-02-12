export interface OutputClass {
  name: string;
  image: string;
}

export interface AlgorithmGroupsResponse {
  CubeKeys: string[];
  ClassMap: Record<string, OutputClass[]>;
}

// Algorithm 单个公式
export interface Algorithm {
  name: string;
  algs: string[];
  image: string;       // SVG 字符串
  scrambles: string[];
}

// AlgorithmGroup 一个大类里面的分组, 如 EG1-H
export interface AlgorithmGroup {
  name: string;
  algs: Algorithm[];   // 对应 Go 中的 Algorithms 字段，JSON 标签为 "algs"
}

// AlgorithmSet 一个汇总的大类，如 EG1, LEG
export interface AlgorithmSet {
  name: string;
  groups: AlgorithmGroup[];    // 对应 AlgorithmGroups，JSON 标签为 "groups"
  groups_keys: string[];       // 对应 GroupsKeys，JSON 标签为 "groups_keys"
}

// AlgorithmClass 一个汇总的公式集合，如 EG, FH, TEG
export interface AlgorithmClass {
  name: string;
  sets: AlgorithmSet[];        // 对应 Sets，JSON 标签为 "sets"
  setKeys: string[];           // 对应 SetKeys，JSON 标签为 "setKeys"
}
