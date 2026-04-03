/**
 * 从 modood/Administrative-divisions-of-China 下载 pcas-code.json，
 * 生成地级市/区县 → 地级市标准名的别名表（含拼音），供点亮城市地图匹配。
 *
 * 用法: node scripts/build-lit-cities-aliases.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { get } from 'https';
import { pinyin } from 'pinyin-pro';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../src/pages/WCA/PlayerComponents/litCities/data');

const PCAS_URL =
  'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pcas-code.json';

const MUNICIPALITIES = new Set(['北京市', '上海市', '天津市', '重庆市']);

/** 去掉常见后缀，用于地级市短名与拼音（不含区县细粒度，避免「城区」等歧义） */
function stripPrefectureSuffix(name) {
  return name
    .replace(/(特别行政区|自治州|地区|盟|市辖区|省|市|縣|县|區|区)$/g, '')
    .trim();
}

function toPinyinTokens(name) {
  const arr = pinyin(name, { toneType: 'none', type: 'array' });
  const joined = arr.join('').replace(/\s+/g, '');
  const lower = joined.toLowerCase();
  const cap = lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : '';
  return { lower, cap };
}

/** 为地级市名生成：全称、短名、拼音 */
function collectPrefectureAliases(standardName) {
  const aliases = new Set([standardName]);
  const shortName = stripPrefectureSuffix(standardName);
  if (shortName && shortName !== standardName) {
    aliases.add(shortName);
  }
  const base = shortName || standardName;
  if (base) {
    const { lower, cap } = toPinyinTokens(base);
    if (lower) {
      aliases.add(lower);
      if (cap) aliases.add(cap);
    }
  }
  return [...aliases].filter(Boolean);
}

/** 区县：全称 + 整段拼音（如 蓬江区 / pengjiangqu） */
function collectDistrictAliases(districtName) {
  const aliases = new Set([districtName]);
  const { lower, cap } = toPinyinTokens(districtName);
  if (lower) {
    aliases.add(lower);
    if (cap) aliases.add(cap);
  }
  return [...aliases].filter(Boolean);
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    get(url, res => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function buildPairs(pcas) {
  /** @type {{ alias: string, target: string }[]} */
  const pairs = [];
  /** alias -> target，冲突时保留先写入（更长前缀优先在运行时处理） */
  const firstTarget = new Map();

  function addPair(alias, target) {
    if (!alias || !target) return;
    const a = String(alias).trim();
    const t = String(target).trim();
    if (!a || !t) return;
    if (firstTarget.has(a) && firstTarget.get(a) !== t) {
      return;
    }
    if (!firstTarget.has(a)) {
      firstTarget.set(a, t);
      pairs.push({ alias: a, target: t });
    }
  }

  for (const prov of pcas) {
    if (!prov.children?.length) continue;

    if (MUNICIPALITIES.has(prov.name)) {
      const target = prov.name;
      for (const a of collectPrefectureAliases(target)) {
        addPair(a, target);
      }
      for (const sub of prov.children) {
        for (const dist of sub.children || []) {
          for (const a of collectDistrictAliases(dist.name)) {
            addPair(a, target);
          }
        }
      }
      continue;
    }

    for (const city of prov.children) {
      const target = city.name;
      for (const a of collectPrefectureAliases(target)) {
        addPair(a, target);
      }
      for (const dist of city.children || []) {
        for (const a of collectDistrictAliases(dist.name)) {
          addPair(a, target);
        }
      }
    }
  }

  pairs.sort((x, y) => y.alias.length - x.alias.length);
  return pairs;
}

const TAIWAN_COUNTIES = [
  '南投縣',
  '台中市',
  '台北市',
  '台南市',
  '台東縣',
  '嘉義市',
  '嘉義縣',
  '基隆市',
  '宜蘭縣',
  '屏東縣',
  '彰化縣',
  '新北市',
  '新竹市',
  '新竹縣',
  '桃園縣',
  '澎湖縣',
  '花蓮縣',
  '苗栗縣',
  '連江縣',
  '金門縣',
  '雲林縣',
  '高雄市',
];

/**
 * WCA 等城市字段常用英文地名（与汉语拼音不同：Taichung≠taizhong、Taipei≠taibei）。
 * 较长别名优先，避免「Taipei」误匹配「New Taipei City」中的子串（由 sort 保证）。
 */
const TAIWAN_WCA_ENGLISH_ALIASES = [
  ['New Taipei City', '新北市'],
  ['New Taipei', '新北市'],
  ['new taipei city', '新北市'],
  ['new taipei', '新北市'],
  ['Taichung City', '台中市'],
  ['Taichung', '台中市'],
  ['taichung city', '台中市'],
  ['taichung', '台中市'],
  ['Taipei City', '台北市'],
  ['Taipei', '台北市'],
  ['taipei city', '台北市'],
  ['taipei', '台北市'],
  ['Tainan City', '台南市'],
  ['Tainan', '台南市'],
  ['tainan city', '台南市'],
  ['tainan', '台南市'],
  ['Kaohsiung City', '高雄市'],
  ['Kaohsiung', '高雄市'],
  ['kaohsiung city', '高雄市'],
  ['kaohsiung', '高雄市'],
  ['Taoyuan City', '桃園縣'],
  ['Taoyuan', '桃園縣'],
  ['taoyuan city', '桃園縣'],
  ['taoyuan', '桃園縣'],
  ['Keelung City', '基隆市'],
  ['Keelung', '基隆市'],
  ['keelung city', '基隆市'],
  ['keelung', '基隆市'],
  ['Hsinchu City', '新竹市'],
  ['Hsinchu', '新竹市'],
  ['hsinchu city', '新竹市'],
  ['hsinchu', '新竹市'],
  ['Chiayi City', '嘉義市'],
  ['Chiayi', '嘉義市'],
  ['chiayi city', '嘉義市'],
  ['chiayi', '嘉義市'],
  ['Hualien City', '花蓮縣'],
  ['Hualien', '花蓮縣'],
  ['hualien city', '花蓮縣'],
  ['hualien', '花蓮縣'],
  ['Taitung City', '台東縣'],
  ['Taitung', '台東縣'],
  ['taitung city', '台東縣'],
  ['taitung', '台東縣'],
  ['Yilan City', '宜蘭縣'],
  ['Yilan', '宜蘭縣'],
  ['yilan city', '宜蘭縣'],
  ['yilan', '宜蘭縣'],
  ['Miaoli City', '苗栗縣'],
  ['Miaoli', '苗栗縣'],
  ['miaoli city', '苗栗縣'],
  ['miaoli', '苗栗縣'],
  ['Changhua City', '彰化縣'],
  ['Changhua', '彰化縣'],
  ['changhua city', '彰化縣'],
  ['changhua', '彰化縣'],
  ['Nantou County', '南投縣'],
  ['Nantou', '南投縣'],
  ['nantou county', '南投縣'],
  ['nantou', '南投縣'],
  ['Pingtung City', '屏東縣'],
  ['Pingtung', '屏東縣'],
  ['pingtung city', '屏東縣'],
  ['pingtung', '屏東縣'],
  ['Yunlin County', '雲林縣'],
  ['Yunlin', '雲林縣'],
  ['yunlin county', '雲林縣'],
  ['yunlin', '雲林縣'],
  ['Penghu County', '澎湖縣'],
  ['Penghu', '澎湖縣'],
  ['penghu county', '澎湖縣'],
  ['penghu', '澎湖縣'],
  ['Kinmen County', '金門縣'],
  ['Kinmen', '金門縣'],
  ['kinmen county', '金門縣'],
  ['kinmen', '金門縣'],
  ['Lienchiang County', '連江縣'],
  ['Lienchiang', '連江縣'],
  ['Matsu', '連江縣'],
  ['lienchiang county', '連江縣'],
  ['lienchiang', '連江縣'],
  ['matsu', '連江縣'],
];

function buildTaiwanPairs() {
  const pairs = [];
  const firstTarget = new Map();

  function addPair(alias, target) {
    if (!alias || !target) return;
    const a = String(alias).trim();
    const t = String(target).trim();
    if (!a || !t) return;
    if (firstTarget.has(a) && firstTarget.get(a) !== t) {
      return;
    }
    if (!firstTarget.has(a)) {
      firstTarget.set(a, t);
      pairs.push({ alias: a, target: t });
    }
  }

  for (const name of TAIWAN_COUNTIES) {
    for (const a of collectPrefectureAliases(name)) {
      addPair(a, name);
    }
    const variants = new Set([
      name,
      name.replace(/^台/, '臺'),
      name.replace(/^臺/, '台'),
      stripPrefectureSuffix(name),
      stripPrefectureSuffix(name).replace(/^台/, '臺'),
      stripPrefectureSuffix(name).replace(/^臺/, '台'),
    ]);
    for (const v of variants) {
      if (v) addPair(v, name);
    }
  }

  for (const [alias, target] of TAIWAN_WCA_ENGLISH_ALIASES) {
    addPair(alias, target);
  }

  pairs.sort((x, y) => y.alias.length - x.alias.length);
  return pairs;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const raw = await fetchText(PCAS_URL);
  const pcas = JSON.parse(raw);
  const chinaPairs = buildPairs(pcas);
  writeFileSync(
    join(OUT_DIR, 'chinaPrefectureAliasTable.json'),
    JSON.stringify({
      version: 1,
      source: 'modood/Administrative-divisions-of-China dist/pcas-code.json',
      generatedAt: new Date().toISOString(),
      pairs: chinaPairs,
    }),
    'utf8',
  );
  console.log('Wrote chinaPrefectureAliasTable.json, pairs:', chinaPairs.length);

  const twPairs = buildTaiwanPairs();
  writeFileSync(
    join(OUT_DIR, 'taiwanCountyAliasTable.json'),
    JSON.stringify({
      version: 1,
      source: 'g0v twCounty2010 county list + pinyin-pro',
      generatedAt: new Date().toISOString(),
      pairs: twPairs,
    }),
    'utf8',
  );
  console.log('Wrote taiwanCountyAliasTable.json, pairs:', twPairs.length);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
