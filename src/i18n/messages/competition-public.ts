// Column order: zh-CN, en-US, ja, yue, ko, fr, es.
const messages = {
  schedule: ['赛程', 'Schedule', 'スケジュール', '賽程', '일정', 'Programme', 'Programa'],
  scrambleGroup: ['打乱组', 'Scramble group', 'スクランブルグループ', '打亂組', '스크램블 그룹', 'Groupe de mélanges', 'Grupo de mezclas'],
  scrambleGroupNumber: ['打乱组 {count}', 'Scramble group {count}', 'スクランブルグループ {count}', '打亂組 {count}', '스크램블 그룹 {count}', 'Groupe de mélanges {count}', 'Grupo de mezclas {count}'],
  noScrambles: ['暂无打乱', 'No scrambles available', 'スクランブルはまだありません', '暫時未有打亂', '아직 스크램블이 없습니다', 'Aucun mélange disponible', 'No hay mezclas disponibles'],
  groupTimer: ['群赛计时器', 'Group competition timer', 'グループ大会タイマー', '群賽計時器', '그룹 대회 타이머', 'Chronomètre de compétition de groupe', 'Cronómetro de competición de grupo'],
  loadingEvents: ['项目数据加载中…', 'Loading event data…', '種目データを読み込み中…', '載入項目資料中…', '종목 데이터 불러오는 중…', 'Chargement des épreuves…', 'Cargando datos de las pruebas…'],
  eventsFailed: ['无法加载项目数据，请重试。', 'Could not load event data. Please retry.', '種目データを読み込めませんでした。再試行してください。', '載入唔到項目資料，請重試。', '종목 데이터를 불러오지 못했습니다. 다시 시도하세요.', 'Impossible de charger les épreuves. Réessayez.', 'No se pudieron cargar las pruebas. Vuelve a intentarlo.'],
  loadingDiagram: ['图示加载中…', 'Loading diagram…', '図を読み込み中…', '載入圖示中…', '그림 불러오는 중…', 'Chargement du schéma…', 'Cargando diagrama…'],
  diagramFailed: ['无法显示打乱图示', 'Scramble diagram unavailable', 'スクランブル図を表示できません', '顯示唔到打亂圖示', '스크램블 그림을 표시할 수 없습니다', 'Schéma du mélange indisponible', 'Diagrama de mezcla no disponible'],
  diagramAlt: ['打乱图示：{scramble}', 'Scramble diagram: {scramble}', 'スクランブル図：{scramble}', '打亂圖示：{scramble}', '스크램블 그림: {scramble}', 'Schéma du mélange : {scramble}', 'Diagrama de mezcla: {scramble}'],
  rankingsHeading: ['{competition} 各项目排名：', '{competition} rankings by event:', '{competition} 種目別順位：', '{competition} 各項目排名：', '{competition} 종목별 순위:', 'Classements par épreuve de {competition} :', 'Clasificaciones por prueba de {competition}:'],
  registrationUnavailable: ['选手报名界面尚未开放', 'Competitor registration is not available yet', '選手登録はまだ利用できません', '選手報名仲未開放', '선수 등록은 아직 이용할 수 없습니다', 'Les inscriptions ne sont pas encore ouvertes', 'La inscripción de competidores aún no está disponible'],
  firstRound: ['初赛', 'First round', '1回戦', '初賽', '1라운드', 'Premier tour', 'Primera ronda'],
  secondRound: ['复赛', 'Second round', '2回戦', '複賽', '2라운드', 'Deuxième tour', 'Segunda ronda'],
  semifinal: ['半决赛', 'Semi-final', '準決勝', '準決賽', '준결승', 'Demi-finale', 'Semifinal'],
  quarterfinal: ['四分之一决赛', 'Quarter-final', '準々決勝', '半準決賽', '준준결승', 'Quart de finale', 'Cuartos de final'],
  final: ['决赛', 'Final', '決勝', '決賽', '결승', 'Finale', 'Final'],
  combinedFinal: ['联合决赛', 'Combined final', '複合決勝', '合併決賽', '통합 결승', 'Finale combinée', 'Final combinada'],
  qualification: ['资格赛', 'Qualification', '予選', '資格賽', '예선', 'Qualifications', 'Clasificación'],
  intermediateRound: ['复赛第{count}轮', 'Intermediate round {count}', '中間ラウンド{count}', '複賽第{count}輪', '중간 라운드 {count}', 'Tour intermédiaire {count}', 'Ronda intermedia {count}'],
  attemptSelector: ['选择把次', 'Select attempt', '試行を選択', '揀選把次', '시도 선택', 'Choisir un essai', 'Seleccionar intento'],
  copyFailed: ['复制失败，请重试或手动选择文本。', 'Copy failed. Retry or select the text manually.', 'コピーできませんでした。再試行するか、テキストを手動で選択してください。', '複製失敗，請重試或者手動揀選文字。', '복사하지 못했습니다. 다시 시도하거나 텍스트를 직접 선택하세요.', 'Échec de la copie. Réessayez ou sélectionnez le texte manuellement.', 'No se pudo copiar. Vuelve a intentarlo o selecciona el texto manualmente.'],
  resultsFailed: ['无法加载比赛成绩，请重试。', 'Could not load competition results. Please retry.', '大会結果を読み込めませんでした。再試行してください。', '載入唔到比賽成績，請重試。', '대회 결과를 불러오지 못했습니다. 다시 시도하세요.', 'Impossible de charger les résultats. Réessayez.', 'No se pudieron cargar los resultados. Vuelve a intentarlo.'],
  competitionFailed: ['无法加载比赛，请重试。', 'Could not load the competition. Please retry.', '大会を読み込めませんでした。再試行してください。', '載入唔到比賽，請重試。', '대회를 불러오지 못했습니다. 다시 시도하세요.', 'Impossible de charger la compétition. Réessayez.', 'No se pudo cargar la competición. Vuelve a intentarlo.'],
} as const;

type Key = `competitionPublic.${keyof typeof messages}`;
function catalog(column: number): Record<Key, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [`competitionPublic.${key}`, values[column]])) as Record<Key, string>;
}

export const competitionPublicZhCN = catalog(0);
export const competitionPublicEnUS = catalog(1);
export const competitionPublicJa = catalog(2);
export const competitionPublicYue = catalog(3);
export const competitionPublicKo = catalog(4);
export const competitionPublicFr = catalog(5);
export const competitionPublicEs = catalog(6);
