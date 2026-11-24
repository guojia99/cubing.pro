import { formatMessage } from "../formatMessage";
import { isLocale } from "../locales";

// Columns: Simplified Chinese, English, Japanese, Hong Kong Cantonese,
// Korean, French, Spanish. Keep every column explicit: no English fallback.
const messages = {
  "siteContent.githubRepository": ["GitHub 仓库", "GitHub repository", "GitHub リポジトリ", "GitHub 倉庫", "GitHub 저장소", "Dépôt GitHub", "Repositorio de GitHub"],
  "siteContent.githubDescription": ["查看源码、反馈问题或参与贡献", "Explore the source, report issues or contribute", "ソースコードの閲覧、不具合の報告、開発への参加", "睇源碼、回報問題或者參與貢獻", "소스 코드 보기, 문제 제보 및 기여하기", "Consultez le code, signalez un problème ou contribuez", "Consulta el código, informa de problemas o contribuye"],
  "siteContent.competitionDirectory": ["线上比赛、成绩排名与站内纪录。", "Online competitions, rankings and results.", "オンライン大会、ランキング、サイト内記録。", "線上比賽、成績排名同站內紀錄。", "온라인 대회, 순위와 사이트 기록.", "Compétitions en ligne, classements et records du site.", "Competiciones en línea, clasificaciones y récords del sitio."],
  "siteContent.competitions": ["比赛", "Competitions", "大会", "比賽", "대회", "Compétitions", "Competiciones"],
  "siteContent.rankings": ["排名", "Rankings", "ランキング", "排名", "순위", "Classements", "Clasificaciones"],
  "siteContent.records": ["纪录", "Records", "記録", "紀錄", "기록", "Records", "Récords"],
  "siteContent.players": ["选手", "Players", "選手", "選手", "선수", "Participants", "Participantes"],
  "siteContent.competitionsDesc": ["查看进行中的比赛与往期成绩。", "Browse current events and past results.", "開催中の大会や過去の結果を確認。", "查看進行中嘅比賽同過往成績。", "진행 중인 대회와 지난 결과를 확인하세요.", "Consultez les compétitions actuelles et les résultats passés.", "Consulta competiciones actuales y resultados anteriores."],
  "siteContent.rankingsDesc": ["按项目查看选手排名与综合表现。", "Compare players across competition events.", "種目別の選手ランキングと総合成績を確認。", "按項目查看選手排名同綜合表現。", "종목별 선수 순위와 종합 성적을 비교하세요.", "Comparez les participants par épreuve et au classement général.", "Compara participantes por prueba y rendimiento general."],
  "siteContent.recordsDesc": ["查阅各项目的当前与历史纪录。", "Explore current and historical records.", "各種目の最新記録と歴代記録を調べる。", "查閱各項目嘅現時同歷史紀錄。", "종목별 현재 기록과 역대 기록을 살펴보세요.", "Explorez les records actuels et historiques.", "Explora récords actuales e históricos."],
  "siteContent.playersDesc": ["查找选手资料、参赛经历与成绩。", "Find player profiles and competition results.", "選手情報、出場履歴、成績を検索。", "搵選手資料、參賽經歷同成績。", "선수 프로필, 참가 이력과 성적을 찾아보세요.", "Recherchez les profils, participations et résultats.", "Busca perfiles, participaciones y resultados."],
  "siteContent.wcaDirectory": ["赛事信息、选手成绩与数据分析。", "Competition schedules, player results and statistics.", "大会情報、選手の成績、データ分析。", "賽事資訊、選手成績同數據分析。", "대회 정보, 선수 성적과 통계 분석.", "Calendriers, résultats des participants et statistiques.", "Calendarios, resultados y estadísticas."],
  "siteContent.wcaCompetitionsDesc": ["按地区和时间查找 WCA 比赛。", "Find WCA competitions by place and date.", "地域と日付から WCA 大会を検索。", "按地區同時間搵 WCA 比賽。", "지역과 날짜로 WCA 대회를 찾아보세요.", "Trouvez des compétitions WCA par lieu et date.", "Busca competiciones WCA por lugar y fecha."],
  "siteContent.wcaPlayersDesc": ["搜索 WCA 选手资料与个人成绩。", "Search WCA profiles and personal results.", "WCA 選手情報と個人成績を検索。", "搜尋 WCA 選手資料同個人成績。", "WCA 선수 프로필과 개인 성적을 검색하세요.", "Recherchez les profils WCA et résultats individuels.", "Busca perfiles WCA y resultados personales."],
  "siteContent.statistics": ["统计", "Statistics", "統計", "統計", "통계", "Statistiques", "Estadísticas"],
  "siteContent.statisticsDesc": ["浏览历史排名与多项目统计。", "Explore rankings and event statistics.", "歴代ランキングや複数種目の統計を見る。", "瀏覽歷史排名同多項目統計。", "역대 순위와 종목별 통계를 살펴보세요.", "Explorez les classements historiques et statistiques par épreuve.", "Explora clasificaciones históricas y estadísticas por prueba."],
  "siteContent.proportion": ["比例估算", "Proportion estimation", "割合の推定", "比例估算", "비율 추정", "Estimation des proportions", "Estimación de proporciones"],
  "siteContent.proportionDesc": ["比较不同项目成绩之间的比例。", "Compare performance ratios across events.", "異なる種目の成績の比率を比較。", "比較唔同項目成績之間嘅比例。", "서로 다른 종목의 성적 비율을 비교하세요.", "Comparez les proportions des résultats entre épreuves.", "Compara proporciones de resultados entre pruebas."],
  "siteContent.algsDirectory": ["常用二阶与三阶公式分类。", "Common 2×2 and 3×3 algorithm sets.", "よく使う 2×2・3×3 の手順集。", "常用二階同三階公式分類。", "자주 쓰는 2×2 및 3×3 공식 모음.", "Collections d’algorithmes courants pour 2×2 et 3×3.", "Colecciones de algoritmos habituales de 2×2 y 3×3."],
  "siteContent.allAlgs": ["全部公式分类", "All algorithms", "すべての手順カテゴリー", "全部公式分類", "모든 공식 분류", "Tous les algorithmes", "Todos los algoritmos"],
  "siteContent.cllDesc": ["二阶顶层角块还原公式。", "2×2 last-layer corner algorithms.", "2×2 の最終層コーナーを揃える手順。", "二階頂層角塊還原公式。", "2×2 마지막 층 코너 공식.", "Algorithmes des coins de la dernière couche du 2×2.", "Algoritmos de esquinas de la última capa del 2×2."],
  "siteContent.egDesc": ["二阶 EG-1 公式查询与练习。", "2×2 EG-1 algorithms and practice.", "2×2 EG-1 の手順検索と練習。", "二階 EG-1 公式查詢同練習。", "2×2 EG-1 공식 검색 및 연습.", "Algorithmes EG-1 du 2×2 et entraînement.", "Algoritmos EG-1 de 2×2 y práctica."],
  "siteContent.ollDesc": ["三阶顶层朝向还原公式。", "3×3 last-layer orientation algorithms.", "3×3 の最終層の向きを揃える手順。", "三階頂層朝向還原公式。", "3×3 마지막 층 방향 공식.", "Algorithmes d’orientation de la dernière couche du 3×3.", "Algoritmos de orientación de la última capa del 3×3."],
  "siteContent.pllDesc": ["三阶顶层排列还原公式。", "3×3 last-layer permutation algorithms.", "3×3 の最終層の位置を揃える手順。", "三階頂層排列還原公式。", "3×3 마지막 층 순열 공식.", "Algorithmes de permutation de la dernière couche du 3×3.", "Algoritmos de permutación de la última capa del 3×3."],
  "siteContent.drawDirectory": ["绘制魔方状态并导出配图。", "Create puzzle diagrams and export images.", "パズルの状態を描き、画像を書き出す。", "繪製魔方狀態並匯出配圖。", "퍼즐 상태를 그리고 이미지로 내보내세요.", "Créez des schémas de puzzles et exportez les images.", "Crea diagramas de rompecabezas y exporta imágenes."],
  "siteContent.standardCubes": ["正阶魔方", "Standard cubes", "通常のキューブ", "正階魔方", "정규 큐브", "Cubes classiques", "Cubos clásicos"],
  "siteContent.standardCubesDesc": ["使用 VisualCube Plus 绘制正阶魔方。", "Open the VisualCube Plus drawing tool.", "VisualCube Plus で通常のキューブを描画。", "用 VisualCube Plus 繪製正階魔方。", "VisualCube Plus로 정규 큐브를 그려보세요.", "Dessinez des cubes classiques avec VisualCube Plus.", "Dibuja cubos clásicos con VisualCube Plus."],
  "siteContent.sqDesc": ["绘制 SQ-1 形状与贴纸颜色。", "Draw SQ-1 shapes and sticker colors.", "SQ-1 の形状とステッカーの色を描画。", "繪製 SQ-1 形狀同貼紙顏色。", "SQ-1 모양과 스티커 색을 그려보세요.", "Dessinez les formes et couleurs du SQ-1.", "Dibuja formas y colores de pegatinas del SQ-1."],
  "siteContent.minxDesc": ["绘制五魔方状态与公式配图。", "Create diagrams for Megaminx states.", "メガミンクスの状態や手順用の図を作成。", "繪製五魔方狀態同公式配圖。", "메가밍크스 상태와 공식 그림을 만드세요.", "Créez des schémas des états du Megaminx.", "Crea diagramas de estados del Megaminx."],
  "siteContent.skewbDesc": ["绘制 Skewb 状态并导出图片。", "Create and export Skewb diagrams.", "スキューブの状態を描画し、画像を書き出す。", "繪製 Skewb 狀態並匯出圖片。", "스큐브 상태를 그리고 이미지로 내보내세요.", "Créez et exportez des schémas de Skewb.", "Crea y exporta diagramas de Skewb."],
  "siteContent.heroTitle": ["魔方公式、练习与赛事", "Cube algorithms, practice and competitions", "キューブの手順・練習・大会", "魔方公式、練習同賽事", "큐브 공식, 연습과 대회", "Algorithmes, entraînement et compétitions", "Algoritmos, práctica y competiciones"],
  "siteContent.heroIntro": ["公式查询、还原练习、线上比赛与 WCA 数据，常用功能集中在这里。", "Algorithm lookup, solving practice, online competitions and WCA data. Find commonly used features here.", "手順検索、ソルブ練習、オンライン大会、WCA データなど、よく使う機能が揃っています。", "公式查詢、還原練習、線上比賽同 WCA 數據，常用功能集中喺呢度。", "공식 검색, 풀이 연습, 온라인 대회와 WCA 데이터를 한곳에서 만나보세요.", "Recherche d’algorithmes, entraînement, compétitions en ligne et données WCA : retrouvez ici les fonctions essentielles.", "Consulta algoritmos, practica resoluciones y accede a competiciones en línea y datos WCA desde un solo lugar."],
  "siteContent.algsShortcut": ["查询魔方公式，按分类练习。", "Browse algorithms and practise cases.", "キューブの手順を調べ、分類別に練習。", "查魔方公式，按分類練習。", "큐브 공식을 찾아보고 유형별로 연습하세요.", "Consultez les algorithmes et entraînez-vous par cas.", "Consulta algoritmos y practica por casos."],
  "siteContent.twoShortcut": ["二阶打乱求解与公式练习。", "Solve 2×2 scrambles and practise.", "2×2 のスクランブルを解き、手順を練習。", "二階打亂求解同公式練習。", "2×2 스크램블을 풀고 공식을 연습하세요.", "Résolvez des mélanges 2×2 et entraînez-vous.", "Resuelve mezclas de 2×2 y practica."],
  "siteContent.frShortcut": ["识别 FR 形态，分析与练习。", "Recognise FR cases and practise.", "FR のケースを見分け、分析して練習。", "識別 FR 形態，分析同練習。", "FR 유형을 식별하고 분석하며 연습하세요.", "Identifiez les cas FR et entraînez-vous.", "Reconoce casos FR, analízalos y practica."],
  "siteContent.eventTools": ["赛事工具", "Competition tools", "大会ツール", "賽事工具", "대회 도구", "Outils de compétition", "Herramientas de competición"],
  "siteContent.events": ["群赛项目", "Events", "競技種目", "群賽項目", "대회 종목", "Épreuves", "Pruebas"],
  "siteContent.adPrice": ["价目表（请联系 Cuberwenjun 获取最新价目表）", "Price list (contact Cuberwenjun for current prices)", "料金表（最新料金は Cuberwenjun にお問い合わせください）", "價目表（最新價錢請聯絡 Cuberwenjun）", "가격표 (최신 가격은 Cuberwenjun에 문의하세요)", "Tarifs (contactez Cuberwenjun pour les prix actuels)", "Precios (consulta los precios actuales con Cuberwenjun)"],
  "siteContent.adTuning": ["2024LUOW02 · 高水平手感调试", "2024LUOW02 · Expert cube tuning", "2024LUOW02 · 高度な回転感の調整", "2024LUOW02 · 專業手感調校", "2024LUOW02 · 전문 큐브 튜닝", "2024LUOW02 · Réglage expert des cubes", "2024LUOW02 · Ajuste experto de cubos"],
  "siteContent.adStock": ["热门魔方改造均有存货", "Popular cube modifications in stock", "人気の改造キューブを在庫販売", "熱門改裝魔方有現貨", "인기 개조 큐브 재고 보유", "Modifications populaires disponibles en stock", "Modificaciones populares disponibles"],
  "siteContent.adThree": ["球轴三阶改装示意", "Ball-core 3×3 modification", "ボールコア式 3×3 の改造例", "球軸三階改裝示意", "볼 코어 3×3 개조 예시", "Modification d’un 3×3 à noyau sphérique", "Modificación de 3×3 con núcleo esférico"],
  "siteContent.adFour": ["球轴四阶改装示意", "Ball-core 4×4 modification", "ボールコア式 4×4 の改造例", "球軸四階改裝示意", "볼 코어 4×4 개조 예시", "Modification d’un 4×4 à noyau sphérique", "Modificación de 4×4 con núcleo esférico"],
  "siteContent.adShowcase": ["改装魔方展示", "Custom cube showcase", "改造キューブの展示", "改裝魔方展示", "개조 큐브 전시", "Présentation des cubes modifiés", "Galería de cubos modificados"],
  "siteContent.cancel": ["取消", "Cancel", "キャンセル", "取消", "취소", "Annuler", "Cancelar"],
  "siteContent.close": ["关闭", "Close", "閉じる", "關閉", "닫기", "Fermer", "Cerrar"],
  "siteContent.preferences": ["偏好设置", "Preferences", "環境設定", "偏好設定", "환경 설정", "Préférences", "Preferencias"],
  "siteContent.releaseNotes": ["更新说明", "Release notes", "更新履歴", "更新紀錄", "업데이트 내역", "Notes de version", "Notas de versión"],
  "siteContent.community": ["社区推荐", "Community spotlight", "コミュニティのおすすめ", "社群推介", "커뮤니티 추천", "À la une de la communauté", "Destacados de la comunidad"],
  "siteContent.partners": ["合作伙伴", "Partners", "パートナー", "合作夥伴", "협력 파트너", "Partenaires", "Colaboradores"],
  "siteContent.aroundCommunity": ["社区资源", "Around the community", "コミュニティの情報", "社群資源", "커뮤니티 자료", "Ressources communautaires", "Recursos de la comunidad"],
  "siteContent.support": ["支持 Cubing Pro", "Support Cubing Pro", "Cubing Pro を支援", "支持 Cubing Pro", "Cubing Pro 후원", "Soutenir Cubing Pro", "Apoyar a Cubing Pro"],
  "siteContent.withThanks": ["衷心感谢", "With thanks", "感謝を込めて", "衷心多謝", "감사의 마음을 담아", "Avec nos remerciements", "Con nuestro agradecimiento"],
  "siteContent.carousel": ["轮播", "Carousel", "カルーセル", "輪播", "슬라이드 쇼", "Carrousel", "Carrusel"],
  "siteContent.slide": ["广告 {count}", "Slide {count}", "広告 {count}", "廣告 {count}", "광고 {count}", "Diapositive {count}", "Diapositiva {count}"],
  "siteContent.details": ["查看详情", "Details", "詳細を見る", "睇詳情", "상세 보기", "Voir les détails", "Ver detalles"],
  "siteContent.play": ["播放", "Play", "再生", "播放", "재생", "Lire", "Reproducir"],
  "siteContent.pause": ["暂停", "Pause", "一時停止", "暫停", "일시 정지", "Mettre en pause", "Pausar"],
  "siteContent.cuberwenjun": ["俊改魔方", "Cuberwenjun Custom Cubes", "Cuberwenjun カスタムキューブ", "俊改魔方", "Cuberwenjun 맞춤 큐브", "Cubes personnalisés Cuberwenjun", "Cubos personalizados Cuberwenjun"],
  "siteContent.modification": ["专业魔方改装", "Professional cube modification", "キューブ改造の専門サービス", "專業魔方改裝", "전문 큐브 개조", "Modification professionnelle de cubes", "Modificación profesional de cubos"],
  "siteContent.modificationService": ["专业魔方改装服务", "Professional cube modification services", "キューブ改造サービス", "專業魔方改裝服務", "전문 큐브 개조 서비스", "Services de modification de cubes", "Servicios de modificación de cubos"],
  "siteContent.adContact": ["微信 / 闲鱼：Cuberwenjun", "WeChat / Xianyu: Cuberwenjun", "WeChat / Xianyu：Cuberwenjun", "微信 / 閒魚：Cuberwenjun", "위챗 / 셴위: Cuberwenjun", "WeChat / Xianyu : Cuberwenjun", "WeChat / Xianyu: Cuberwenjun"],
  "siteContent.adWechat": ["微信扫码联系 Cuberwenjun", "Scan to contact Cuberwenjun on WeChat", "WeChat でスキャンして Cuberwenjun に連絡", "微信掃碼聯絡 Cuberwenjun", "위챗 QR 코드를 스캔하여 Cuberwenjun에 문의", "Scannez pour contacter Cuberwenjun sur WeChat", "Escanea para contactar con Cuberwenjun en WeChat"],
  "siteContent.adTaobao": ["前往淘宝", "View on Taobao", "淘宝で見る", "前往淘寶", "타오바오에서 보기", "Voir sur Taobao", "Ver en Taobao"],
  "siteContent.adProducts": ["精选改装魔方", "Featured custom cubes", "おすすめの改造キューブ", "精選改裝魔方", "추천 개조 큐브", "Sélection de cubes personnalisés", "Cubos personalizados destacados"],
  "siteContent.adPreviewHint": ["点击图片查看大图，选好心仪魔方后可前往淘宝。", "Click any image to enlarge it. Visit Taobao to shop your chosen cube.", "画像をクリックして拡大できます。購入は淘宝でご覧ください。", "點擊圖片睇大圖，揀好心儀魔方後可前往淘寶。", "이미지를 클릭하면 확대됩니다. 구매는 타오바오에서 확인하세요.", "Cliquez sur une image pour l’agrandir. Retrouvez le cube de votre choix sur Taobao.", "Haz clic en una imagen para ampliarla. Visita Taobao para comprar tu cubo favorito."],
  "siteContent.adProductFour": ["俊改全新 8 磁球轴傲速 V7 四阶磁力魔方", "Cuberwenjun AoSu V7 4×4 · 8-magnet ball core", "Cuberwenjun AoSu V7 4×4・8 磁石ボールコア", "俊改全新 8 磁球軸傲速 V7 四階磁力魔方", "Cuberwenjun AoSu V7 4×4 · 8자석 볼 코어", "Cuberwenjun AoSu V7 4×4 · noyau à 8 aimants", "Cuberwenjun AoSu V7 4×4 · núcleo de 8 imanes"],
  "siteContent.adProductFive": ["俊改全新 8 磁球轴傲创 V6 五阶磁力魔方", "Cuberwenjun AoChuang V6 5×5 · 8-magnet ball core", "Cuberwenjun AoChuang V6 5×5・8 磁石ボールコア", "俊改全新 8 磁球軸傲創 V6 五階磁力魔方", "Cuberwenjun AoChuang V6 5×5 · 8자석 볼 코어", "Cuberwenjun AoChuang V6 5×5 · noyau à 8 aimants", "Cuberwenjun AoChuang V6 5×5 · núcleo de 8 imanes"],
  "siteContent.adProductSix": ["俊改全新双轨 / 三轨傲世 V4 六阶磁力魔方", "Cuberwenjun AoShi V4 6×6 · dual / triple track", "Cuberwenjun AoShi V4 6×6・ダブル / トリプルトラック", "俊改全新雙軌 / 三軌傲世 V4 六階磁力魔方", "Cuberwenjun AoShi V4 6×6 · 듀얼 / 트리플 트랙", "Cuberwenjun AoShi V4 6×6 · double / triple piste", "Cuberwenjun AoShi V4 6×6 · doble / triple pista"],
  "siteContent.adProductSeven": ["俊改全新三轨傲赋 V5 七阶磁力魔方", "Cuberwenjun AoFu V5 7×7 · triple track", "Cuberwenjun AoFu V5 7×7・トリプルトラック", "俊改全新三軌傲賦 V5 七階磁力魔方", "Cuberwenjun AoFu V5 7×7 · 트리플 트랙", "Cuberwenjun AoFu V5 7×7 · triple piste", "Cuberwenjun AoFu V5 7×7 · triple pista"],
  "siteContent.emptyKey": ["（空）", "(empty)", "（空）", "（空白）", "(비어 있음)", "(vide)", "(vacío)"],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type SiteContentKey = keyof typeof messages;
function catalog(column: number): Record<SiteContentKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<SiteContentKey, string>;
}

export const siteContentZhCN = catalog(0);
export const siteContentEnUS = catalog(1);
export const siteContentJa = catalog(2);
export const siteContentYue = catalog(3);
export const siteContentKo = catalog(4);
export const siteContentFr = catalog(5);
export const siteContentEs = catalog(6);

const catalogs: Record<string, Record<SiteContentKey, string>> = {
  "zh-CN": siteContentZhCN, "en-US": siteContentEnUS, ja: siteContentJa,
  "yue-Hant-HK": siteContentYue, ko: siteContentKo, fr: siteContentFr, es: siteContentEs,
};

// Also usable before the root catalogs have been merged by the integration task.
export function getSiteContent(locale: string) {
  const normalized = isLocale(locale) ? locale : "zh-CN";
  return (key: SiteContentKey, params: Record<string, string | number> = {}) => {
    return formatMessage(normalized, key, catalogs[normalized][key], params);
  };
}
