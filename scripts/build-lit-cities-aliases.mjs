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
