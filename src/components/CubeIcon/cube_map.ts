// Cubes Map Start
export enum Cubes {
  // 特殊
  JuBaoHaoHao = 'jhh',
  OtherCola = 'o_cola',

  // wca
  Cube222 = '222',
  Cube333 = '333',
  Cube444 = '444',
  Cube555 = '555',
  Cube666 = '666',
  Cube777 = '777',
  CubeSk = 'skewb',
  CubePy = 'pyram',
  CubeSq1 = 'sq1',
  CubeMinx = 'minx',
  CubeMegaminx = 'megaminx',
  CubeClock = 'clock',
  Cube333OH = '333oh',
  Cube333FM = '333fm',
  Cube333BF = '333bf',
  Cube444BF = '444bf',
  Cube555BF = '555bf',
  Cube333MBF = '333mbf',
  Cube333Ft = '333ft',
  CubeFTO = 'FTO',

  XCube333MBFUnlimited = '333mbf_unlimited',

  XCube27Relay = '2_7relay',
  XCubeAlienRelay = 'alien_relay', // 塔斜表五Q
  XCube27AlienRelayAll = '27alien_relay',
}

// Cubes Map End
export type CubesAttributes = {
  Cubes: Cubes; // 项目
  Cn: string; // 中文名
  DrawSeq: boolean; // 是否展示公式
  DrawSize: number; // 绘制打乱列表图像阶数，目前只有正阶用到了
  SeqNumber: number; // 打乱数
  SpareSeqNumber: number; // 备打数
  Icon: string;
};

// Start CubesAttributesList
export const CubesAttributesList: CubesAttributes[] = [
  // WCA正阶
  {
    Cubes: Cubes.Cube333,
    Cn: '三阶',
    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea0a',
  },
  {
    Cubes: Cubes.Cube222,
    Cn: '二阶',
    DrawSize: 2,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea09',
  },
  {
    Cubes: Cubes.Cube444,
    Cn: '四阶',
    DrawSize: 4,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea11',
  },
  {
    Cubes: Cubes.Cube555,
    Cn: '五阶',
    DrawSize: 5,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea13',
  },
  {
    Cubes: Cubes.Cube666,
    Cn: '六阶',
    DrawSize: 6,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea15',
  },
  {
    Cubes: Cubes.Cube777,
    Cn: '七阶',
    DrawSize: 7,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea16',
  },
  {
    Cubes: Cubes.CubeSk,
    Cn: '斜转',
    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea1c',
  },
  {
    Cubes: Cubes.CubePy,
    Cn: '金字塔',
    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea1b',
  },
  {
    Cubes: Cubes.CubeSq1,
    Cn: 'SQ1',
    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea1d',
  },
  {
    Cubes: Cubes.CubeMinx,
    Cn: '五魔方',
    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea19',
  },
  {
    Cubes: Cubes.CubeMegaminx,
    Cn: '五魔',
    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea19',
  },
  {
    Cubes: Cubes.CubeClock,
    Cn: '魔表',
    DrawSize: 0,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea17',
  },
  {
    Cubes: Cubes.Cube333OH,
    Cn: '单手',
    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea10',
  },
  {
    Cubes: Cubes.Cube333FM,
    Cn: '最少步',
    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: 'ea0c',
  },
  {
    Cubes: Cubes.Cube333BF,
    Cn: '三盲',
    DrawSize: 3,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea0b',
  },
  {
    Cubes: Cubes.Cube444BF,
    Cn: '四盲',
    DrawSize: 4,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea12',
  },
  {
    Cubes: Cubes.Cube555BF,
    Cn: '五盲',
    DrawSize: 5,
    SeqNumber: 3,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea14',
  },
  {
    Cubes: Cubes.Cube333MBF,
    Cn: '多盲',
    DrawSize: 3,
    SeqNumber: 0, // 0 代表没有上限
    SpareSeqNumber: 0,
    DrawSeq: true,
    Icon: 'ea0e',
  },

  // -
  {
    Cubes: Cubes.Cube333Ft,
    Cn: '脚拧',
    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea0d',
  },
  {
    Cubes: Cubes.CubeFTO,
    Cn: 'FTO',
    DrawSize: 3,
    SeqNumber: 5,
    SpareSeqNumber: 2,
    DrawSeq: true,
    Icon: 'ea28',
  },
  {
    Cubes: Cubes.XCube333MBFUnlimited,
    Cn: '无限多盲',
    DrawSize: 3,
    SeqNumber: 999,
    SpareSeqNumber: 999,
    DrawSeq: true,
    Icon: '',
  },
  {
    Cubes: Cubes.XCube27Relay,
    Cn: '正阶连拧',
    DrawSize: 0,
    SeqNumber: 6,
    SpareSeqNumber: 6,
    DrawSeq: true,
    Icon: 'ea20',
  },
  {
    Cubes: Cubes.XCubeAlienRelay,
    Cn: '异形连拧',
    DrawSize: 0,
    SeqNumber: 5, //  塔 斜 表 五 SQ1
    SpareSeqNumber: 5,
    DrawSeq: true,
    Icon: 'ea4a',
  },
  {
    // 除 最少步 / 盲 外的所有项目
    // 按 234567 单 塔斜表五SQ1  排序
    Cubes: Cubes.XCube27AlienRelayAll,
    Cn: '全项目连拧',
    DrawSize: 0,
    SeqNumber: 12,
    SpareSeqNumber: 12,
    DrawSeq: true,
    Icon: '',
  },
];
// End CubesAttributesList

const cubesAttributesMapFn = (): Map<Cubes, CubesAttributes> => {
  const out = new Map<Cubes, CubesAttributes>();
  CubesAttributesList.forEach((k) => {
    out.set(k.Cubes, k);
  });
  return out;
};

export const CubesAttributesMap: Map<string, CubesAttributes> = cubesAttributesMapFn();
