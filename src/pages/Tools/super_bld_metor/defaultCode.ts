export const BaseCodeMap = new Map<string, string>([
  ['黄顶绿前', 'z2'],
  ['黄顶橙前', 'z2 y'],
  ['黄顶蓝前', 'z2 y2'],
  ['黄顶红前', "z2 y'"],

  ['白顶红前', 'y'],
  ['白顶蓝前', 'y2'],
  ['白顶橙前', "y'"],
  ['白顶绿前', ''],

  ['橙顶绿前', 'z'],
  ['橙顶白前', 'z y'],
  ['橙顶蓝前', 'z y2'],
  ['橙顶黄前', "z y'"],

  ['红顶绿前', "z'"],
  ['红顶黄前', "z' y"],
  ['红顶蓝前', "z' y2"],
  ['红顶白前', "z' y'"],

  ['绿顶黄前', 'x'],
  ['绿顶红前', 'x y'],
  ['绿顶白前', 'x y2'],
  ['绿顶橙前', "x y'"],

  ['蓝顶白前', "x'"],
  ['蓝顶红前', "x' y"],
  ['蓝顶黄前', "x' y2"],
  ['蓝顶橙前', "x' y'"],
]);


export const EdgeIndex = [
  "UF", "FU", "UL", "LU", "UB", "BU", "UR", "RU",   // 顶层
  "DF", "FD", "DL", "LD", "DB", "BD", "DR", "RD",   // 底层
  "FR", "RF", "FL", "LF", "BL", "LB", "BR", "RB",   // 中层
]

export const CornerIndex = [
  "UBL", "UBR", "UFL", "UFR", "LUB", "LUF", "FUL", "FUR",  "RUF", "RUB", "BUR", "BUL", // 顶层
  "LDB", "LDF",  "FDL", "FDR", "RDF", "RDB","BDR", "BDL", "DFL", "DFR", "DBL", "DBR" // 底层
]

export const XCenterIndex = [
  "Ubl", "Ubr", "Ufl", "Ufr", // 顶
  "Dfl", "Dfr", "Dbl", "Dbr", // 底
  "Lub", "Luf", "Ldb", "Ldf", // 左
  "Ful", "Fur", "Fdl", "Fdr", // 前
  "Ruf", "Rub", "Rdf", "Rdb", // 右
  "Bur", "Bul", "Bdr", "Bdl", // 后
]
export const ECenterIndex =  [
  "Uf", "Fu", "Ul", "Lu", "Ub", "Bu", "Ur", "Ru",   // 顶层
  "Df", "Fd", "Dl", "Ld", "Db", "Bd", "Dr", "Rd",   // 底层
  "Fr", "Rf", "Fl", "Lf", "Bl", "Lb", "Br", "Rb",   // 中层
]

// 有一套反过来的编码，本套编码为常见标准编码
export const WingsIndex = [
  "UFr", "FUl", "ULf", "LUb", "UBl", "BUr", "URb", "RUf",   // 顶层
  "DFl", "FDr", "DLb", "LDf", "DBr", "BDl", "DRf", "RDb",   // 底层
  "FRu", "RFd", "FLd", "LFu", "BLu", "LBd", "BRd", "RBu",   // 中层
]





// 这里是全部的编码
export const ChiChuDefaultCode = new Map<string, string>([
  ["Chichu", "DEE G DEGGCC GGCAAJ A AAJEDD C EDCTXX TTXQLM Q LLMBBB L BBLQSS QQSNJY N JJYKHH I KHIZRR ZZRZPS Z PPSHFF F HFFWYY WWYTNP T NNPWII X WIXOKKOOOKOMR O MMR"],
  ["Speffz", "AAA B AABBDD BBDDCC D CCCEEE F EEFFHH FFHHGG H GGGIII J IIJJLL JJLLKK L KKKMMM N MMNNPP NNPPOO P OOOQQQ R QQRRTT RRTTSS T SSSUUU V UUVVXXUVVXXWW X WWW"],
])
