import {JSX} from "react";

// Cubes Map Start
export enum Cubes {
// 特殊
  JuBaoHaoHao = "jhh",
  OtherCola = "o_cola",

// wca
  Cube222 = "222",
  Cube333 = "333",
  Cube444 = "444",
  Cube555 = "555",
  Cube666 = "666",
  Cube777 = "777",
  CubeSk = "skewb",
  CubePy = "pyram",
  CubeSq1 = "sq1",
  CubeMinx = "minx",
  CubeMegaminx = "megaminx",
  CubeClock = "clock",
  Cube333OH = "333oh",
  Cube333FM = "333fm",
  Cube333BF = "333bf",
  Cube444BF = "444bf",
  Cube555BF = "555bf",
  Cube333MBF = "333mbf",
  Cube333Ft = "333ft",

// 趣味最少步
  XCubePyFm = "pyram_fm",
  XCubeSkFm = "skewb_fm",
  XCubeClockFm = "clock_fm",
  XCube222Fm = "222fm",

// 盲
  XCube333MBFUnlimited = "333mbf_unlimited",
  XCube222BF = "222bf",
  XCube666BF = "666bf",
  XCube777BF = "777bf",
  XCubePyBF = "pyram_bf",
  XCubeSkBF = "skewb_bf",
  XCubeMinxBf = "minx_bf",
  XCubeClockBf = "clock_bf",
  XCubeSQ1Bf = "sq1_bf",

// 单手
  XCube333BfOH = "333bf_oh", // 三单盲
  XCube444BfOH = "444bf_oh",
  XCube555BfOH = "555bf_oh",
  XCube222OH = "222oh",
  XCube333MiniOH = "333mini_oh",
  XCube444OH = "444oh",
  XCube555OH = "555oh",
  XCube666OH = "666oh",
  XCube777OH = "777oh",
  XCubeSkOH = "skewb_oh",
  XCubePyOH = "pyram_oh",
  XCubeSq1OH = "sq1_oh",
  XCubeMinxOH = "minx_oh",
  XCubeClockOH = "clock_oh",

// 连
  XCube333Multiple5 = "333multiple5",
  XCube333OHMultiple5 = "333oh_multiple5",
  XCube333Multiple10 = "333multiple10",
  XCube333OHMultiple10 = "333oh_multiple10",
  XCube333Multiple15 = "333multiple15",
  XCube333OHMultiple15 = "333oh_multiple15",
  XCube333Multiple20 = "333multiple20",
  XCube333OHMultiple20 = "333oh_multiple20",
  XCube2345Relay = "2345relay",
  XCube2345OHRelay = "2345oh_relay",
  XCube27Relay = "2_7relay",
  XCube27OHRelay = "2_7oh_relay",
  XCube345RelayBF = "345relay_bf",
  XCube345OHRelayBF = "345oh_relay_bf",
  XCubeAlienRelay = "alien_relay", // 塔斜表五Q
  XCubeAlienOHRelay = "alien_oh_relay",
  XCube27AlienRelayAll = "27alien_relay",
  XCube27AlienOHRelayAll = "27alien_oh_relay",

// 特殊魔方
  XCube333Mirror = "333mirror",
  XCube333Mirroring = "333mirroring",
  XCube333Ghost = "333ghost",
  XCube333ZongZi = "333Zongzi",
  XCubeHotWheels = "hot_wheels",
  XCubeFisher = "fisher",
  XCubeGear = "gear",
  Xcube333Clone = "333clone",
  XCubeMapleLeaf = "maple_leaf",
  XCube222Minx = "222minx",
  XCube444Minx = "444minx",
  XCube555Minx = "555minx",
  XCube333Mini = "333mini",
  XCube444Py = "444pyram",
  XCube888 = "888",
  XCube999 = "999",
  XCube10L = "10level",
  XCube11L = "11level",
  XCube12L = "12level",
  XCube13L = "13level",
  XCube14L = "14level",
  XCube15L = "15level",
  XCube16L = "16level",
  XCube17L = "17level",
  XCube21L = "21level",
  XCube133 = "133",
  XCube223 = "223",
  XCube233 = "233",
  XCube334 = "334",
  XCube335 = "335",
  XCube336 = "336",
  XCube337 = "337",
  XCubeHelicopter = "helicopter",
  XCubeRedi = "redi",

// 数独系列
  NotCubeSuDoKuVeryEasy = "sudoku_very_easy",
  NotCubeSuDoKuEasy = "sudoku_easy",
  NotCubeSuDoKuModerate = "sudoku_moderate",
  NotCubeSuDoKuAdvanced = "sudoku_advanced",
  NotCubeSuDoKuHard = "sudoku_hard",
  NotCubeSuDoKuMaster = "sudoku_master",

// 数字华容道系列
  NotCube8Puzzle = "8puzzle",
  NotCube15Puzzle = "15puzzle",
  NotCube24Puzzle = "24puzzle",
  NotCube35Puzzle = "35puzzle",
  NotCube48Puzzle = "48puzzle",
  NotCube63Puzzle = "63puzzle",
  NotCube80Puzzle = "80puzzle",

// 记字

  NotCubeDigit = "digit",     // 任意字符： 数字 + 大小写字母 + 其他字符
  NotCubeDigitOnlyNumber = "digit_num",     // 纯数字
  NotCubeDigitOnlyUppercase = "digit_uppercase",   // 大写字母
  NotCubeDigitNumberAndUppercase = "digit_num_uppercase", // 数字 + 大写字母
  NotCubePuke = "puke",         // 扑克记忆

  // 盲拧系列
  BFGroup333BF = "3bf",
  BFGroup444BF = "4bf",
  BFGroup555BF = "5bf",
  BFGroup333MBF = "3mbf",

  BFGroup333BF1 = "3bf1",
  BFGroup333BF2 = "3bf2",
  BFGroup333BF3 = "3bf3",
  BFGroup333BF4 = "3bf4",
  BFGroup333BF5 = "3bf5",
  BFGroup333BF6 = "3bf6",
  BFGroup333BF7 = "3bf7",
  BFGroup444BF1 = "4bf1",
  BFGroup444BF2 = "4bf2",
  BFGroup444BF3 = "4bf3",
  BFGroup444BF4 = "4bf4",
  BFGroup555BF1 = "5bf1",
  BFGroup555BF2 = "5bf2",
  BFGroup555BF3 = "5bf3",
  BFGroup555BF4 = "5bf4",
  BFGroup333MBF1 = "3mbf1",
  BFGroup333MBF2 = "3mbf2",
  BFGroup333MBF3 = "3mbf3",
  BFGroup333MBF4 = "3mbf4",
}

// Cubes Map End

export enum SegmentationType {
  WCA = "WCA项目",
  XCube = "趣味项目",
  XCubeBF = "趣味盲拧",
  XCubeOH = "趣味单手",
  XCubeFm = "趣味最少步",
  XCubeRelay = "趣味连拧",
  NotCube = "趣味非魔方",
  Digit = "记字",
  SuperHigh = "超高阶",
  BFGroup = "盲拧群系列",
  Other = "其他"
}

export enum CubesRouteType {
  RouteType1rounds = "1_r",      // 单轮项目
  RouteType3roundsBest = "3_r_b", // 三轮取最佳
  RouteType3roundsAvg = "3_r_a",   // 三轮取平均
  RouteType5roundsBest = "5_r_b",   // 五轮取最佳
  RouteType5roundsAvg = "5_r_a",  // 五轮取平均
  RouteType5RoundsAvgHT = "5_r_a_ht",// 五轮去头尾取平均
  RouteTypeRepeatedly = "ry",    // 单轮多次还原项目, 成绩1:还原数; 成绩2:尝试数; 成绩3:时间;
}

export function CubesRouteTypeCn(typ: CubesRouteType): string {
  switch (typ) {
    case CubesRouteType.RouteType1rounds:
      return "单轮项目"
    case CubesRouteType.RouteType3roundsAvg:
      return "三轮取平均"
    case CubesRouteType.RouteType3roundsBest:
      return "三轮取最佳"
    case CubesRouteType.RouteTypeRepeatedly:
      return "单轮多次还原项目"
    case CubesRouteType.RouteType5roundsAvg:
      return "五轮取平均"
    case CubesRouteType.RouteType5RoundsAvgHT:
      return "五轮去头尾取平均"
    case CubesRouteType.RouteType5roundsBest:
      return "五轮取最佳"
  }
}

export function SegmentationTypeList(): SegmentationType[] {
  return [
    SegmentationType.WCA,
    SegmentationType.SuperHigh,
    SegmentationType.XCube,
    SegmentationType.XCubeBF,
    SegmentationType.XCubeOH,
    SegmentationType.XCubeFm,
    SegmentationType.XCubeRelay,
    SegmentationType.NotCube,
    SegmentationType.Digit,
    SegmentationType.BFGroup,
  ]
}

export function CubesRouteTypeNumber(typ: CubesRouteType): number {
  switch (typ) {
    case CubesRouteType.RouteType1rounds:
      return 1
    case CubesRouteType.RouteType5roundsBest:
      return 5
    case CubesRouteType.RouteType5RoundsAvgHT:
      return 5
    case CubesRouteType.RouteType5roundsAvg:
      return 5
    case CubesRouteType.RouteType3roundsBest:
      return 3
    case CubesRouteType.RouteType3roundsAvg:
      return 3
    case CubesRouteType.RouteTypeRepeatedly:
      return 3
  }
}


type DrawCubeFn = (id: string, size: number, imageWidth: number, seq: string[]) => JSX.Element[]

export type CubesAttributes = {
  Cubes: Cubes, // 项目
  Cn: string, // 中文名
  RouteType: CubesRouteType, // 项目轮次形式
  IsWCA: boolean, // 是否WCA项目
  Segmentation: SegmentationType, // 细分类
  DrawSeq: boolean, // 是否展示公式
  DrawSize: number, // 绘制打乱列表图像阶数，目前只有正阶用到了
  SeqNumber: number, // 打乱数
  SpareSeqNumber: number, // 备打数
  Icon: string,
}


// Start CubesAttributesList
export const CubesAttributesList: CubesAttributes[] = [
  // WCA正阶
  {
    Cubes: Cubes.Cube333,
    Cn: "三阶",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,
    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0a",
  },
  {
    Cubes: Cubes.Cube222,
    Cn: "二阶",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 2,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea09",
  },
  {
    Cubes: Cubes.Cube444,
    Cn: "四阶",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 4,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea11",
  },
  {
    Cubes: Cubes.Cube555,
    Cn: "五阶",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 5,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea13",
  },
  {
    Cubes: Cubes.Cube666,
    Cn: "六阶",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 6,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea15",
  },
  {
    Cubes: Cubes.Cube777,
    Cn: "七阶",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 7,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea16",
  },
  {
    Cubes: Cubes.CubeSk,
    Cn: "斜转",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea1c",
  },
  {
    Cubes: Cubes.CubePy,
    Cn: "金字塔",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea1b",
  },
  {
    Cubes: Cubes.CubeSq1,
    Cn: "SQ1",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea1d",
  },
  {
    Cubes: Cubes.CubeMinx,
    Cn: "五魔方",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea19",
  },
  {
    Cubes: Cubes.CubeMegaminx,
    Cn: "五魔",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea19",
  },
  {
    Cubes: Cubes.CubeClock,
    Cn: "魔表",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea17",
  },
  {
    Cubes: Cubes.Cube333OH,
    Cn: "单手",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea10",
  },
  {
    Cubes: Cubes.Cube333FM,
    Cn: "最少步",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0c",
  },
  {
    Cubes: Cubes.Cube333BF,
    Cn: "三盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.Cube444BF,
    Cn: "四盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea12",
  },
  {
    Cubes: Cubes.Cube555BF,
    Cn: "五盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea14",
  },
  {
    Cubes: Cubes.Cube333MBF,
    Cn: "多盲",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: true,
    Segmentation: SegmentationType.WCA,

    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0e",
  },

  // -
  {
    Cubes: Cubes.Cube333Ft,
    Cn: "脚拧",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0d",
  },


  // --------------------------- XCUbe ---------------------------
  {
    Cubes: Cubes.XCube333MBFUnlimited,
    Cn: "无限多盲",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 3,
    SeqNumber: 999,
    SpareSeqNumber: 999,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube222BF,
    Cn: "二盲",
    RouteType: CubesRouteType.RouteType5roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 2,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea1e",
  },
  {
    Cubes: Cubes.XCube666BF,
    Cn: "六盲",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 6,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: true,
    Icon: "ea24",
  },
  {
    Cubes: Cubes.XCube777BF,
    Cn: "七盲",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 7,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: true,
    Icon: "ea25",
  },
  {
    Cubes: Cubes.XCubePyBF,
    Cn: "塔盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea4c",
  },
  {
    Cubes: Cubes.XCubeSkBF,
    Cn: "斜盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeMinxBf,
    Cn: "五魔盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeClockBf,
    Cn: "表盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeSQ1Bf,
    Cn: "SQ1盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeBF,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubePyFm,
    Cn: "塔少步",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeFm,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea33",
  },
  {
    Cubes: Cubes.XCubeSkFm,
    Cn: "斜少步",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeFm,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea36",
  },
  {
    Cubes: Cubes.XCubeClockFm,
    Cn: "表少步",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeFm,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea54",
  },
  {
    Cubes: Cubes.XCube222Fm,
    Cn: "二少步",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeFm,

    DrawSize: 2,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea37",
  },
  {
    Cubes: Cubes.XCube333Mini,
    Cn: "三阶迷你",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea34",
  },


  {
    Cubes: Cubes.XCube333BfOH,
    Cn: "三盲单",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube444BfOH,
    Cn: "四盲单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 4,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube555BfOH,
    Cn: "五盲单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 5,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube333MiniOH,
    Cn: "三阶迷你单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea3d",
  },
  {
    Cubes: Cubes.XCube222OH,
    Cn: "二单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 2,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea35",
  },
  {
    Cubes: Cubes.XCube444OH,
    Cn: "四单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 4,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea3a",
  },
  {
    Cubes: Cubes.XCube555OH,
    Cn: "五单",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea39",
  },
  {
    Cubes: Cubes.XCube666OH,
    Cn: "六单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 6,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: true,
    Icon: "ea3c",
  },
  {
    Cubes: Cubes.XCube777OH,
    Cn: "七单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 7,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: true,
    Icon: "ea3b",
  },
  {
    Cubes: Cubes.XCubeSkOH,
    Cn: "斜单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea3e",
  },
  {
    Cubes: Cubes.XCubePyOH,
    Cn: "塔单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea3f",
  },
  {
    Cubes: Cubes.XCubeClockOH,
    Cn: "表单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea41",
  },
  {
    Cubes: Cubes.XCubeSq1OH,
    Cn: "SQ1单",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea42",
  },
  {
    Cubes: Cubes.XCubeMinxOH,
    Cn: "五魔单",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeOH,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea40",
  },
  {
    Cubes: Cubes.XCube333Mirror,
    Cn: "镜面魔方",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea43",
  },
  {
    Cubes: Cubes.XCube333Mirroring,
    Cn: "镜向三阶",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea44",
  },
  {
    Cubes: Cubes.XCube333Multiple5,
    Cn: "三阶五连",
    RouteType: CubesRouteType.RouteType5roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 25,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea4b",
  },
  {
    Cubes: Cubes.XCube333Multiple10,
    Cn: "三阶十连",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 10,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea45",
  },
  {
    Cubes: Cubes.XCube333Multiple15,
    Cn: "三阶十五连",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 15,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea47",
  },
  {
    Cubes: Cubes.XCube333Multiple20,
    Cn: "三阶二十连",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 25,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea48",
  },

  {
    Cubes: Cubes.XCube333OHMultiple5,
    Cn: "三单五连",
    RouteType: CubesRouteType.RouteType5roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube333OHMultiple10,
    Cn: "三单十连",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 10,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube333OHMultiple15,
    Cn: "三单十五连",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 15,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube333OHMultiple20,
    Cn: "三单二十连",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 3,
    SeqNumber: 20,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "",
  },


  {

    Cubes: Cubes.XCube2345Relay,
    Cn: "二三四五连拧",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 4,
    SpareSeqNumber: 4,
    DrawSeq: true,
    Icon: "ea21",
  },
  {

    Cubes: Cubes.XCube2345OHRelay,
    Cn: "二三四五连单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 4,
    SpareSeqNumber: 4,
    DrawSeq: true,
    Icon: "ea55",
  },
  {
    Cubes: Cubes.XCube27Relay,
    Cn: "正阶连拧",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 6,
    SpareSeqNumber: 6,
    DrawSeq: true,
    Icon: "ea20",
  },
  {
    Cubes: Cubes.XCube27OHRelay,
    Cn: "正阶连单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 6,
    SpareSeqNumber: 6,
    DrawSeq: true,
    Icon: "",
  },
  {
    //
    Cubes: Cubes.XCube345RelayBF,
    Cn: "盲连拧",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 3,
    DrawSeq: true,
    Icon: "ea49",
  },
  {
    //
    Cubes: Cubes.XCube345OHRelayBF,
    Cn: "盲连拧单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 3,
    DrawSeq: true,
    Icon: "ea53",
  },
  {

    Cubes: Cubes.XCubeAlienRelay,
    Cn: "异形连拧",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 5, //  塔 斜 表 五 SQ1
    SpareSeqNumber: 5,
    DrawSeq: true,
    Icon: "ea4a",
  },
  {

    Cubes: Cubes.XCubeAlienOHRelay,
    Cn: "异形连单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 5, //  塔 斜 表 五 SQ1
    SpareSeqNumber: 5,
    DrawSeq: true,
    Icon: "",
  },
  {
    // 除 最少步 / 盲 外的所有项目
    // 按 234567 单 塔斜表五SQ1  排序
    Cubes: Cubes.XCube27AlienRelayAll,
    Cn: "全项目连拧",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 12,
    SpareSeqNumber: 12,
    DrawSeq: true,
    Icon: "",
  },
  {
    // 除 最少步 / 盲 外的所有项目
    // 按 234567 单 塔斜表五SQ1  排序
    Cubes: Cubes.XCube27AlienOHRelayAll,
    Cn: "全项目连单",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.XCubeRelay,

    DrawSize: 0,
    SeqNumber: 12,
    SpareSeqNumber: 12,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube333Ghost,
    Cn: "鬼魔",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea28",
  },
  {
    Cubes: Cubes.XCube333ZongZi,
    Cn: "粽子",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea2e",
  },
  {
    Cubes: Cubes.XCubeHotWheels,
    Cn: "风火轮",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeFisher,
    Cn: "移棱",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeGear,
    Cn: "齿轮",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.Xcube333Clone,
    Cn: "三阶克隆",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,
    // todo  这个需要屏蔽公式
    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 0,
    DrawSeq: false,
    Icon: "ea4d",
  },
  {
    Cubes: Cubes.XCube444Minx,
    Cn: "四阶五魔",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube555Minx,
    Cn: "五阶五魔",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeMapleLeaf,
    Cn: "枫叶",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube222Minx,
    Cn: "二阶五魔",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea2a",
  },
  {
    Cubes: Cubes.XCube444Py,
    Cn: "四阶塔",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 0,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube888,
    Cn: "八阶",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 8,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube999,
    Cn: "九阶",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 8,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube10L,
    Cn: "十阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 10,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube11L,
    Cn: "十一阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 11,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube12L,
    Cn: "十二阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 12,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube13L,
    Cn: "十三阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 13,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube14L,
    Cn: "十四阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 14,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube15L,
    Cn: "十五阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 15,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube16L,
    Cn: "十六阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 16,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube17L,
    Cn: "十七阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 17,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube21L,
    Cn: "二十一阶",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.SuperHigh,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeHelicopter,
    Cn: "直升机",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCubeRedi,
    Cn: "Redi",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube133,
    Cn: "一三三",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube223,
    Cn: "二二三",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube233,
    Cn: "二三三",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube334,
    Cn: "三三四",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube335,
    Cn: "三三五",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube336,
    Cn: "三三六",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.XCube337,
    Cn: "三三七",
    RouteType: CubesRouteType.RouteType3roundsAvg,
    IsWCA: false,
    Segmentation: SegmentationType.XCube,

    DrawSize: 21,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },

  // 非魔方

  {
    Cubes: Cubes.NotCubeDigit,
    Cn: "记字",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.Digit,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubeDigitOnlyNumber,
    Cn: "记数字",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.Digit,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubeDigitOnlyUppercase,
    Cn: "记字母",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.Digit,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubeDigitNumberAndUppercase,
    Cn: "记数字字母",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.Digit,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubePuke,
    Cn: "扑克记忆",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.Digit,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },

  {
    Cubes: Cubes.NotCubeSuDoKuVeryEasy,
    Cn: "数独入门",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "ea50",
  },
  {
    Cubes: Cubes.NotCubeSuDoKuEasy,
    Cn: "数独初级",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "ea51",
  },
  {
    Cubes: Cubes.NotCubeSuDoKuModerate,
    Cn: "数独中级",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubeSuDoKuAdvanced,
    Cn: "数独高级",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubeSuDoKuHard,
    Cn: "数独困难",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCubeSuDoKuMaster,
    Cn: "数独大师",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },


  // 华容道
  {
    Cubes: Cubes.NotCube8Puzzle,
    Cn: "3阶数字华容道",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "ea4f",
  },
  {
    Cubes: Cubes.NotCube15Puzzle,
    Cn: "4阶数字华容道",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCube24Puzzle,
    Cn: "5阶数字华容道",
    RouteType: CubesRouteType.RouteType5RoundsAvgHT,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCube35Puzzle,
    Cn: "6阶数字华容道",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCube48Puzzle,
    Cn: "7阶数字华容道",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCube63Puzzle,
    Cn: "8阶数字华容道",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.NotCube80Puzzle,
    Cn: "9阶数字华容道",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },


  // 其他
  {
    Cubes: Cubes.JuBaoHaoHao,
    Cn: "菊爆浩浩",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 1,
    SpareSeqNumber: 1,
    DrawSeq: false,
    Icon: "",
  },
  {
    Cubes: Cubes.OtherCola,
    Cn: "速可乐",
    RouteType: CubesRouteType.RouteType1rounds,
    IsWCA: false,
    Segmentation: SegmentationType.NotCube,

    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: false,
    Icon: "",
  },


  // 盲拧群赛系列
  {
    Cubes: Cubes.BFGroup333BF,
    Cn: "盲拧系列三盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.Other,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup333BF1,
    Cn: "盲拧系列三盲1",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup333BF2,
    Cn: "盲拧系列三盲2",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup333BF3,
    Cn: "盲拧系列三盲3",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup333BF4,
    Cn: "盲拧系列三盲4",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup333BF5,
    Cn: "盲拧系列三盲5",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup333BF6,
    Cn: "盲拧系列三盲6",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  }, {
    Cubes: Cubes.BFGroup333BF7,
    Cn: "盲拧系列三盲7",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea0b",
  },
  {
    Cubes: Cubes.BFGroup444BF,
    Cn: "盲拧系列四盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.Other,

    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea12",
  },
  {
    Cubes: Cubes.BFGroup444BF1,
    Cn: "盲拧系列四盲1",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea12",
  },
  {
    Cubes: Cubes.BFGroup444BF2,
    Cn: "盲拧系列四盲2",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea12",
  },
  {
    Cubes: Cubes.BFGroup444BF3,
    Cn: "盲拧系列四盲3",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea12",
  },
  {
    Cubes: Cubes.BFGroup444BF4,
    Cn: "盲拧系列四盲4",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea12",
  },

  {
    Cubes: Cubes.BFGroup555BF,
    Cn: "盲拧系列五盲",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.Other,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea14",
  },
  {
    Cubes: Cubes.BFGroup555BF1,
    Cn: "盲拧系列五盲1",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea14",
  },
  {
    Cubes: Cubes.BFGroup555BF2,
    Cn: "盲拧系列五盲2",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea14",
  },
  {
    Cubes: Cubes.BFGroup555BF3,
    Cn: "盲拧系列五盲3",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea14",
  },
  {
    Cubes: Cubes.BFGroup555BF4,
    Cn: "盲拧系列五盲4",
    RouteType: CubesRouteType.RouteType3roundsBest,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: "ea14",
  },

  {
    Cubes: Cubes.BFGroup333MBF,
    Cn: "盲拧系列多盲",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.Other,

    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0e",
  },
  {
    Cubes: Cubes.BFGroup333MBF1,
    Cn: "盲拧系列多盲1",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0e",
  },
  {
    Cubes: Cubes.BFGroup333MBF2,
    Cn: "盲拧系列多盲2",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0e",
  },
  {
    Cubes: Cubes.BFGroup333MBF3,
    Cn: "盲拧系列多盲3",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0e",
  },
  {
    Cubes: Cubes.BFGroup333MBF4,
    Cn: "盲拧系列多盲4",
    RouteType: CubesRouteType.RouteTypeRepeatedly,
    IsWCA: false,
    Segmentation: SegmentationType.BFGroup,

    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: "ea0e",
  },
]
// End CubesAttributesList

const cubesAttributesMapFn = (): Map<Cubes, CubesAttributes> => {
  const out = new Map<Cubes, CubesAttributes>()
  CubesAttributesList.forEach((k) => {
    out.set(k.Cubes, k)
  })
  return out
}

export const CubesAttributesMap: Map<string, CubesAttributes> = cubesAttributesMapFn()
