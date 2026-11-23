import type { Locale } from "../locales";

type Translations = readonly [string, string, string, string, string, string, string];

// Column order: zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es.
const messages = {
  "shell.notFound.title": ["这里暂时没有内容", "Nothing here yet", "ページが見つかりません", "呢度暫時冇內容", "페이지를 찾을 수 없습니다", "Aucun contenu ici pour le moment", "Todavía no hay contenido aquí"],
  "shell.notFound.description": ["页面可能已移动，或尚未开放。回到首页继续探索公式、赛事与工具。", "This page may have moved or is not available yet. Return home to explore algorithms, competitions and tools.", "ページが移動したか、まだ公開されていません。ホームに戻って、手順や大会、ツールをご覧ください。", "頁面可能搬咗，或者仲未開放。返首頁繼續探索公式、比賽同工具。", "페이지가 이동했거나 아직 공개되지 않았습니다. 홈에서 해법, 대회, 도구를 살펴보세요.", "Cette page a peut-être été déplacée ou n’est pas encore disponible. Retrouvez les algorithmes, compétitions et outils à l’accueil.", "Es posible que la página se haya movido o aún no esté disponible. Vuelve al inicio para explorar algoritmos, competiciones y herramientas."],
  "shell.home": ["返回首页", "Back to home", "ホームに戻る", "返首頁", "홈으로 돌아가기", "Retour à l’accueil", "Volver al inicio"],
  "shell.algorithms": ["浏览公式库", "Browse algorithms", "手順を見る", "睇公式庫", "해법 둘러보기", "Voir les algorithmes", "Explorar algoritmos"],
  "shell.placeholder.badge": ["尚未开放", "Coming later", "近日公開", "尚未開放", "공개 예정", "À venir", "Próximamente"],
  "shell.placeholder.description": ["这个页面尚未实现。可以先浏览公式库，或回到首页探索其他工具。", "This page is not available yet. Explore the algorithm library or return home.", "このページは準備中です。手順ライブラリを見るか、ホームに戻って他のツールをご利用ください。", "呢個頁面仲未開放。可以先睇公式庫，或者返首頁探索其他工具。", "이 페이지는 준비 중입니다. 해법 라이브러리를 둘러보거나 홈에서 다른 도구를 살펴보세요.", "Cette page est en préparation. Consultez la bibliothèque d’algorithmes ou retournez à l’accueil.", "Esta página está en preparación. Explora la biblioteca de algoritmos o vuelve al inicio."],
  "shell.colorMode.toggle": ["切换颜色模式", "Toggle color mode", "カラーモードを切り替え", "切換顏色模式", "색상 모드 전환", "Changer le mode de couleur", "Cambiar el modo de color"],
  "shell.metadata.description": ["{title} · Cubing Pro 魔方社区与工具平台。探索公式、练习工具与赛事数据。", "{title} · Cubing Pro, a speedcubing community and toolkit. Explore algorithms, practice tools and competition data.", "{title} · Cubing Pro はスピードキューブのコミュニティとツールのプラットフォームです。手順、練習ツール、大会データをご覧ください。", "{title} · Cubing Pro 魔方社群同工具平台。探索公式、練習工具同比賽數據。", "{title} · Cubing Pro 스피드큐빙 커뮤니티 및 도구 플랫폼. 해법, 연습 도구, 대회 데이터를 살펴보세요.", "{title} · Cubing Pro, communauté et outils de speedcubing. Découvrez les algorithmes, les outils d’entraînement et les données de compétition.", "{title} · Cubing Pro, comunidad y herramientas de speedcubing. Explora algoritmos, herramientas de práctica y datos de competiciones."],
} as const satisfies Record<string, Translations>;

const routeNames = {
  welcome: ["欢迎页", "Welcome", "ホーム", "歡迎頁", "홈", "Accueil", "Inicio"],
  "buy-coffee": ["赞助", "Support us", "支援", "贊助", "후원", "Nous soutenir", "Apóyanos"],
  changelog: ["更新日志", "Changelog", "更新履歴", "更新日誌", "업데이트 기록", "Journal des modifications", "Registro de cambios"],
  "external-links": ["外链", "External links", "外部リンク", "外部連結", "외부 링크", "Liens externes", "Enlaces externos"],
  advertisement: ["广告", "Advertisements", "広告", "廣告", "광고", "Publicités", "Anuncios"],
  settings: ["设置", "Settings", "設定", "設定", "설정", "Paramètres", "Configuración"],
  "user-kv-data": ["用户 KV", "User data", "ユーザーデータ", "用戶資料", "사용자 데이터", "Données utilisateur", "Datos de usuario"],
  login: ["WCA 登录", "WCA sign in", "WCA ログイン", "WCA 登入", "WCA 로그인", "Connexion WCA", "Iniciar sesión con WCA"],
  "auth-callback": ["WCA 回调", "WCA authentication", "WCA 認証", "WCA 驗證", "WCA 인증", "Authentification WCA", "Autenticación WCA"],
  "old-login": ["旧版登录", "Legacy sign in", "旧ログイン", "舊版登入", "이전 로그인", "Ancienne connexion", "Inicio de sesión anterior"],
  "user-profile": ["个人中心", "My profile", "プロフィール", "個人中心", "내 프로필", "Mon profil", "Mi perfil"],
  "admin-organizers": ["主办首页", "Organizer home", "主催者ホーム", "主辦首頁", "주최자 홈", "Accueil organisateur", "Inicio del organizador"],
  "admin-organizers-comps": ["主办比赛列表", "Organizer competitions", "主催大会一覧", "主辦比賽列表", "주최 대회 목록", "Compétitions de l’organisateur", "Competiciones del organizador"],
  "admin-organizers-create": ["创建比赛", "Create competition", "大会を作成", "建立比賽", "대회 만들기", "Créer une compétition", "Crear competición"],
  "admin-organizers-details": ["主办详情", "Organizer details", "主催者詳細", "主辦詳情", "주최자 정보", "Détails de l’organisateur", "Detalles del organizador"],
  "admin-organizers-group": ["群组管理", "Group management", "グループ管理", "群組管理", "그룹 관리", "Gestion des groupes", "Gestión de grupos"],
  "admin-organizers-result": ["成绩管理", "Result management", "記録管理", "成績管理", "기록 관리", "Gestion des résultats", "Gestión de resultados"],
  "admin-organizers-list": ["主办团队", "Organizer teams", "主催チーム", "主辦團隊", "주최 팀", "Équipes organisatrices", "Equipos organizadores"],
  "admin-organizers-comp-result": ["录入成绩", "Enter results", "記録入力", "輸入成績", "기록 입력", "Saisir les résultats", "Introducir resultados"],
  "admin-admins": ["后台首页", "Admin home", "管理ホーム", "後台首頁", "관리자 홈", "Accueil administration", "Inicio de administración"],
  "admin-competition-approvals": ["群赛审批", "Competition approvals", "大会承認", "群賽審批", "대회 승인", "Approbation des compétitions", "Aprobación de competiciones"],
  "admin-competition-manage": ["群赛管理", "Competition management", "大会管理", "群賽管理", "대회 관리", "Gestion des compétitions", "Gestión de competiciones"],
  "admin-users": ["用户管理", "User management", "ユーザー管理", "用戶管理", "사용자 관리", "Gestion des utilisateurs", "Gestión de usuarios"],
  "admin-manage-organizers": ["管理主办", "Manage organizers", "主催者管理", "管理主辦", "주최자 관리", "Gérer les organisateurs", "Gestionar organizadores"],
  "admin-manage-groups": ["管理群组", "Manage groups", "グループ管理", "管理群組", "그룹 관리", "Gérer les groupes", "Gestionar grupos"],
  "admin-diy-ranking": ["DIY 榜单", "Custom rankings", "カスタムランキング", "自訂排行榜", "사용자 지정 순위", "Classements personnalisés", "Clasificaciones personalizadas"],
  "admin-acknowledgments": ["致谢管理", "Acknowledgments management", "謝辞管理", "鳴謝管理", "감사 명단 관리", "Gestion des remerciements", "Gestión de agradecimientos"],
  "admin-advertisements": ["广告管理", "Advertisements", "広告管理", "廣告管理", "광고 관리", "Gestion des publicités", "Gestión de anuncios"],
  "admin-other-links": ["外链管理", "External link management", "外部リンク管理", "外部連結管理", "외부 링크 관리", "Gestion des liens externes", "Gestión de enlaces externos"],
  "admin-sports": ["体育赛事", "Sports competitions", "スポーツ大会", "體育賽事", "스포츠 대회", "Compétitions sportives", "Competiciones deportivas"],
  "admin-sports-events": ["体育项目", "Sports events", "スポーツ種目", "體育項目", "스포츠 종목", "Disciplines sportives", "Disciplinas deportivas"],
  "algs-list": ["公式列表", "Algorithms", "手順一覧", "公式列表", "해법 목록", "Algorithmes", "Algoritmos"],
  "algs-detail": ["公式详情", "Algorithm details", "手順詳細", "公式詳情", "해법 상세", "Détails des algorithmes", "Detalles de algoritmos"],
  recipes: ["菜谱", "Recipes", "レシピ", "食譜", "레시피", "Recettes", "Recetas"],
  "recipe-detail": ["菜谱详情", "Recipe details", "レシピ詳細", "食譜詳情", "레시피 상세", "Détails de la recette", "Detalles de la receta"],
  "kitchen-skills": ["厨房技巧", "Kitchen skills", "料理のコツ", "廚房技巧", "요리 팁", "Techniques de cuisine", "Técnicas de cocina"],
  "kitchen-skill-detail": ["技巧详情", "Kitchen skill details", "料理のコツの詳細", "技巧詳情", "요리 팁 상세", "Détails de la technique", "Detalles de la técnica"],
  cocktails: ["鸡尾酒", "Cocktails", "カクテル", "雞尾酒", "칵테일", "Cocktails", "Cócteles"],
  "cocktail-detail": ["鸡尾酒详情", "Cocktail details", "カクテル詳細", "雞尾酒詳情", "칵테일 상세", "Détails du cocktail", "Detalles del cóctel"],
  "tool-bld-d": ["BLD 练习", "Blindfolded practice", "目隠し練習", "盲解練習", "블라인드 연습", "Entraînement à l’aveugle", "Práctica a ciegas"],
  "tool-bld-pingyin": ["BLD 拼音", "BLD pinyin", "目隠し用ピンイン", "盲解拼音", "블라인드 병음", "Pinyin pour la résolution à l’aveugle", "Pinyin para resolución a ciegas"],
  "tool-associative-words": ["BLD 联想词", "BLD associations", "目隠し用連想語", "盲解聯想詞", "블라인드 연상 단어", "Mots d’association à l’aveugle", "Palabras de asociación a ciegas"],
  "tool-mbld-d": ["多盲练习", "Multi-blind practice", "複数目隠し練習", "多盲練習", "멀티 블라인드 연습", "Entraînement multi-cubes à l’aveugle", "Práctica de múltiples cubos a ciegas"],
  "tool-team-match": ["团体赛", "Team match", "団体戦", "團體賽", "팀 대회", "Match par équipes", "Competición por equipos"],
  "draw-player-card": ["小卡生成器", "Player card maker", "選手カード作成", "小卡製作工具", "선수 카드 만들기", "Créateur de carte de joueur", "Creador de tarjetas de jugador"],
  "draw-sq1": ["SQ1 绘图", "Square-1 drawing", "Square-1 描画", "SQ1 繪圖", "Square-1 그리기", "Dessin Square-1", "Dibujo de Square-1"],
  "draw-minx": ["五魔方绘图", "Megaminx drawing", "メガミンクス描画", "五魔方繪圖", "메가밍크스 그리기", "Dessin Megaminx", "Dibujo de Megaminx"],
  "draw-sk": ["Skewb 绘图", "Skewb drawing", "スキューブ描画", "Skewb 繪圖", "스큐브 그리기", "Dessin Skewb", "Dibujo de Skewb"],
  "draw-py": ["Pyraminx 绘图", "Pyraminx drawing", "ピラミンクス描画", "Pyraminx 繪圖", "피라밍크스 그리기", "Dessin Pyraminx", "Dibujo de Pyraminx"],
  "draw-fto": ["FTO 绘图", "FTO drawing", "FTO 描画", "FTO 繪圖", "FTO 그리기", "Dessin FTO", "Dibujo de FTO"],
  "tool-fr": ["FR练习器", "FR trainer", "FR トレーナー", "FR 練習器", "FR 연습 도구", "Entraînement FR", "Entrenador FR"],
  "tool-two-solver": ["二阶求解器", "2×2 solver", "2×2 ソルバー", "二階求解器", "2×2 솔버", "Solveur 2×2", "Solucionador 2×2"],
  test: ["测试", "Test", "テスト", "測試", "테스트", "Test", "Prueba"],
  "wca-comps": ["WCA 赛事", "WCA competitions", "WCA 大会", "WCA 賽事", "WCA 대회", "Compétitions WCA", "Competiciones WCA"],
  "wca-player": ["WCA 选手", "WCA competitor", "WCA 選手", "WCA 選手", "WCA 선수", "Compétiteur WCA", "Competidor WCA"],
  "wca-players": ["选手搜索", "Competitor search", "選手検索", "選手搜尋", "선수 검색", "Recherche de compétiteurs", "Buscar competidores"],
  "wca-proportion-estimation": ["比例拟合", "Proportion estimation", "比率推定", "比例估算", "비율 추정", "Estimation des proportions", "Estimación de proporciones"],
  "wca-statistics": ["WCA 统计", "WCA statistics", "WCA 統計", "WCA 統計", "WCA 통계", "Statistiques WCA", "Estadísticas WCA"],
  "competition-detail": ["赛事详情", "Competition details", "大会詳細", "賽事詳情", "대회 상세", "Détails de la compétition", "Detalles de la competición"],
  "player-detail": ["站内选手", "Community competitor", "コミュニティ選手", "站內選手", "커뮤니티 선수", "Compétiteur de la communauté", "Competidor de la comunidad"],
  "gc-static": ["排行", "Rankings", "ランキング", "排行榜", "순위", "Classements", "Clasificaciones"],
  "gc-records": ["纪录", "Records", "記録", "紀錄", "최고 기록", "Records", "Récords"],
  "gc-events": ["项目", "Events", "種目", "項目", "종목", "Épreuves", "Pruebas"],
  "gc-competitions": ["比赛列表", "Competition list", "大会一覧", "比賽列表", "대회 목록", "Liste des compétitions", "Lista de competiciones"],
  "gc-players": ["选手列表", "Competitor list", "選手一覧", "選手列表", "선수 목록", "Liste des compétiteurs", "Lista de competidores"],
  "gc-pktimer": ["PK 计时器", "PK timer", "PK タイマー", "PK 計時器", "PK 타이머", "Chronomètre PK", "Cronómetro PK"],
} as const satisfies Record<string, Translations>;

export type ShellRouteId = keyof typeof routeNames;
export type ShellRouteKey = `shell.route.${ShellRouteId}`;
export type ShellMessageKey = keyof typeof messages | ShellRouteKey;

/** Shared by placeholder headings and metadata; every APP_ROUTES id must be present. */
export const SHELL_ROUTE_KEYS = Object.fromEntries(
  Object.keys(routeNames).map((id) => [id, `shell.route.${id}`]),
) as { readonly [Id in ShellRouteId]: `shell.route.${Id}` };

function catalog(index: number): Record<ShellMessageKey, string> {
  return Object.fromEntries([
    ...Object.entries(messages).map(([key, values]) => [key, values[index]]),
    ...Object.entries(routeNames).map(([id, values]) => [SHELL_ROUTE_KEYS[id as ShellRouteId], values[index]]),
  ]) as Record<ShellMessageKey, string>;
}

export const shellZhCN = catalog(0);
export const shellEnUS = catalog(1);
export const shellJa = catalog(2);
export const shellYue = catalog(3);
export const shellKo = catalog(4);
export const shellFr = catalog(5);
export const shellEs = catalog(6);

const catalogs: Record<Locale, Record<ShellMessageKey, string>> = {
  "zh-CN": shellZhCN, "en-US": shellEnUS, ja: shellJa,
  "yue-Hant-HK": shellYue, ko: shellKo, fr: shellFr, es: shellEs,
};

export function translateShell(locale: Locale, key: ShellMessageKey): string {
  return catalogs[locale][key];
}

export function getShellRouteKey(routeId: string): ShellRouteKey | undefined {
  return Object.hasOwn(SHELL_ROUTE_KEYS, routeId)
    ? SHELL_ROUTE_KEYS[routeId as ShellRouteId]
    : undefined;
}
