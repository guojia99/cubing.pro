import type { Locale } from "../locales";
import { formatMessage } from "../formatMessage";

// Columns: zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es.
const messages = {
  "wcaPuzzleExtra.competitions": ["WCA 比赛", "WCA competitions", "WCA 大会", "WCA 比賽", "WCA 대회", "Compétitions WCA", "Competiciones WCA"],
  "wcaPuzzleExtra.players": ["WCA 选手", "WCA competitors", "WCA 選手", "WCA 選手", "WCA 선수", "Compétiteurs WCA", "Competidores WCA"],
  "wcaPuzzleExtra.statistics": ["WCA 统计", "WCA statistics", "WCA 統計", "WCA 統計", "WCA 통계", "Statistiques WCA", "Estadísticas WCA"],
  "wcaPuzzleExtra.performance": ["成绩分析", "Performance analysis", "成績分析", "成績分析", "성적 분석", "Analyse des performances", "Análisis del rendimiento"],
  "wcaPuzzleExtra.wcaProfile": ["WCA 个人资料", "WCA profile", "WCA プロフィール", "WCA 個人資料", "WCA 프로필", "Profil WCA", "Perfil WCA"],
  "wcaPuzzleExtra.chinaProfile": ["粗饼网个人成绩", "Cubing China results", "Cubing China の成績", "粗餅網個人成績", "Cubing China 성적", "Résultats Cubing China", "Resultados de Cubing China"],
  "wcaPuzzleExtra.nativeLoading": ["正在加载二阶魔方…", "Loading 2x2x2…", "2x2x2 を読み込み中…", "載入緊二階魔方…", "2x2x2 로딩 중…", "Chargement du 2x2x2…", "Cargando el 2x2x2…"],
  "wcaPuzzleExtra.nativePlayer": ["二阶魔方播放器", "2x2x2 player", "2x2x2 プレーヤー", "二階魔方播放器", "2x2x2 플레이어", "Lecteur 2x2x2", "Reproductor 2x2x2"],
  "wcaPuzzleExtra.nativeDiagram": ["二阶魔方状态图", "2x2x2 state diagram", "2x2x2 の状態図", "二階魔方狀態圖", "2x2x2 상태 도식", "Diagramme de l’état du 2x2x2", "Diagrama del estado del 2x2x2"],
  "wcaPuzzleExtra.squarePlayer": ["可交互 Square-1 三维魔方", "Interactive Square-1 3D puzzle", "操作できる Square-1 の3D表示", "可互動 Square-1 三維魔方", "조작 가능한 Square-1 3D 퍼즐", "Puzzle Square-1 3D interactif", "Puzle Square-1 3D interactivo"],
  "wcaPuzzleExtra.busy": ["一次只能操作一个二阶播放器。", "Only one 2x2x2 player can be interactive at a time.", "同時に操作できる2x2x2プレーヤーは1つです。", "一次只可以操作一個二階播放器。", "한 번에 하나의 2x2x2 플레이어만 조작할 수 있습니다.", "Un seul lecteur 2x2x2 peut être interactif à la fois.", "Solo se puede interactuar con un reproductor 2x2x2 a la vez."],
  "wcaPuzzleExtra.contextLost": ["WebGL 上下文已丢失，请重新打开播放器重试。", "WebGL context lost. Reopen the player to retry.", "WebGL コンテキストが失われました。プレーヤーを開き直してください。", "WebGL 上下文已遺失，請重新開啟播放器再試。", "WebGL 컨텍스트가 손실되었습니다. 플레이어를 다시 열어 주세요.", "Le contexte WebGL a été perdu. Rouvrez le lecteur pour réessayer.", "Se perdió el contexto WebGL. Vuelve a abrir el reproductor."],
  "wcaPuzzleExtra.sceneUnavailable": ["无法创建二阶三维场景。", "The 2x2x2 3D scene is unavailable.", "2x2x2 の3Dシーンを作成できません。", "建立唔到二階三維場景。", "2x2x2 3D 장면을 만들 수 없습니다.", "La scène 3D du 2x2x2 est indisponible.", "La escena 3D del 2x2x2 no está disponible."],
  "wcaPuzzleExtra.positionUnavailable": ["无法读取二阶魔方状态。", "The 2x2x2 position is unavailable.", "2x2x2 の状態を取得できません。", "讀取唔到二階魔方狀態。", "2x2x2 상태를 읽을 수 없습니다.", "L’état du 2x2x2 est indisponible.", "El estado del 2x2x2 no está disponible."],
  "wcaPuzzleExtra.screenshotUnavailable": ["浏览器无法生成魔方截图。", "The browser cannot capture a puzzle screenshot.", "ブラウザーでパズルの画像を作成できません。", "瀏覽器產生唔到魔方截圖。", "브라우저에서 퍼즐 스크린샷을 만들 수 없습니다.", "Le navigateur ne peut pas capturer le puzzle.", "El navegador no puede capturar una imagen del puzle."],
  "wcaPuzzleExtra.screenshotEmpty": ["魔方截图为空，请重试。", "The puzzle screenshot is empty. Try again.", "パズルの画像が空です。再試行してください。", "魔方截圖係空白，請再試。", "퍼즐 스크린샷이 비어 있습니다. 다시 시도해 주세요.", "La capture du puzzle est vide. Réessayez.", "La captura del puzle está vacía. Vuelve a intentarlo."],
  "wcaPuzzleExtra.timeout": ["三维播放器加载超时，请重试。", "The 3D player timed out while loading. Try again.", "3D プレーヤーの読み込みがタイムアウトしました。再試行してください。", "三維播放器載入逾時，請再試。", "3D 플레이어 로딩 시간이 초과되었습니다. 다시 시도해 주세요.", "Le chargement du lecteur 3D a expiré. Réessayez.", "Se agotó el tiempo de carga del reproductor 3D. Vuelve a intentarlo."],
  "wcaPuzzleExtra.colorsUnavailable": ["无法读取魔方面颜色。", "Puzzle face colors are unavailable.", "パズルの面の色を取得できません。", "讀取唔到魔方面顏色。", "퍼즐 면 색상을 읽을 수 없습니다.", "Les couleurs des faces sont indisponibles.", "Los colores de las caras no están disponibles."],
  "wcaPuzzleExtra.missingFace": ["缺少魔方面：{face}", "Missing puzzle face: {face}", "パズルの面がありません：{face}", "缺少魔方面：{face}", "퍼즐 면이 없습니다: {face}", "Face du puzzle manquante : {face}", "Falta la cara del puzle: {face}"],
  "wcaPuzzleExtra.invalidColor": ["{face} 面颜色无效：{color}", "Invalid {face} face color: {color}", "{face} 面の色が無効です：{color}", "{face} 面顏色無效：{color}", "{face} 면 색상이 잘못되었습니다: {color}", "Couleur invalide pour la face {face} : {color}", "Color no válido para la cara {face}: {color}"],
  "wcaPuzzleExtra.formulaLong": ["公式过长。", "The algorithm is too long.", "手順が長すぎます。", "公式太長。", "공식이 너무 깁니다.", "L’algorithme est trop long.", "El algoritmo es demasiado largo."],
  "wcaPuzzleExtra.moveLimit": ["公式展开后不能超过 {count} 步。", "The expanded algorithm must not exceed {count} moves.", "展開後の手順は{count}手以内にしてください。", "公式展開後唔可以超過 {count} 步。", "전개된 공식은 {count}회전을 초과할 수 없습니다.", "L’algorithme développé ne doit pas dépasser {count} mouvements.", "El algoritmo expandido no debe superar {count} movimientos."],
  "wcaPuzzleExtra.nestingLimit": ["公式括号不能超过 {count} 层。", "Algorithm nesting must not exceed {count} levels.", "手順の入れ子は{count}段以内にしてください。", "公式括號唔可以超過 {count} 層。", "공식 중첩은 {count}단계를 초과할 수 없습니다.", "L’imbrication ne doit pas dépasser {count} niveaux.", "El anidamiento no debe superar {count} niveles."],
  "wcaPuzzleExtra.safeInteger": ["公式重复次数和转动量必须是安全整数。", "Algorithm repetitions and move amounts must be safe integers.", "繰り返し回数と回転量は安全な整数にしてください。", "公式重複次數同轉動量一定要係安全整數。", "공식 반복 횟수와 회전량은 안전한 정수여야 합니다.", "Les répétitions et amplitudes doivent être des entiers sûrs.", "Las repeticiones y cantidades de giro deben ser enteros seguros."],
  "wcaPuzzleExtra.illegalSlice": ["Square-1 切割不合法，会切开角块。", "Illegal Square-1 slice: it would split a corner.", "Square-1 のスラッシュが不正です。コーナーを分割してしまいます。", "Square-1 切割唔合法，會切開角塊。", "잘못된 Square-1 슬라이스입니다. 코너가 잘리게 됩니다.", "Tranche Square-1 illégale : elle couperait un coin.", "Corte de Square-1 no válido: dividiría una esquina."],
  "wcaPuzzleExtra.noSetup": ["没有可用的公式或打乱。", "No algorithm or setup is available.", "使用できる手順やセットアップがありません。", "冇可用嘅公式或打亂。", "사용 가능한 공식이나 스크램블이 없습니다.", "Aucun algorithme ni mélange n’est disponible.", "No hay ningún algoritmo ni preparación disponible."],
  "wcaPuzzleExtra.unsupportedMove": ["{puzzle} 不支持动作：{move}", "Unsupported {puzzle} move: {move}", "{puzzle} の未対応の回転：{move}", "{puzzle} 唔支援動作：{move}", "지원하지 않는 {puzzle} 회전: {move}", "Mouvement {puzzle} non pris en charge : {move}", "Movimiento de {puzzle} no compatible: {move}"],
  "wcaPuzzleExtra.notationInvalid": ["记号无效，请检查公式：{detail}", "Invalid notation. Check the algorithm: {detail}", "記法が無効です。手順を確認してください：{detail}", "記號無效，請檢查公式：{detail}", "잘못된 표기입니다. 공식을 확인해 주세요: {detail}", "Notation invalide. Vérifiez l’algorithme : {detail}", "Notación no válida. Revisa el algoritmo: {detail}"],
  "wcaPuzzleExtra.squareNotation": ["Square-1 第 {position} 个字符的记号无效。", "Invalid Square-1 notation at character {position}.", "Square-1 の{position}文字目の記法が無効です。", "Square-1 第 {position} 個字元嘅記號無效。", "Square-1 표기의 {position}번째 문자가 잘못되었습니다.", "Notation Square-1 invalide au caractère {position}.", "Notación de Square-1 no válida en el carácter {position}."],
  "wcaPuzzleExtra.angleInvalid": ["Square-1 起手角度标注无效。", "Invalid Square-1 starting-angle annotation.", "Square-1 の開始角度の注記が無効です。", "Square-1 起手角度標註無效。", "Square-1 시작 각도 주석이 잘못되었습니다.", "Annotation d’angle initial Square-1 invalide.", "Anotación del ángulo inicial de Square-1 no válida."],
  "wcaPuzzleExtra.notationLong": ["记号不能超过 {count} 个字符。", "Notation must not exceed {count} characters.", "記法は{count}文字以内にしてください。", "記號唔可以超過 {count} 個字元。", "표기는 {count}자를 초과할 수 없습니다.", "La notation ne doit pas dépasser {count} caractères.", "La notación no debe superar {count} caracteres."],
  "wcaPuzzleExtra.playerUnavailable": ["播放器初始化失败，请重新打开后重试。", "Player initialization failed. Reopen it to retry.", "プレーヤーを初期化できません。開き直してください。", "播放器初始化失敗，請重新開啟再試。", "플레이어를 초기화하지 못했습니다. 다시 열어 주세요.", "Échec de l’initialisation du lecteur. Rouvrez-le pour réessayer.", "No se pudo iniciar el reproductor. Vuelve a abrirlo."],
  "wcaPuzzleExtra.rotationInvalid": ["整体转动无效。", "Invalid whole-cube rotation.", "持ち替えが無効です。", "整體轉動無效。", "큐브 전체 회전이 잘못되었습니다.", "Rotation globale du cube invalide.", "Rotación de todo el cubo no válida."],
  "wcaPuzzleExtra.transitionInvalid": ["过渡转体设置无效。", "Invalid transition rotation setting.", "つなぎの持ち替え設定が無効です。", "過渡轉體設定無效。", "연결 회전 설정이 잘못되었습니다.", "Paramètre de rotation de transition invalide.", "Ajuste de rotación de transición no válido."],
  "wcaPuzzleExtra.stateMismatch": ["内部状态校验失败，请重试。", "Internal state validation failed. Try again.", "内部状態の検証に失敗しました。再試行してください。", "內部狀態驗證失敗，請再試。", "내부 상태 검증에 실패했습니다. 다시 시도해 주세요.", "Échec de la validation de l’état interne. Réessayez.", "Falló la validación del estado interno. Vuelve a intentarlo."],
  "wcaPuzzleExtra.syntax": ["公式语法错误，请检查括号、重复次数及动作记号。", "Invalid algorithm syntax. Check brackets, repetitions and move notation.", "手順の構文が不正です。括弧、繰り返し回数、回転記号を確認してください。", "公式語法有錯，請檢查括號、重複次數同動作記號。", "공식 문법이 잘못되었습니다. 괄호, 반복 횟수, 회전 표기를 확인하세요.", "Syntaxe invalide. Vérifiez les parenthèses, répétitions et mouvements.", "Sintaxis no válida. Revisa los paréntesis, las repeticiones y los movimientos."],
  "wcaPuzzleExtra.tracked": ["已记录", "Tracked", "記録済み", "已記錄", "기록됨", "Suivi", "Registrados"],
  "wcaPuzzleExtra.groups": ["{count} 个分组", "{count} groups", "{count} グループ", "{count} 個分組", "그룹 {count}개", "{count} groupes", "{count} grupos"],
  "wcaPuzzleExtra.q1": ["25%（Q1）：25% 的成绩比它快，代表较好成绩边界。", "25% (Q1): 25% of results are faster, marking the faster boundary.", "25%（Q1）：成績の25%がこれより速く、速い側の境界を示します。", "25%（Q1）：25% 嘅成績比佢快，代表較好成績嘅邊界。", "25%(Q1): 기록의 25%가 이보다 빠르며 빠른 쪽 경계를 나타냅니다.", "25 % (Q1) : 25 % des résultats sont plus rapides ; c’est la borne des meilleures performances.", "25 % (Q1): el 25 % de los resultados son más rápidos; marca el límite de los mejores tiempos."],
  "wcaPuzzleExtra.median": ["50%（中位数）：一半成绩比它快，反映典型水平。", "50% (median): half the results are faster, representing a typical result.", "50%（中央値）：成績の半分がこれより速く、典型的な水準を表します。", "50%（中位數）：一半成績比佢快，反映一般水平。", "50%(중앙값): 기록의 절반이 이보다 빠르며 대표적인 수준을 보여 줍니다.", "50 % (médiane) : la moitié des résultats sont plus rapides ; elle reflète le niveau habituel.", "50 % (mediana): la mitad de los resultados son más rápidos; refleja el nivel habitual."],
  "wcaPuzzleExtra.q3": ["75%（Q3）：75% 的成绩比它快，代表较差成绩边界。", "75% (Q3): 75% of results are faster, marking the slower boundary.", "75%（Q3）：成績の75%がこれより速く、遅い側の境界を示します。", "75%（Q3）：75% 嘅成績比佢快，代表較差成績嘅邊界。", "75%(Q3): 기록의 75%가 이보다 빠르며 느린 쪽 경계를 나타냅니다.", "75 % (Q3) : 75 % des résultats sont plus rapides ; c’est la borne des performances plus lentes.", "75 % (Q3): el 75 % de los resultados son más rápidos; marca el límite de los tiempos más lentos."],
  "wcaPuzzleExtra.distributionHint": ["用于评估成绩的稳定性与分布趋势。", "Use these values to assess consistency and the distribution of results.", "成績の安定性と分布の傾向を評価できます。", "用嚟評估成績嘅穩定性同分佈趨勢。", "기록의 안정성과 분포 추세를 평가하는 데 사용합니다.", "Ces valeurs permettent d’évaluer la régularité et la distribution des résultats.", "Estos valores permiten evaluar la regularidad y la distribución de los resultados."],
  "wcaPuzzleExtra.province.Beijing": ["北京市", "Beijing", "北京市", "北京市", "베이징시", "Pékin", "Pekín"],
  "wcaPuzzleExtra.province.Tianjin": ["天津市", "Tianjin", "天津市", "天津市", "톈진시", "Tianjin", "Tianjín"],
  "wcaPuzzleExtra.province.Hebei": ["河北省", "Hebei", "河北省", "河北省", "허베이성", "Hebei", "Hebei"],
  "wcaPuzzleExtra.province.Shanxi": ["山西省", "Shanxi", "山西省", "山西省", "산시성", "Shanxi", "Shanxi"],
  "wcaPuzzleExtra.province.Inner Mongolia": ["内蒙古自治区", "Inner Mongolia", "内モンゴル自治区", "內蒙古自治區", "네이멍구 자치구", "Mongolie-Intérieure", "Mongolia Interior"],
  "wcaPuzzleExtra.province.Liaoning": ["辽宁省", "Liaoning", "遼寧省", "遼寧省", "랴오닝성", "Liaoning", "Liaoning"],
  "wcaPuzzleExtra.province.Jilin": ["吉林省", "Jilin", "吉林省", "吉林省", "지린성", "Jilin", "Jilin"],
  "wcaPuzzleExtra.province.Heilongjiang": ["黑龙江省", "Heilongjiang", "黒竜江省", "黑龍江省", "헤이룽장성", "Heilongjiang", "Heilongjiang"],
  "wcaPuzzleExtra.province.Shanghai": ["上海市", "Shanghai", "上海市", "上海市", "상하이시", "Shanghai", "Shanghái"],
  "wcaPuzzleExtra.province.Jiangsu": ["江苏省", "Jiangsu", "江蘇省", "江蘇省", "장쑤성", "Jiangsu", "Jiangsu"],
  "wcaPuzzleExtra.province.Zhejiang": ["浙江省", "Zhejiang", "浙江省", "浙江省", "저장성", "Zhejiang", "Zhejiang"],
  "wcaPuzzleExtra.province.Anhui": ["安徽省", "Anhui", "安徽省", "安徽省", "안후이성", "Anhui", "Anhui"],
  "wcaPuzzleExtra.province.Fujian": ["福建省", "Fujian", "福建省", "福建省", "푸젠성", "Fujian", "Fujian"],
  "wcaPuzzleExtra.province.Jiangxi": ["江西省", "Jiangxi", "江西省", "江西省", "장시성", "Jiangxi", "Jiangxi"],
  "wcaPuzzleExtra.province.Shandong": ["山东省", "Shandong", "山東省", "山東省", "산둥성", "Shandong", "Shandong"],
  "wcaPuzzleExtra.province.Henan": ["河南省", "Henan", "河南省", "河南省", "허난성", "Henan", "Henan"],
  "wcaPuzzleExtra.province.Hubei": ["湖北省", "Hubei", "湖北省", "湖北省", "후베이성", "Hubei", "Hubei"],
  "wcaPuzzleExtra.province.Hunan": ["湖南省", "Hunan", "湖南省", "湖南省", "후난성", "Hunan", "Hunan"],
  "wcaPuzzleExtra.province.Guangdong": ["广东省", "Guangdong", "広東省", "廣東省", "광둥성", "Guangdong", "Cantón"],
  "wcaPuzzleExtra.province.Guangxi": ["广西壮族自治区", "Guangxi", "広西チワン族自治区", "廣西壯族自治區", "광시 좡족 자치구", "Guangxi", "Guangxi"],
  "wcaPuzzleExtra.province.Hainan": ["海南省", "Hainan", "海南省", "海南省", "하이난성", "Hainan", "Hainan"],
  "wcaPuzzleExtra.province.Chongqing": ["重庆市", "Chongqing", "重慶市", "重慶市", "충칭시", "Chongqing", "Chongqing"],
  "wcaPuzzleExtra.province.Sichuan": ["四川省", "Sichuan", "四川省", "四川省", "쓰촨성", "Sichuan", "Sichuan"],
  "wcaPuzzleExtra.province.Guizhou": ["贵州省", "Guizhou", "貴州省", "貴州省", "구이저우성", "Guizhou", "Guizhou"],
  "wcaPuzzleExtra.province.Yunnan": ["云南省", "Yunnan", "雲南省", "雲南省", "윈난성", "Yunnan", "Yunnan"],
  "wcaPuzzleExtra.province.Tibet": ["西藏自治区", "Tibet", "チベット自治区", "西藏自治區", "시짱 자치구", "Tibet", "Tíbet"],
  "wcaPuzzleExtra.province.Shaanxi": ["陕西省", "Shaanxi", "陝西省", "陝西省", "산시성(섬서)", "Shaanxi", "Shaanxi"],
  "wcaPuzzleExtra.province.Gansu": ["甘肃省", "Gansu", "甘粛省", "甘肅省", "간쑤성", "Gansu", "Gansu"],
  "wcaPuzzleExtra.province.Qinghai": ["青海省", "Qinghai", "青海省", "青海省", "칭하이성", "Qinghai", "Qinghai"],
  "wcaPuzzleExtra.province.Ningxia": ["宁夏回族自治区", "Ningxia", "寧夏回族自治区", "寧夏回族自治區", "닝샤 후이족 자치구", "Ningxia", "Ningxia"],
  "wcaPuzzleExtra.province.Xinjiang": ["新疆维吾尔自治区", "Xinjiang", "新疆ウイグル自治区", "新疆維吾爾自治區", "신장 위구르 자치구", "Xinjiang", "Xinjiang"],
  "wcaPuzzleExtra.province.Taiwan": ["台湾省", "Taiwan", "台湾省", "台灣省", "타이완성", "Taïwan", "Taiwán"],
  "wcaPuzzleExtra.province.Hong Kong": ["香港特别行政区", "Hong Kong", "香港特別行政区", "香港特別行政區", "홍콩 특별행정구", "Hong Kong", "Hong Kong"],
  "wcaPuzzleExtra.province.Macau": ["澳门特别行政区", "Macau", "マカオ特別行政区", "澳門特別行政區", "마카오 특별행정구", "Macao", "Macao"],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type WcaPuzzleExtraKey = keyof typeof messages;
function catalog(column: number): Record<WcaPuzzleExtraKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<WcaPuzzleExtraKey, string>;
}
export const wcaPuzzleExtraZhCN = catalog(0);
export const wcaPuzzleExtraEnUS = catalog(1);
export const wcaPuzzleExtraJa = catalog(2);
export const wcaPuzzleExtraYue = catalog(3);
export const wcaPuzzleExtraKo = catalog(4);
export const wcaPuzzleExtraFr = catalog(5);
export const wcaPuzzleExtraEs = catalog(6);
const catalogs: Record<Locale, Record<WcaPuzzleExtraKey, string>> = {
  "zh-CN": wcaPuzzleExtraZhCN, "en-US": wcaPuzzleExtraEnUS, ja: wcaPuzzleExtraJa,
  "yue-Hant-HK": wcaPuzzleExtraYue, ko: wcaPuzzleExtraKo, fr: wcaPuzzleExtraFr, es: wcaPuzzleExtraEs,
};
export function translateWcaPuzzleExtra(locale: Locale, key: WcaPuzzleExtraKey, params: Record<string, string | number> = {}): string {
  return formatMessage(locale, key, catalogs[locale][key], params);
}
