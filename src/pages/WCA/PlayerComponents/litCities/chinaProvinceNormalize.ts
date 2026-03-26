/** WCA geo 省份字段（英文等）→ DataV 中国地图 feature.properties.name + adcode */

export interface ChinaProvinceMeta {
  mapNameZh: string;
  adcode: number;
}

const EN_PROVINCE_TO_META: Record<string, ChinaProvinceMeta> = {
  Beijing: { mapNameZh: '北京市', adcode: 110000 },
  Tianjin: { mapNameZh: '天津市', adcode: 120000 },
  Hebei: { mapNameZh: '河北省', adcode: 130000 },
  Shanxi: { mapNameZh: '山西省', adcode: 140000 },
  'Inner Mongolia': { mapNameZh: '内蒙古自治区', adcode: 150000 },
  Liaoning: { mapNameZh: '辽宁省', adcode: 210000 },
  Jilin: { mapNameZh: '吉林省', adcode: 220000 },
  Heilongjiang: { mapNameZh: '黑龙江省', adcode: 230000 },
  Shanghai: { mapNameZh: '上海市', adcode: 310000 },
  Jiangsu: { mapNameZh: '江苏省', adcode: 320000 },
  Zhejiang: { mapNameZh: '浙江省', adcode: 330000 },
  Anhui: { mapNameZh: '安徽省', adcode: 340000 },
  Fujian: { mapNameZh: '福建省', adcode: 350000 },
  Jiangxi: { mapNameZh: '江西省', adcode: 360000 },
  Shandong: { mapNameZh: '山东省', adcode: 370000 },
  Henan: { mapNameZh: '河南省', adcode: 410000 },
  Hubei: { mapNameZh: '湖北省', adcode: 420000 },
  Hunan: { mapNameZh: '湖南省', adcode: 430000 },
  Guangdong: { mapNameZh: '广东省', adcode: 440000 },
  Guangxi: { mapNameZh: '广西壮族自治区', adcode: 450000 },
  Hainan: { mapNameZh: '海南省', adcode: 460000 },
  Chongqing: { mapNameZh: '重庆市', adcode: 500000 },
  Sichuan: { mapNameZh: '四川省', adcode: 510000 },
  Guizhou: { mapNameZh: '贵州省', adcode: 520000 },
  Yunnan: { mapNameZh: '云南省', adcode: 530000 },
  Tibet: { mapNameZh: '西藏自治区', adcode: 540000 },
  Shaanxi: { mapNameZh: '陕西省', adcode: 610000 },
  Gansu: { mapNameZh: '甘肃省', adcode: 620000 },
  Qinghai: { mapNameZh: '青海省', adcode: 630000 },
  Ningxia: { mapNameZh: '宁夏回族自治区', adcode: 640000 },
  Xinjiang: { mapNameZh: '新疆维吾尔自治区', adcode: 650000 },
  Taiwan: { mapNameZh: '台湾省', adcode: 710000 },
  'Hong Kong': { mapNameZh: '香港特别行政区', adcode: 810000 },
  Macau: { mapNameZh: '澳门特别行政区', adcode: 820000 },
};

/** 常见别名（小写键） */
const ALIAS_TO_KEY: Record<string, keyof typeof EN_PROVINCE_TO_META> = {
  'inner mongolia': 'Inner Mongolia',
  'nei mongol': 'Inner Mongolia',
  'guangxi zhuang': 'Guangxi',
  'ningxia hui': 'Ningxia',
  'xinjiang uyghur': 'Xinjiang',
  'xinjiang uygur': 'Xinjiang',
  tibet: 'Tibet',
  'xi zang': 'Tibet',
};

/** province 或 city 字段被写成城市名时的回退（WCA 数据里偶发） */
const CITY_OR_PROVINCE_FALLBACK: Record<string, ChinaProvinceMeta> = {
  Weihai: { mapNameZh: '山东省', adcode: 370000 },
  Xiamen: { mapNameZh: '福建省', adcode: 350000 },
  Shenzhen: { mapNameZh: '广东省', adcode: 440000 },
  Dalian: { mapNameZh: '辽宁省', adcode: 210000 },
  Qingdao: { mapNameZh: '山东省', adcode: 370000 },
  Ningbo: { mapNameZh: '浙江省', adcode: 330000 },
  Suzhou: { mapNameZh: '江苏省', adcode: 320000 },
};

function normKey(s: string): string {
  return s.trim().toLowerCase();
}

export function metaByEnglishProvinceKey(key: string): ChinaProvinceMeta | undefined {
  const k = key.trim();
  const direct = EN_PROVINCE_TO_META[k as keyof typeof EN_PROVINCE_TO_META];
  if (direct) return direct;
  const alias = ALIAS_TO_KEY[normKey(k)];
  if (alias) return EN_PROVINCE_TO_META[alias];
  return undefined;
}

export function resolveChinaProvinceMeta(province: string, city: string): ChinaProvinceMeta | null {
  const p = province.trim();
  const c = city.trim();
  if (p) {
    const m = metaByEnglishProvinceKey(p);
    if (m) return m;
    const fb = CITY_OR_PROVINCE_FALLBACK[p];
    if (fb) return fb;
  }
  if (c) {
    const fb = CITY_OR_PROVINCE_FALLBACK[c];
    if (fb) return fb;
    const m = metaByEnglishProvinceKey(c);
    if (m) return m;
  }
  return null;
}

/** 英文展示用（列表/非中文界面） */
export const MAP_NAME_ZH_TO_EN: Record<string, string> = {
  北京市: 'Beijing',
  天津市: 'Tianjin',
  河北省: 'Hebei',
  山西省: 'Shanxi',
  内蒙古自治区: 'Inner Mongolia',
  辽宁省: 'Liaoning',
  吉林省: 'Jilin',
  黑龙江省: 'Heilongjiang',
  上海市: 'Shanghai',
  江苏省: 'Jiangsu',
  浙江省: 'Zhejiang',
  安徽省: 'Anhui',
  福建省: 'Fujian',
  江西省: 'Jiangxi',
  山东省: 'Shandong',
  河南省: 'Henan',
  湖北省: 'Hubei',
  湖南省: 'Hunan',
  广东省: 'Guangdong',
  广西壮族自治区: 'Guangxi',
  海南省: 'Hainan',
  重庆市: 'Chongqing',
  四川省: 'Sichuan',
  贵州省: 'Guizhou',
  云南省: 'Yunnan',
  西藏自治区: 'Tibet',
  陕西省: 'Shaanxi',
  甘肃省: 'Gansu',
  青海省: 'Qinghai',
  宁夏回族自治区: 'Ningxia',
  新疆维吾尔自治区: 'Xinjiang',
  台湾省: 'Taiwan',
  香港特别行政区: 'Hong Kong',
  澳门特别行政区: 'Macau',
};

export function displayProvinceName(mapNameZh: string, localeZh: boolean): string {
  if (localeZh) return mapNameZh;
  return MAP_NAME_ZH_TO_EN[mapNameZh] || mapNameZh;
}
