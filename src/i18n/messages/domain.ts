import { readStoredLocale, type Locale } from '../locales';
import { formatMessage } from '../formatMessage';

// Keep this catalog independent of components and the root catalog.
// Column order: zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es.
const messages = {
  'event.cube': ['{size}阶', '{size}×{size}×{size} Cube', '{size}×{size}×{size}キューブ', '{size}階', '{size}×{size}×{size} 큐브', 'Cube {size}×{size}×{size}', 'Cubo {size}×{size}×{size}'],
  'event.222': ['二阶', '2×2×2 Cube', '2×2×2キューブ', '二階', '2×2×2 큐브', 'Cube 2×2×2', 'Cubo 2×2×2'],
  'event.333': ['三阶', '3×3×3 Cube', '3×3×3キューブ', '三階', '3×3×3 큐브', 'Cube 3×3×3', 'Cubo 3×3×3'],
  'event.444': ['四阶', '4×4×4 Cube', '4×4×4キューブ', '四階', '4×4×4 큐브', 'Cube 4×4×4', 'Cubo 4×4×4'],
  'event.555': ['五阶', '5×5×5 Cube', '5×5×5キューブ', '五階', '5×5×5 큐브', 'Cube 5×5×5', 'Cubo 5×5×5'],
  'event.666': ['六阶', '6×6×6 Cube', '6×6×6キューブ', '六階', '6×6×6 큐브', 'Cube 6×6×6', 'Cubo 6×6×6'],
  'event.777': ['七阶', '7×7×7 Cube', '7×7×7キューブ', '七階', '7×7×7 큐브', 'Cube 7×7×7', 'Cubo 7×7×7'],
  'event.skewb': ['斜转', 'Skewb', 'スキューブ', '斜轉', '스큐브', 'Skewb', 'Skewb'],
  'event.pyram': ['金字塔', 'Pyraminx', 'ピラミンクス', '金字塔', '피라밍크스', 'Pyraminx', 'Pyraminx'],
  'event.sq1': ['SQ1', 'Square-1', 'スクエア1', 'SQ1', '스퀘어-1', 'Square-1', 'Square-1'],
  'event.minx': ['五魔方', 'Megaminx', 'メガミンクス', '五魔方', '메가밍크스', 'Megaminx', 'Megaminx'],
  'event.megaminx': ['五魔', 'Megaminx', 'メガミンクス', '五魔', '메가밍크스', 'Megaminx', 'Megaminx'],
  'event.clock': ['魔表', 'Clock', 'クロック', '魔表', '클락', 'Clock', 'Clock'],
  'event.333oh': ['单手', '3×3×3 One-Handed', '3×3×3片手', '單手', '3×3×3 한 손', '3×3×3 à une main', '3×3×3 a una mano'],
  'event.333fm': ['最少步', '3×3×3 Fewest Moves', '3×3×3最少手数', '最少步', '3×3×3 최소 회전', '3×3×3 en moins de mouvements', '3×3×3 en menos movimientos'],
  'event.333bf': ['三盲', '3×3×3 Blindfolded', '3×3×3目隠し', '三盲', '3×3×3 블라인드', '3×3×3 à l’aveugle', '3×3×3 a ciegas'],
  'event.444bf': ['四盲', '4×4×4 Blindfolded', '4×4×4目隠し', '四盲', '4×4×4 블라인드', '4×4×4 à l’aveugle', '4×4×4 a ciegas'],
  'event.555bf': ['五盲', '5×5×5 Blindfolded', '5×5×5目隠し', '五盲', '5×5×5 블라인드', '5×5×5 à l’aveugle', '5×5×5 a ciegas'],
  'event.333mbf': ['多盲', '3×3×3 Multi-Blind', '3×3×3複数目隠し', '多盲', '3×3×3 멀티 블라인드', '3×3×3 multiple à l’aveugle', '3×3×3 múltiple a ciegas'],
  'event.333ft': ['脚拧', '3×3×3 With Feet', '3×3×3足', '腳擰', '3×3×3 발', '3×3×3 avec les pieds', '3×3×3 con los pies'],
  'event.fto': ['FTO', 'Face-Turning Octahedron', '面回転八面体', 'FTO', '면 회전 팔면체', 'Octaèdre à rotation de faces', 'Octaedro de giro de caras'],
  'event.333mbf_unlimited': ['无限多盲', 'Unlimited Multi-Blind', '無制限複数目隠し', '無限多盲', '무제한 멀티 블라인드', 'Multiple à l’aveugle illimité', 'Múltiple a ciegas ilimitado'],
  'event.2_7relay': ['正阶连拧', '2–7 Cube Relay', '2～7キューブリレー', '正階連擰', '2–7 큐브 릴레이', 'Relais de cubes 2 à 7', 'Relevo de cubos del 2 al 7'],
  'event.alien_relay': ['异形连拧', 'Non-Cubic Relay', '異形パズルリレー', '異形連擰', '비정육면체 릴레이', 'Relais de puzzles non cubiques', 'Relevo de puzles no cúbicos'],
  'event.27alien_relay': ['全项目连拧', 'All-Events Relay', '全種目リレー', '全項目連擰', '전 종목 릴레이', 'Relais toutes épreuves', 'Relevo de todas las pruebas'],
  'event.magic': ['魔板', 'Magic', 'マジック', '魔板', '매직', 'Magic', 'Magic'],
  'event.mmagic': ['大师魔板', 'Master Magic', 'マスターマジック', '大師魔板', '마스터 매직', 'Master Magic', 'Master Magic'],
  'event.333mbo': ['旧制多盲', 'Multi-Blind (Old Style)', '旧形式複数目隠し', '舊制多盲', '구형 멀티 블라인드', 'Multiple à l’aveugle (ancien format)', 'Múltiple a ciegas (formato antiguo)'],
  'event.blind': ['{event}盲拧', '{event} Blindfolded', '{event}目隠し', '{event}盲擰', '{event} 블라인드', '{event} à l’aveugle', '{event} a ciegas'],
  'event.oneHanded': ['{event}单手', '{event} One-Handed', '{event}片手', '{event}單手', '{event} 한 손', '{event} à une main', '{event} a una mano'],
  'event.fewestMoves': ['{event}最少步', '{event} Fewest Moves', '{event}最少手数', '{event}最少步', '{event} 최소 회전', '{event} en moins de mouvements', '{event} en menos movimientos'],
  'event.relay': ['{event}连拧', '{event} Relay', '{event}リレー', '{event}連擰', '{event} 릴레이', 'Relais {event}', 'Relevo {event}'],
  'event.multiple': ['{event} {count}次连拧', '{event} × {count} Relay', '{event} {count}回リレー', '{event} {count}次連擰', '{event} {count}회 릴레이', 'Relais {event} × {count}', 'Relevo {event} × {count}'],
  'event.333mini': ['迷你三阶', 'Mini 3×3×3', 'ミニ3×3×3', '迷你三階', '미니 3×3×3', 'Mini 3×3×3', 'Mini 3×3×3'],
  'event.333mirror': ['镜面魔方', 'Mirror Cube', 'ミラーキューブ', '鏡面魔方', '미러 큐브', 'Cube miroir', 'Cubo espejo'],
  'event.333mirroring': ['镜面连体', 'Mirror Siamese Cube', 'ミラー連結キューブ', '鏡面連體', '미러 연결 큐브', 'Cube siamois miroir', 'Cubo siamés espejo'],
  'event.333ghost': ['鬼魔', 'Ghost Cube', 'ゴーストキューブ', '鬼魔', '고스트 큐브', 'Ghost Cube', 'Cubo fantasma'],
  'event.333zongzi': ['粽子魔方', 'Mastermorphix', 'マスターモルフィックス', '糉子魔方', '마스터몰픽스', 'Mastermorphix', 'Mastermorphix'],
  'event.hot_wheels': ['风火轮', 'Hot Wheels', 'ホットウィール', '風火輪', '핫휠', 'Hot Wheels', 'Hot Wheels'],
  'event.fisher': ['费雪魔方', 'Fisher Cube', 'フィッシャーキューブ', '費雪魔方', '피셔 큐브', 'Cube Fisher', 'Cubo Fisher'],
  'event.gear': ['齿轮魔方', 'Gear Cube', 'ギアキューブ', '齒輪魔方', '기어 큐브', 'Cube à engrenages', 'Cubo de engranajes'],
  'event.333clone': ['三阶连体', 'Siamese 3×3×3', '連結3×3×3', '三階連體', '연결 3×3×3', '3×3×3 siamois', '3×3×3 siamés'],
  'event.222minx': ['二阶五魔', 'Kilominx', 'キロミンクス', '二階五魔', '킬로밍크스', 'Kilominx', 'Kilominx'],
  'event.444minx': ['四阶五魔', 'Master Kilominx', 'マスターキロミンクス', '四階五魔', '마스터 킬로밍크스', 'Master Kilominx', 'Master Kilominx'],
  'event.555minx': ['五阶五魔', 'Gigaminx', 'ギガミンクス', '五階五魔', '기가밍크스', 'Gigaminx', 'Gigaminx'],
  'event.444pyram': ['四阶金字塔', 'Master Pyraminx', 'マスターピラミンクス', '四階金字塔', '마스터 피라밍크스', 'Master Pyraminx', 'Master Pyraminx'],
  'event.maple_leaf': ['枫叶魔方', 'Maple Leaf', 'メープルリーフ', '楓葉魔方', '메이플 리프', 'Maple Leaf', 'Maple Leaf'],
  'event.helicopter': ['直升机魔方', 'Helicopter Cube', 'ヘリコプターキューブ', '直升機魔方', '헬리콥터 큐브', 'Cube hélicoptère', 'Cubo helicóptero'],
  'event.redi': ['Redi魔方', 'Redi Cube', 'レディキューブ', 'Redi魔方', '레디 큐브', 'Cube Redi', 'Cubo Redi'],
  'event.cuboid': ['{size}魔方', '{size} Cuboid', '{size}直方体', '{size}魔方', '{size} 직육면체', 'Pavé {size}', 'Cuboide {size}'],
  'event.digit': ['数字记忆', 'Digit Memory', '数字記憶', '數字記憶', '숫자 기억', 'Mémorisation de chiffres', 'Memoria de dígitos'],
  'event.digit_num': ['数字记忆（数字）', 'Number Memory', '数の記憶', '數字記憶（數字）', '수 기억', 'Mémorisation de nombres', 'Memoria de números'],
  'event.digit_uppercase': ['字母记忆', 'Letter Memory', '文字記憶', '字母記憶', '문자 기억', 'Mémorisation de lettres', 'Memoria de letras'],
  'event.digit_num_uppercase': ['数字字母记忆', 'Alphanumeric Memory', '英数字記憶', '數字字母記憶', '숫자·문자 기억', 'Mémorisation alphanumérique', 'Memoria alfanumérica'],
  'event.puke': ['扑克牌记忆', 'Card Memory', 'トランプ記憶', '啤牌記憶', '카드 기억', 'Mémorisation de cartes', 'Memoria de cartas'],
  'event.sudoku_very_easy': ['数独（入门）', 'Sudoku (Very Easy)', '数独（入門）', '數獨（入門）', '스도쿠 (매우 쉬움)', 'Sudoku (très facile)', 'Sudoku (muy fácil)'],
  'event.sudoku_easy': ['数独（简单）', 'Sudoku (Easy)', '数独（初級）', '數獨（簡單）', '스도쿠 (쉬움)', 'Sudoku (facile)', 'Sudoku (fácil)'],
  'event.sudoku_moderate': ['数独（中等）', 'Sudoku (Moderate)', '数独（中級）', '數獨（中等）', '스도쿠 (보통)', 'Sudoku (moyen)', 'Sudoku (medio)'],
  'event.sudoku_advanced': ['数独（进阶）', 'Sudoku (Advanced)', '数独（上級）', '數獨（進階）', '스도쿠 (고급)', 'Sudoku (avancé)', 'Sudoku (avanzado)'],
  'event.sudoku_hard': ['数独（困难）', 'Sudoku (Hard)', '数独（難問）', '數獨（困難）', '스도쿠 (어려움)', 'Sudoku (difficile)', 'Sudoku (difícil)'],
  'event.sudoku_master': ['数独（大师）', 'Sudoku (Master)', '数独（達人）', '數獨（大師）', '스도쿠 (마스터)', 'Sudoku (expert)', 'Sudoku (experto)'],
  'event.sliding': ['{count}数码', '{count}-Puzzle', '{count}パズル', '{count}數碼', '{count} 퍼즐', 'Taquin à {count} cases', 'Puzle de {count} piezas'],
  'event.jhh': ['聚宝浩浩', 'Ju Bao Hao Hao', 'Ju Bao Hao Hao', '聚寶浩浩', 'Ju Bao Hao Hao', 'Ju Bao Hao Hao', 'Ju Bao Hao Hao'],
  'event.o_cola': ['可乐', 'Cola', 'コーラ', '可樂', '콜라', 'Cola', 'Cola'],
  'round.0': ['资格赛', 'Qualification', '資格予選', '資格賽', '자격 예선', 'Qualifications', 'Clasificación'],
  'round.1': ['初赛', 'First round', '1回戦', '初賽', '1라운드', 'Premier tour', 'Primera ronda'],
  'round.2': ['复赛', 'Second round', '2回戦', '複賽', '2라운드', 'Deuxième tour', 'Segunda ronda'],
  'round.3': ['半决赛', 'Semi-final', '準決勝', '準決賽', '준결승', 'Demi-finale', 'Semifinal'],
  'round.b': ['B组决赛', 'B final', 'B決勝', 'B組決賽', 'B 결승', 'Finale B', 'Final B'],
  'round.c': ['组合制决赛', 'Combined final', '複合決勝', '組合制決賽', '혼합 결승', 'Finale combinée', 'Final combinada'],
  'round.d': ['组合制初赛', 'Combined first round', '複合1回戦', '組合制初賽', '혼합 1라운드', 'Premier tour combiné', 'Primera ronda combinada'],
  'round.e': ['组合制复赛', 'Combined second round', '複合2回戦', '組合制複賽', '혼합 2라운드', 'Deuxième tour combiné', 'Segunda ronda combinada'],
  'round.f': ['决赛', 'Final', '決勝', '決賽', '결승', 'Finale', 'Final'],
  'round.g': ['组合制半决赛', 'Combined semi-final', '複合準決勝', '組合制準決賽', '혼합 준결승', 'Demi-finale combinée', 'Semifinal combinada'],
  'round.h': ['组合制资格赛', 'Combined qualification', '複合資格予選', '組合制資格賽', '혼합 자격 예선', 'Qualifications combinées', 'Clasificación combinada'],
  'round.numbered': ['第{count}轮', 'Round {count}', '第{count}ラウンド', '第{count}輪', '{count}라운드', 'Tour {count}', 'Ronda {count}'],
  'round.intermediate': ['复赛第{count}轮', 'Intermediate round {count}', '中間ラウンド{count}', '複賽第{count}輪', '중간 라운드 {count}', 'Tour intermédiaire {count}', 'Ronda intermedia {count}'],
  'route.0': ['非比赛项目', 'Non-competition event', '競技対象外', '非比賽項目', '비경기 종목', 'Épreuve hors compétition', 'Prueba fuera de competición'],
  'route.1': ['一把取最佳', 'Best of 1', '1回のベスト', '一把取最佳', '1회 중 최고', 'Meilleur sur 1', 'Mejor de 1'],
  'route.2': ['三把取最佳', 'Best of 3', '3回のベスト', '三把取最佳', '3회 중 최고', 'Meilleur sur 3', 'Mejor de 3'],
  'route.3': ['三把取平均(单次取整)', 'Mean of 3 (integer singles)', '3回の平均（単発は整数）', '三把取平均(單次取整)', '3회 평균 (단일 기록 정수)', 'Moyenne de 3 (essais entiers)', 'Media de 3 (intentos enteros)'],
  'route.4': ['三把取平均', 'Mean of 3', '3回の平均', '三把取平均', '3회 평균', 'Moyenne de 3', 'Media de 3'],
  'route.5': ['五把取最佳', 'Best of 5', '5回のベスト', '五把取最佳', '5회 중 최고', 'Meilleur sur 5', 'Mejor de 5'],
  'route.6': ['五把取平均', 'Mean of 5', '5回の平均', '五把取平均', '5회 전체 평균', 'Moyenne des 5 essais', 'Media de los 5 intentos'],
  'route.7': ['五把去头尾取平均', 'Average of 5 (trimmed)', '5回のトリム平均', '五把去頭尾取平均', '5회 절사 평균', 'Moyenne élaguée de 5', 'Media recortada de 5'],
  'route.8': ['一把多次尝试', 'One multi-solve attempt', '複数復元1試行', '一把多次嘗試', '다중 복원 1회 시도', 'Un essai de résolution multiple', 'Un intento de resolución múltiple'],
  'route.9': ['两把多次尝试取最佳', 'Best of 2 multi-solve attempts', '複数復元2試行のベスト', '兩把多次嘗試取最佳', '다중 복원 2회 중 최고', 'Meilleur de 2 essais de résolution multiple', 'Mejor de 2 intentos de resolución múltiple'],
  'route.10': ['三把多次尝试取最佳', 'Best of 3 multi-solve attempts', '複数復元3試行のベスト', '三把多次嘗試取最佳', '다중 복원 3회 중 최고', 'Meilleur de 3 essais de résolution multiple', 'Mejor de 3 intentos de resolución múltiple'],
  'data.single': ['单次', 'Single', '単発', '單次', '단일', 'Résultat individuel', 'Individual'],
  'data.cubeId': ['选手ID', 'Competitor ID', '選手ID', '選手ID', '선수 ID', 'Identifiant du compétiteur', 'ID del competidor'],
} as const satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

type ShortKey = keyof typeof messages;
export type DomainMessageKey = `domain.${ShortKey}`;
function catalog(index: number): Record<DomainMessageKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [`domain.${key}`, values[index]])) as Record<DomainMessageKey, string>;
}

export const domainZhCN = catalog(0);
export const domainEnUS = catalog(1);
export const domainJa = catalog(2);
export const domainYue = catalog(3);
export const domainKo = catalog(4);
export const domainFr = catalog(5);
export const domainEs = catalog(6);

export const domainCatalogs: Record<Locale, Record<DomainMessageKey, string>> = {
  'zh-CN': domainZhCN, 'en-US': domainEnUS, ja: domainJa, 'yue-Hant-HK': domainYue,
  ko: domainKo, fr: domainFr, es: domainEs,
};

export function translateDomain(locale: Locale, key: DomainMessageKey, params?: Record<string, string | number>): string {
  const text = domainCatalogs[locale]?.[key] ?? domainZhCN[key] ?? key;
  return formatMessage(locale, key, text, params);
}

const roundCodes = ['0', '1', '2', '3', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export type RoundCode = (typeof roundCodes)[number];

/** Accept WCA codes and legacy schedule labels; never alter the stored value. */
export function formatRoundName(value: string, locale: Locale = readStoredLocale()): string {
  if (roundCodes.includes(value as RoundCode)) return translateDomain(locale, `domain.round.${value as RoundCode}`);
  for (const code of roundCodes) {
    if (Object.values(domainCatalogs).some(dict => dict[`domain.round.${code}`] === value)) {
      return translateDomain(locale, `domain.round.${code}`);
    }
  }
  const numbered = /^(?:第\s*(\d+)\s*[轮輪]|Round\s+(\d+))$/.exec(value);
  if (numbered) return translateDomain(locale, 'domain.round.numbered', { count: numbered[1] ?? numbered[2] });
  const intermediate = /^[复複]赛第\s*(\d+)\s*[轮輪]$|^複賽第\s*(\d+)\s*輪$/.exec(value);
  if (intermediate) return translateDomain(locale, 'domain.round.intermediate', { count: intermediate[1] ?? intermediate[2] });
  return value;
}
