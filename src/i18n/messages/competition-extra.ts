// Column order: zh-CN, en-US, ja, yue, ko, fr, es.
const messages = {
  totalScore: ['总分', 'Total score', '総合スコア', '總分', '총점', 'Score total', 'Puntuación total'],
  score: ['分数', 'Score', 'スコア', '分數', '점수', 'Score', 'Puntuación'],
  eventScore: ['项目分数', 'Event score', '種目スコア', '項目分數', '종목 점수', 'Score de l’épreuve', 'Puntuación de la prueba'],
  eventResults: ['项目详细成绩', 'Detailed event results', '種目の詳細記録', '項目詳細成績', '종목 상세 기록', 'Résultats détaillés de l’épreuve', 'Resultados detallados de la prueba'],
  region: ['国家或地区', 'Country or region', '国・地域', '國家或地區', '국가 또는 지역', 'Pays ou région', 'País o región'],
  colorsOn: ['开启颜色', 'Colors on', '色分けあり', '開啟顏色', '색상 켜짐', 'Couleurs activées', 'Colores activados'],
  colorsOff: ['关闭颜色', 'Colors off', '色分けなし', '關閉顏色', '색상 꺼짐', 'Couleurs désactivées', 'Colores desactivados'],
  allCountries: ['全部国家或地区', 'All countries or regions', 'すべての国・地域', '全部國家或地區', '모든 국가 또는 지역', 'Tous les pays ou régions', 'Todos los países o regiones'],
  selectedCountries: ['已选择 {count} 个国家或地区', '{count} countries or regions selected', '{count}の国・地域を選択中', '已揀 {count} 個國家或地區', '국가 또는 지역 {count}개 선택됨', '{count} pays ou régions sélectionnés', '{count} países o regiones seleccionados'],
  age: ['年龄：{count}岁', 'Age: {count} years', '年齢：{count}歳', '年齡：{count}歲', '나이: {count}세', 'Âge : {count} ans', 'Edad: {count} años'],
  yearsOld: ['{count}岁', '{count} years', '{count}歳', '{count}歲', '{count}세', '{count} ans', '{count} años'],
  matches: ['比赛场次', 'Competitions attended', '出場大会数', '參賽場次', '참가 대회 수', 'Compétitions disputées', 'Competiciones disputadas'],
  solves: ['还原次数', 'Solves', '試行数', '還原次數', '시도 횟수', 'Résolutions', 'Resoluciones'],
  allEventsComplete: ['全项目达成', 'All events completed', '全種目達成', '全項目達成', '모든 종목 달성', 'Toutes les épreuves accomplies', 'Todas las pruebas completadas'],
  bestRecords: ['最佳记录', 'Best records', '自己ベスト', '最佳紀錄', '최고 기록', 'Meilleurs records', 'Mejores marcas'],
  funEvents: ['趣味项目', 'Unofficial events', '非公式種目', '趣味項目', '비공식 종목', 'Épreuves non officielles', 'Pruebas no oficiales'],
  wcaEvents: ['WCA项目', 'WCA events', 'WCA種目', 'WCA 項目', 'WCA 종목', 'Épreuves WCA', 'Pruebas WCA'],
  competitionEvents: ['比赛项目', 'Competition events', '大会種目', '比賽項目', '대회 종목', 'Épreuves de compétition', 'Pruebas de competición'],
  icon: ['图标', 'Icon', 'アイコン', '圖示', '아이콘', 'Icône', 'Icono'],
  eventType: ['项目类型', 'Result format', '記録形式', '項目類型', '기록 형식', 'Format des résultats', 'Formato de resultados'],
  aliases: ['别名', 'Aliases', '別名', '別名', '다른 이름', 'Autres noms', 'Nombres alternativos'],
  statistics: ['统计', 'Statistics', '統計', '統計', '통계', 'Statistiques', 'Estadísticas'],
  resultStatistics: ['成绩统计', 'Result statistics', '記録統計', '成績統計', '기록 통계', 'Statistiques des résultats', 'Estadísticas de resultados'],
  byCompetition: ['按比赛', 'By competition', '大会別', '按比賽', '대회별', 'Par compétition', 'Por competición'],
  singleQuantiles: ['成绩分位（单次）', 'Result quantiles (single)', '記録の分位数（単発）', '成績分位（單次）', '기록 분위수 (단일)', 'Quantiles des résultats individuels', 'Cuantiles de resultados individuales'],
  averageQuantiles: ['成绩分位（平均）', 'Result quantiles (average)', '記録の分位数（平均）', '成績分位（平均）', '기록 분위수 (평균)', 'Quantiles des moyennes', 'Cuantiles de promedios'],
  resultDistribution: ['成绩分布', 'Result distribution', '記録分布', '成績分佈', '기록 분포', 'Distribution des résultats', 'Distribución de resultados'],
  averageResults: ['平均成绩', 'Average results', '平均記録', '平均成績', '평균 기록', 'Moyennes des résultats', 'Promedios de resultados'],
  bestAverages: ['最佳平均成绩', 'Best averages', 'ベスト平均', '最佳平均成績', '최고 평균', 'Meilleures moyennes', 'Mejores promedios'],
  recentValidResults: ['近期有效成绩', 'Recent valid results', '直近の有効記録', '近期有效成績', '최근 유효 기록', 'Résultats valides récents', 'Resultados válidos recientes'],
  scoreRanges: ['成绩区间统计', 'Result ranges', '記録の区間統計', '成績區間統計', '기록 구간 통계', 'Intervalles de résultats', 'Intervalos de resultados'],
  noNemesis: ['{name} 无宿敌！', '{name} has no nemesis!', '{name}にライバルはいません！', '{name} 冇宿敵！', '{name}님은 라이벌이 없습니다!', '{name} n’a aucun rival !', '¡{name} no tiene rivales!'],
  sorTimed: ['计时项目：(全网最佳 / 个人最佳) × 100', 'Timed events: (overall best / personal best) × 100', '計時種目：（全体ベスト / 自己ベスト）× 100', '計時項目：（全網最佳 / 個人最佳）× 100', '시간 종목: (전체 최고 / 개인 최고) × 100', 'Épreuves chronométrées : (meilleur global / meilleur personnel) × 100', 'Pruebas cronometradas: (mejor global / mejor personal) × 100'],
  sorRepeated: ['多盲等多次尝试项目：多盲分 + (60 - 用时) / 60', 'Multi-blind and repeated-attempt events: multi-blind points + (60 − time) / 60', '複数目隠しなどの複数試行種目：複数目隠し得点 + (60 − 時間) / 60', '多盲等多次嘗試項目：多盲分 + (60 − 用時) / 60', '멀티 블라인드 등 반복 시도 종목: 멀티 블라인드 점수 + (60 − 시간) / 60', 'Épreuves à essais multiples : points de multiple à l’aveugle + (60 − temps) / 60', 'Pruebas de intentos múltiples: puntos de múltiple a ciegas + (60 − tiempo) / 60'],
  sorAlgorithm: ['KinChSor 算法说明', 'KinChSor scoring method', 'KinChSorの計算方法', 'KinChSor 計分說明', 'KinChSor 계산 방법', 'Méthode de calcul KinChSor', 'Método de puntuación KinChSor'],
  explanation: ['说明', 'Explanation', '説明', '說明', '설명', 'Explication', 'Explicación'],
  overall: ['总榜', 'Overall', '総合', '總榜', '종합', 'Général', 'General'],
  history: ['历史', 'History', '履歴', '歷史', '이력', 'Historique', 'Historial'],
  historicalRecords: ['历史记录', 'Record history', '記録更新履歴', '歷史紀錄', '신기록 이력', 'Historique des records', 'Historial de récords'],
  recordMode: ['切换总榜与历史记录', 'Switch between overall records and history', '総合記録と履歴を切り替え', '切換總榜同歷史紀錄', '종합 기록과 이력 전환', 'Basculer entre les records et leur historique', 'Alternar entre récords e historial'],
  recordGroup: ['记录所属群组', 'Record group', '記録のグループ', '紀錄所屬群組', '기록 그룹', 'Groupe du record', 'Grupo del récord'],
  recordEvent: ['记录项目', 'Record event', '記録の種目', '紀錄項目', '기록 종목', 'Épreuve du record', 'Prueba del récord'],
  pkRecords: ['PK 计时记录', 'PK timer records', 'PKタイマー記録', 'PK 計時紀錄', 'PK 타이머 기록', 'Historique du chronomètre PK', 'Registros del cronómetro PK'],
  totalAttempts: ['总把数', 'Total attempts', '総試行数', '總把數', '총 시도 수', 'Nombre total d’essais', 'Total de intentos'],
  groupName: ['组名', 'Group name', 'グループ名', '組名', '그룹 이름', 'Nom du groupe', 'Nombre del grupo'],
  collapseAll: ['收起所有', 'Collapse all', 'すべて折りたたむ', '收起全部', '모두 접기', 'Tout réduire', 'Contraer todo'],
  expandAll: ['展开所有', 'Expand all', 'すべて展開', '展開全部', '모두 펼치기', 'Tout développer', 'Expandir todo'],
  playerNotFound: ['玩家不存在', 'Player not found', 'プレイヤーが見つかりません', '搵唔到玩家', '플레이어를 찾을 수 없습니다', 'Joueur introuvable', 'Jugador no encontrado'],
  loading: ['加载中…', 'Loading…', '読み込み中…', '載入中…', '불러오는 중…', 'Chargement…', 'Cargando…'],
  route0: ['非比赛项目', 'Non-competition event', '競技対象外', '非比賽項目', '비경기 종목', 'Épreuve hors compétition', 'Prueba no competitiva'],
  route1: ['一把取最佳', 'Best of 1', '1回のベスト', '一把取最佳', '1회 최고', 'Meilleur sur 1', 'Mejor de 1'],
  route2: ['三把取最佳', 'Best of 3', '3回のベスト', '三把取最佳', '3회 최고', 'Meilleur sur 3', 'Mejor de 3'],
  route3: ['三把取平均（单次取整）', 'Mean of 3 (integer singles)', '3回の平均（単発は整数）', '三把取平均（單次取整）', '3회 평균 (단일 정수)', 'Moyenne de 3 (résultats entiers)', 'Media de 3 (individuales enteros)'],
  route4: ['三把取平均', 'Mean of 3', '3回の平均', '三把取平均', '3회 평균', 'Moyenne de 3', 'Media de 3'],
  route5: ['五把取最佳', 'Best of 5', '5回のベスト', '五把取最佳', '5회 최고', 'Meilleur sur 5', 'Mejor de 5'],
  route6: ['五把取平均', 'Mean of 5', '5回の平均', '五把取平均', '5회 평균', 'Moyenne des 5 essais', 'Media de 5'],
  route7: ['五把去头尾取平均', 'Average of 5 (trimmed)', '5回の平均（最良・最悪を除く）', '五把去頭尾取平均', '5회 절사 평균', 'Moyenne de 5 (extrêmes exclus)', 'Promedio de 5 (sin extremos)'],
  route8: ['一把多次尝试', '1 repeated-attempt round', '複数試行を1回', '一把多次嘗試', '반복 시도 1회', '1 essai à résolutions multiples', '1 intento con resoluciones múltiples'],
  route9: ['两把多次尝试取最佳', 'Best of 2 repeated-attempt rounds', '複数試行2回のベスト', '兩把多次嘗試取最佳', '반복 시도 2회 중 최고', 'Meilleur de 2 essais à résolutions multiples', 'Mejor de 2 intentos con resoluciones múltiples'],
  route10: ['三把多次尝试取最佳', 'Best of 3 repeated-attempt rounds', '複数試行3回のベスト', '三把多次嘗試取最佳', '반복 시도 3회 중 최고', 'Meilleur de 3 essais à résolutions multiples', 'Mejor de 3 intentos con resoluciones múltiples'],
} as const satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

type Key = `competitionExtra.${keyof typeof messages}`;
function catalog(column: number): Record<Key, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [`competitionExtra.${key}`, values[column]])) as Record<Key, string>;
}

export const competitionExtraZhCN = catalog(0);
export const competitionExtraEnUS = catalog(1);
export const competitionExtraJa = catalog(2);
export const competitionExtraYue = catalog(3);
export const competitionExtraKo = catalog(4);
export const competitionExtraFr = catalog(5);
export const competitionExtraEs = catalog(6);
