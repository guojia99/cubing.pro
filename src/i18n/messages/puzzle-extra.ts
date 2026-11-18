import { formatMessage } from "../formatMessage";
import { isLocale, type Locale } from "../locales";

// Columns: Simplified Chinese, English, Japanese, Cantonese, Korean, French, Spanish.
// Kept independent of the root catalog so pure puzzle formatters can use it too.
const messages = {
  "puzzleExtra.fr.intro": ["Floppy Reduction（FR）将魔方从 HTR 态（只需 R2 L2 U2 D2 F2 B2）进一步降群至 R2 L2 F2 B2 群。建议已掌握 DR 与 HTR 的最少步玩家学习。实战中可忽略 DR 轴向夹层棱，FR 只需关注所选轴的顶层与底层。", "FR reduces HTR (R2 L2 U2 D2 F2 B2) to the R2 L2 F2 B2 group. Learn DR and HTR first. Ignore the DR-axis slice edges and focus on the chosen axis’s top and bottom layers.", "FR は HTR（R2 L2 U2 D2 F2 B2）から R2 L2 F2 B2 群への還元です。DR と HTR を習得した最少手数競技者向けです。DR 軸の中層エッジは無視し、選んだ軸の上下面に注目します。", "FR 將 HTR（R2 L2 U2 D2 F2 B2）再降群到 R2 L2 F2 B2。建議先學識 DR 同 HTR。實戰可忽略 DR 軸中層棱，只睇所選軸嘅頂層同底層。", "FR은 HTR(R2 L2 U2 D2 F2 B2)을 R2 L2 F2 B2 군으로 축소합니다. DR과 HTR을 익힌 최소 회전수 참가자에게 권장합니다. DR 축의 중간층 엣지는 무시하고 선택한 축의 위아래 층에 집중합니다.", "FR réduit HTR (R2 L2 U2 D2 F2 B2) au groupe R2 L2 F2 B2. Maîtrisez d’abord DR et HTR. Ignorez les arêtes de la tranche de l’axe DR et observez les couches supérieure et inférieure de l’axe choisi.", "FR reduce HTR (R2 L2 U2 D2 F2 B2) al grupo R2 L2 F2 B2. Conviene dominar DR y HTR. Ignora las aristas de la capa intermedia del eje DR y observa las capas superior e inferior del eje elegido."],
  "puzzleExtra.fr.limited": ["还原态只做 R2 L2 F2 B2 打乱，混乱程度极其有限，很容易还原，这就是 FR 态的特点。", "From solved, R2 L2 F2 B2 creates only limited disorder and is easy to solve: the hallmark of FR.", "完成状態から R2 L2 F2 B2 だけで崩すと、状態の変化は小さく簡単に戻せます。これが FR の特徴です。", "還原態只用 R2 L2 F2 B2 打亂，變化好有限，好容易還原，呢個就係 FR 嘅特點。", "완성 상태에서 R2 L2 F2 B2만 사용하면 섞이는 정도가 작아 쉽게 풀 수 있습니다. 이것이 FR의 특징입니다.", "Depuis l’état résolu, R2 L2 F2 B2 produit un désordre limité, facile à résoudre : c’est la caractéristique de FR.", "Desde el estado resuelto, R2 L2 F2 B2 genera un desorden limitado y fácil de resolver: es la característica de FR."],
  "puzzleExtra.fr.corners": ["FR 态下八个角两两成组（UFL-DFL 等），形成四根柱子，每组上下角块侧面颜色一致。HTR 后观察上下角能否成柱，能则为好角，否则为坏角。四组角形始终相同，记为 0 / 1 / 2RL / 2FB。", "In FR, eight corners form four pillars (such as UFL-DFL), with matching side colors. After HTR, aligned top/bottom partners are good corners; others are bad. All four pairs share shape 0 / 1 / 2RL / 2FB.", "FR の8個のコーナーは UFL-DFL などの4組の柱を作り、各組の側面色が一致します。HTR 後、上下の相手と柱を作れるものが良いコーナーです。4組の形は常に同じで、0 / 1 / 2RL / 2FB と分類します。", "FR 嘅八個角兩兩成組（例如 UFL-DFL），形成四條柱，上下角側色一致。HTR 後睇上下角可唔可以成柱，可以就係好角。四組角形一直相同，分為 0 / 1 / 2RL / 2FB。", "FR에서는 8개 코너가 UFL-DFL 같은 네 쌍의 기둥을 이루며 옆면 색이 일치합니다. HTR 후 위아래 짝이 정렬되면 좋은 코너입니다. 네 쌍의 형태는 항상 같으며 0 / 1 / 2RL / 2FB로 분류합니다.", "En FR, les huit coins forment quatre piliers (UFL-DFL, par exemple), avec les mêmes couleurs latérales. Après HTR, les partenaires alignés sont de bons coins. Les quatre paires ont toujours la même forme : 0 / 1 / 2RL / 2FB.", "En FR, las ocho esquinas forman cuatro pilares (por ejemplo UFL-DFL) con colores laterales iguales. Tras HTR, las parejas alineadas son esquinas buenas. Las cuatro parejas comparten la forma 0 / 1 / 2RL / 2FB."],
  "puzzleExtra.fr.edges": ["好棱的侧面颜色与中心块对齐，类似十字。FR 关注 8 个非夹层棱，坏棱数为 0 / 2 / 4 / 6 / 8；任意形态都可先化为 4 坏棱。", "Good edges match the side centers, like a cross. FR tracks eight non-slice edges. There may be 0 / 2 / 4 / 6 / 8 bad edges; first reduce any case to four bad edges.", "良いエッジはクロスのように側面のセンター色と一致します。FR は中層以外の8個を扱います。悪いエッジの数は 0 / 2 / 4 / 6 / 8 で、まず4個に変換できます。", "好棱側色同中心對齊，好似十字。FR 只睇八個非中層棱，壞棱數有 0 / 2 / 4 / 6 / 8；可以先全部轉成四壞棱。", "좋은 엣지는 크로스처럼 옆면 센터와 색이 맞습니다. FR은 중간층을 제외한 8개 엣지를 다룹니다. 나쁜 엣지 수는 0 / 2 / 4 / 6 / 8이며 먼저 4개로 바꿀 수 있습니다.", "Une bonne arête correspond au centre latéral, comme une croix. FR suit huit arêtes hors tranche. Il peut y avoir 0 / 2 / 4 / 6 / 8 mauvaises arêtes ; ramenez d’abord le cas à quatre.", "Una arista buena coincide con el centro lateral, como en la cruz. FR considera ocho aristas fuera de la capa intermedia. Puede haber 0 / 2 / 4 / 6 / 8 malas; primero pueden reducirse a cuatro."],
  "puzzleExtra.fr.goal": ["目标是在解决所有坏棱的同时把角形调成 0。先单独学习角和棱，再组合；以下以 U/D 轴为例。", "Fix all bad edges while reaching corner shape 0. Learn corners and edges separately, then combine them. Examples use the U/D axis.", "悪いエッジをすべて解消し、コーナーを形0にします。角と辺を別々に学んでから組み合わせます。以下は U/D 軸の例です。", "目標係解晒壞棱，同時將角形變成 0。先分開學角同棱，再組合；以下用 U/D 軸示範。", "나쁜 엣지를 모두 해결하면서 코너 형태를 0으로 만듭니다. 코너와 엣지를 따로 익힌 뒤 결합하세요. 예시는 U/D 축을 사용합니다.", "Corrigez toutes les mauvaises arêtes tout en atteignant la forme de coins 0. Apprenez séparément les coins et les arêtes, puis combinez-les. Les exemples utilisent l’axe U/D.", "Corrige todas las aristas malas y alcanza la forma de esquinas 0. Aprende esquinas y aristas por separado y luego combínalas. Los ejemplos usan el eje U/D."],
  "puzzleExtra.fr.false": ["角形和坏棱都为 0 仍可能是假 FR：若 U2/D2 总数奇偶不对，仍需一个轴向半转。还原态示例：F R2 F2 R2 F2 R2 F。", "Zero bad edges and corner shape 0 may still be false FR: wrong U2/D2 parity requires another axis half-turn. Example from solved: F R2 F2 R2 F2 R2 F.", "悪いエッジ0、コーナー形0でも偽 FR の場合があります。U2/D2 の総数の偶奇が違うと軸の半回転がもう一度必要です。完成状態からの例：F R2 F2 R2 F2 R2 F。", "角形同壞棱都係 0 都可能係假 FR：U2/D2 總數奇偶唔啱，就仲要一次軸向半轉。還原態例子：F R2 F2 R2 F2 R2 F。", "나쁜 엣지 0과 코너 형태 0이어도 거짓 FR일 수 있습니다. U2/D2 횟수의 홀짝이 맞지 않으면 축 반회전이 하나 더 필요합니다. 완성 상태 예시: F R2 F2 R2 F2 R2 F.", "Zéro mauvaise arête et la forme de coins 0 peuvent encore donner un faux FR : une parité U2/D2 incorrecte exige un demi-tour axial supplémentaire. Exemple depuis l’état résolu : F R2 F2 R2 F2 R2 F.", "Cero aristas malas y esquinas de forma 0 aún pueden ser un FR falso: una paridad U2/D2 incorrecta requiere otro medio giro axial. Ejemplo desde resuelto: F R2 F2 R2 F2 R2 F."],
  "puzzleExtra.fr.parity": ["在 2-2a / 2 态可插入 U2/D2 而不破坏进度；例如 FR trigger 处做 [F2 U2 F2] R2 U2。工具的真 FR 解已补齐奇偶，可在解法解析中对照形态解和真 FR。", "At 2-2a / 2, insert U2/D2 without losing progress, for example [F2 U2 F2] R2 U2 at the FR trigger. The tool’s true-FR solution fixes parity; compare it with the shape solution in the breakdown.", "2-2a / 2 では進行を崩さず U2/D2 を挿入できます。例：FR trigger で [F2 U2 F2] R2 U2。このツールの真 FR 解は偶奇を修正済みです。解法の内訳で形だけの解と比較できます。", "喺 2-2a / 2 可以插入 U2/D2 而唔破壞進度，例如喺 FR trigger 做 [F2 U2 F2] R2 U2。工具嘅真 FR 解已補好奇偶，可喺解法解析同形態解比較。", "2-2a / 2에서는 진행을 유지하며 U2/D2를 삽입할 수 있습니다. 예: FR 트리거에서 [F2 U2 F2] R2 U2. 도구의 참 FR 해법은 홀짝을 수정합니다. 해법 분석에서 형태 해법과 비교하세요.", "À 2-2a / 2, insérez U2/D2 sans perdre la progression, par exemple [F2 U2 F2] R2 U2 au déclencheur FR. La solution FR véritable de l’outil corrige la parité ; comparez-la à la solution de forme dans la décomposition.", "En 2-2a / 2 puedes insertar U2/D2 sin perder el progreso, por ejemplo [F2 U2 F2] R2 U2 en el disparador FR. La solución FR verdadera corrige la paridad; compárala con la solución de forma en el desglose."],
  "puzzleExtra.colorsView": ["魔方配色与视图", "Puzzle colors and view", "配色と表示", "魔方配色同視圖", "퍼즐 색상 및 보기", "Couleurs et vue du puzzle", "Colores y vista del puzle"],
  "puzzleExtra.bottom": ["底色", "Bottom color", "下面の色", "底色", "아랫면 색상", "Couleur du dessous", "Color inferior"],
  "puzzleExtra.front": ["前色", "Front color", "前面の色", "前色", "앞면 색상", "Couleur de face", "Color frontal"],
  "puzzleExtra.defaultView": ["默认视图", "Default view", "既定の表示", "預設視圖", "기본 보기", "Vue par défaut", "Vista predeterminada"],
  "puzzleExtra.auto": ["自动", "Auto", "自動", "自動", "자동", "Automatique", "Automática"],
  "puzzleExtra.white": ["白色", "White", "白", "白色", "흰색", "Blanc", "Blanco"],
  "puzzleExtra.yellow": ["黄色", "Yellow", "黄", "黃色", "노란색", "Jaune", "Amarillo"],
  "puzzleExtra.red": ["红色", "Red", "赤", "紅色", "빨간색", "Rouge", "Rojo"],
  "puzzleExtra.orange": ["橙色", "Orange", "オレンジ", "橙色", "주황색", "Orange", "Naranja"],
  "puzzleExtra.green": ["绿色", "Green", "緑", "綠色", "초록색", "Vert", "Verde"],
  "puzzleExtra.blue": ["蓝色", "Blue", "青", "藍色", "파란색", "Bleu", "Azul"],
  "puzzleExtra.faceU": ["上", "Up", "上", "上", "위", "Haut", "Arriba"],
  "puzzleExtra.faceD": ["底", "Down", "下", "底", "아래", "Bas", "Abajo"],
  "puzzleExtra.faceF": ["前", "Front", "前", "前", "앞", "Avant", "Frente"],
  "puzzleExtra.faceB": ["后", "Back", "後", "後", "뒤", "Arrière", "Atrás"],
  "puzzleExtra.faceR": ["右", "Right", "右", "右", "오른쪽", "Droite", "Derecha"],
  "puzzleExtra.faceL": ["左", "Left", "左", "左", "왼쪽", "Gauche", "Izquierda"],
  "puzzleExtra.colorHint": ["底色与前色必须相邻；更换底色时，如原前色不再相邻，将自动选取相邻色。自动视图按图示场景选择 2D 或 3D。修改后自动保存并在当前页面同步。", "Bottom and front must be adjacent. Changing the bottom also adjusts an incompatible front. Auto selects 2D or 3D for the diagram context. Changes save automatically and sync across this page.", "下面と前面は隣接する必要があります。下面の変更で前面が隣接しなくなると、自動調整されます。自動表示は用途に応じて 2D または 3D を選びます。変更は自動保存され、このページ内で同期されます。", "底色同前色一定要相鄰；改底色後如果前色唔再相鄰，就會自動調整。自動視圖會按圖示揀 2D 或 3D。改動會自動儲存並喺本頁同步。", "아랫면과 앞면은 인접해야 합니다. 아랫면 변경 시 앞면이 인접하지 않으면 자동 조정됩니다. 자동 보기는 상황에 따라 2D 또는 3D를 선택합니다. 변경 사항은 자동 저장되고 이 페이지에 동기화됩니다.", "Le dessous et la face doivent être adjacents. Un changement du dessous ajuste une face incompatible. Le mode automatique choisit 2D ou 3D selon le contexte. Les modifications sont enregistrées et synchronisées sur cette page.", "Las caras inferior y frontal deben ser adyacentes. Al cambiar la inferior, la frontal se ajusta si es incompatible. El modo automático elige 2D o 3D según el contexto. Los cambios se guardan y sincronizan en esta página."],
  "puzzleExtra.colorPreview": ["六面配色预览（展开图）", "Six-face color preview (cube net)", "6 面の配色プレビュー（展開図）", "六面配色預覽（展開圖）", "6면 색상 미리 보기 (전개도)", "Aperçu des six faces (patron)", "Vista previa de las seis caras (desarrollo)"],
  "puzzleExtra.colorSummary": ["底色 {bottom}，前色 {front}；其余四面按标准实物色序旋转推导，配色不随浅色或深色主题改变。此展开图仅预览配色。", "Bottom {bottom}, front {front}. The other faces follow the physical cube's color order, independently of light or dark theme. This net previews colors only.", "下面 {bottom}、前面 {front}。他の面は実物の標準配色に従い、明暗テーマの影響を受けません。この展開図は配色のみのプレビューです。", "底色 {bottom}，前色 {front}；其餘面按實物標準色序推導，唔受明暗主題影響。呢幅展開圖只預覽配色。", "아랫면 {bottom}, 앞면 {front}. 나머지 면은 실제 큐브의 색상 순서를 따르며 밝은/어두운 테마와 무관합니다. 이 전개도는 색상만 미리 보여 줍니다.", "Dessous : {bottom}, face : {front}. Les autres faces suivent l’ordre des couleurs du cube physique, quel que soit le thème clair ou sombre. Ce patron montre uniquement les couleurs.", "Inferior: {bottom}, frontal: {front}. Las demás caras siguen el orden de colores del cubo físico, independientemente del tema claro u oscuro. Este desarrollo solo muestra los colores."],
  "puzzleExtra.saveFailed": ["保存失败，偏好未保存。请检查浏览器存储权限或空间后重试。", "Save failed. Preferences were not saved. Check browser storage permissions or available space and try again.", "保存に失敗しました。ブラウザーの保存権限や空き容量を確認して再試行してください。", "儲存失敗，偏好未儲存。請檢查瀏覽器儲存權限或空間再試。", "환경 설정을 저장하지 못했습니다. 브라우저 저장 권한이나 여유 공간을 확인하고 다시 시도하세요.", "Échec de l’enregistrement. Vérifiez les autorisations de stockage du navigateur ou l’espace disponible, puis réessayez.", "No se guardaron las preferencias. Comprueba los permisos de almacenamiento del navegador o el espacio disponible y vuelve a intentarlo."],
  "puzzleExtra.loading3d": ["正在加载 3D...", "Loading 3D...", "3D を読み込み中...", "載入緊 3D...", "3D 로딩 중...", "Chargement 3D...", "Cargando 3D..."],
  "puzzleExtra.cannotPlay": ["无法播放：", "Cannot play: ", "再生できません：", "播放唔到：", "재생할 수 없습니다: ", "Lecture impossible : ", "No se puede reproducir: "],
  "puzzleExtra.tempo": ["速度", "Tempo", "速度", "速度", "속도", "Vitesse", "Velocidad"],
  "puzzleExtra.speed": ["播放速度", "Playback speed", "再生速度", "播放速度", "재생 속도", "Vitesse de lecture", "Velocidad de reproducción"],
  "puzzleExtra.resetView": ["重置视角", "Reset view", "視点をリセット", "重設視角", "시점 초기화", "Réinitialiser la vue", "Restablecer vista"],
  "puzzleExtra.orbit": ["拖动旋转 · 双指缩放", "Drag to orbit · Pinch to zoom", "ドラッグで回転・ピンチで拡大縮小", "拖曳旋轉 · 雙指縮放", "드래그하여 회전 · 두 손가락으로 확대/축소", "Glisser pour tourner · Pincer pour zoomer", "Arrastra para girar · Pellizca para ampliar"],
  "puzzleExtra.progress": ["播放进度", "Playback progress", "再生位置", "播放進度", "재생 진행률", "Progression de lecture", "Progreso de reproducción"],
  "puzzleExtra.returnSetup": ["回到公式初态", "Return to setup", "初期状態に戻る", "返到公式初態", "초기 상태로 돌아가기", "Revenir à l’état initial", "Volver al estado inicial"],
  "puzzleExtra.start": ["初态", "Start", "初期状態", "初態", "초기 상태", "Début", "Inicio"],
  "puzzleExtra.previous": ["上一步", "Previous step", "前の手", "上一步", "이전 단계", "Étape précédente", "Paso anterior"],
  "puzzleExtra.back": ["上步", "Back", "戻る", "上步", "이전", "Retour", "Atrás"],
  "puzzleExtra.pause": ["暂停", "Pause", "一時停止", "暫停", "일시 정지", "Pause", "Pausar"],
  "puzzleExtra.play": ["播放", "Play", "再生", "播放", "재생", "Lire", "Reproducir"],
  "puzzleExtra.nextStep": ["下一步", "Next step", "次の手", "下一步", "다음 단계", "Étape suivante", "Paso siguiente"],
  "puzzleExtra.next": ["下步", "Next", "次へ", "下步", "다음", "Suivant", "Siguiente"],
  "puzzleExtra.initial": ["初态 (setup)", "Initial state (setup)", "初期状態 (setup)", "初態 (setup)", "초기 상태 (setup)", "État initial (setup)", "Estado inicial (setup)"],
  "puzzleExtra.complete": ["完成", "Complete", "完了", "完成", "완료", "Terminé", "Completado"],
  "puzzleExtra.unsupported": ["暂不支持此魔方", "Unsupported puzzle", "未対応のパズルです", "暫時未支援呢款魔方", "지원하지 않는 퍼즐입니다", "Puzzle non pris en charge", "Puzle no compatible"],
  "puzzleExtra.caseDiagram": ["公式状态图", "Algorithm case diagram", "手順の状態図", "公式狀態圖", "공식 상태 도식", "Diagramme du cas", "Diagrama del caso"],
  "puzzleExtra.diagramView": ["图示视图", "Diagram view", "図の表示", "圖示視圖", "도식 보기", "Vue du diagramme", "Vista del diagrama"],
  "puzzleExtra.layout2d": ["平面图样式", "2D layout", "平面図の形式", "平面圖樣式", "2D 배치", "Disposition 2D", "Diseño 2D"],
  "puzzleExtra.standard": ["标准", "Standard", "標準", "標準", "표준", "Standard", "Estándar"],
  "puzzleExtra.net": ["展开图", "Net", "展開図", "展開圖", "전개도", "Patron", "Desarrollo"],
  "puzzleExtra.cannotRender": ["无法生成图示：", "Cannot render: ", "図を生成できません：", "產生唔到圖示：", "도식을 생성할 수 없습니다: ", "Rendu impossible : ", "No se puede generar el diagrama: "],
  "puzzleExtra.generating": ["正在生成图示", "Generating diagram", "図を生成中", "產生緊圖示", "도식 생성 중", "Création du diagramme", "Generando diagrama"],
  "puzzleExtra.cannotRender2d": ["无法生成平面图：", "Cannot render 2D: ", "平面図を生成できません：", "產生唔到平面圖：", "2D 도식을 생성할 수 없습니다: ", "Rendu 2D impossible : ", "No se puede generar el diagrama 2D: "],
  "puzzleExtra.setupWarning": ["图示由标准 setup 生成；当前原公式暂不能播放：", "Diagram generated from standard setup; original formula playback is unavailable: ", "標準 setup から生成した図です。元の手順は再生できません：", "圖示用標準 setup 產生；暫時播放唔到原公式：", "표준 setup으로 생성한 도식입니다. 원본 공식은 재생할 수 없습니다: ", "Diagramme issu du setup standard ; la formule originale ne peut pas être lue : ", "Diagrama generado desde el setup estándar; no se puede reproducir la fórmula original: "],
  "puzzleExtra.annotation": ["原始起手提示 {annotation}；图示与动画采用正文标准握法。", "Source starting view {annotation}; diagram and playback use the formula body's standard grip.", "元の持ち方の注記 {annotation}。図と再生には本文の標準の持ち方を使います。", "原始起手提示 {annotation}；圖示同動畫用正文嘅標準握法。", "원본 시작 방향 {annotation}. 도식과 재생은 공식 본문의 표준 그립을 사용합니다.", "Vue de départ indiquée : {annotation} ; le diagramme et la lecture utilisent la prise standard du corps de la formule.", "Orientación inicial original {annotation}; el diagrama y la reproducción usan el agarre estándar del cuerpo de la fórmula."],
  "puzzleExtra.diagramSetup": ["图示打乱", "Diagram setup", "図のセットアップ", "圖示打亂", "도식 스크램블", "Mise en place du diagramme", "Preparación del diagrama"],
  "puzzleExtra.solved": ["已复原", "Solved", "完成状態", "已還原", "완성 상태", "Résolu", "Resuelto"],
  "puzzleExtra.other": ["其他", "Other", "その他", "其他", "기타", "Autres", "Otros"],
  "puzzleExtra.practiceScope": ["选择分组与公式，设置本次练习范围", "Choose your practice scope", "練習するグループと手順を選択", "揀分組同公式，設定今次練習範圍", "그룹과 공식을 선택하여 연습 범위 설정", "Choisir les groupes et formules à pratiquer", "Elige los grupos y algoritmos para practicar"],
  "puzzleExtra.searchFormulas": ["搜索本页公式", "Search current formulas", "このページの手順を検索", "搜尋本頁公式", "현재 공식 검색", "Rechercher dans les formules affichées", "Buscar en los algoritmos actuales"],
  "puzzleExtra.searchPlaceholder": ["搜索名称、分组或公式…", "Search names, groups or formulas…", "名前・グループ・手順を検索…", "搜尋名稱、分組或公式…", "이름, 그룹 또는 공식 검색…", "Rechercher un nom, un groupe ou une formule…", "Buscar nombres, grupos o algoritmos…"],
  "puzzleExtra.searchHint": ["搜索仅影响展示，练习使用已选范围。", "Search changes this view; practice uses your selected scope.", "検索は表示のみに影響します。練習には選択した範囲を使います。", "搜尋只影響顯示，練習會用已揀嘅範圍。", "검색은 표시에만 적용되며 연습에는 선택한 범위가 사용됩니다.", "La recherche modifie l’affichage ; la pratique utilise votre sélection.", "La búsqueda cambia la vista; la práctica usa el ámbito seleccionado."],
  "puzzleExtra.clearSearch": ["清除搜索", "Clear search", "検索をクリア", "清除搜尋", "검색 지우기", "Effacer la recherche", "Borrar búsqueda"],
  "puzzleExtra.resetFilters": ["重置筛选", "Reset filters", "絞り込みをリセット", "重設篩選", "필터 초기화", "Réinitialiser les filtres", "Restablecer filtros"],
  "puzzleExtra.resize": ["调整筛选与公式区域宽度", "Resize filter and formula panels", "絞り込みと手順パネルの幅を調整", "調整篩選同公式區域闊度", "필터 및 공식 패널 너비 조정", "Redimensionner les panneaux de filtres et de formules", "Ajustar el ancho de los paneles de filtros y algoritmos"],
  "puzzleExtra.resizeHint": ["拖拽或使用左右方向键调整，双击恢复默认宽度", "Drag or use arrow keys. Double-click to reset.", "ドラッグまたは左右キーで調整。ダブルクリックでリセット。", "拖曳或用左右方向鍵調整，撳兩下恢復預設闊度", "드래그하거나 좌우 화살표로 조정합니다. 두 번 클릭하여 초기화합니다.", "Glisser ou utiliser les flèches. Double-cliquer pour réinitialiser.", "Arrastra o usa las flechas. Haz doble clic para restablecer."],
  "puzzleExtra.filterWidth": ["筛选栏宽度 {width} 像素", "Filter width {width} pixels", "絞り込み欄の幅 {width} ピクセル", "篩選欄闊度 {width} 像素", "필터 너비 {width} 픽셀", "Largeur des filtres : {width} pixels", "Ancho del filtro: {width} píxeles"],
  "puzzleExtra.setupLoading": ["正在为缺失打乱的公式准备打乱，完成后可开始练习。", "Preparing missing scrambles. Practice will be available when ready.", "不足しているスクランブルを準備中です。完了後に練習できます。", "幫缺少打亂嘅公式準備緊打亂，完成後就可以練習。", "누락된 스크램블을 준비 중입니다. 준비가 끝나면 연습할 수 있습니다.", "Préparation des mélanges manquants. La pratique sera disponible ensuite.", "Preparando las mezclas que faltan. Podrás practicar cuando estén listas."],
  "puzzleExtra.missingSetup": ["部分公式暂无可用打乱，可查看或切换题目，但不能启动计时。", "Some formulas have no usable scramble. You can view or skip them, but cannot start their timer.", "一部の手順には有効なスクランブルがありません。表示やスキップはできますが計測は開始できません。", "部分公式暫時冇可用打亂，可以睇或跳題，但開唔到計時。", "일부 공식에는 사용 가능한 스크램블이 없습니다. 보거나 건너뛸 수 있지만 타이머는 시작할 수 없습니다.", "Certaines formules n’ont pas de mélange utilisable. Vous pouvez les voir ou les passer, mais pas lancer leur chronomètre.", "Algunos algoritmos no tienen una mezcla válida. Puedes verlos o saltarlos, pero no iniciar su cronómetro."],
  "puzzleExtra.localDiagrams": ["公式说明图示现在由本地生成。", "Algorithm explanation diagrams are now generated locally.", "手順の説明図は端末内で生成されます。", "公式說明圖示而家會喺本機產生。", "공식 설명 도식은 기기에서 생성됩니다.", "Les diagrammes explicatifs sont générés localement.", "Los diagramas explicativos se generan localmente."],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type PuzzleExtraKey = keyof typeof messages;
function catalog(column: number): Record<PuzzleExtraKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<PuzzleExtraKey, string>;
}
export const puzzleExtraZhCN = catalog(0);
export const puzzleExtraEnUS = catalog(1);
export const puzzleExtraJa = catalog(2);
export const puzzleExtraYue = catalog(3);
export const puzzleExtraKo = catalog(4);
export const puzzleExtraFr = catalog(5);
export const puzzleExtraEs = catalog(6);

const catalogs: Record<Locale, Record<PuzzleExtraKey, string>> = {
  "zh-CN": puzzleExtraZhCN, "en-US": puzzleExtraEnUS,
  ja: puzzleExtraJa, "yue-Hant-HK": puzzleExtraYue,
  ko: puzzleExtraKo, fr: puzzleExtraFr, es: puzzleExtraEs,
};
const aliases: Record<string, Locale> = {
  "ja-JP": "ja", yue: "yue-Hant-HK", "yue-HK": "yue-Hant-HK",
  "ko-KR": "ko", "fr-FR": "fr", "es-ES": "es",
};

export function translatePuzzleExtra(locale: string, key: PuzzleExtraKey, params: Record<string, string | number> = {}): string {
  const normalized = isLocale(locale) ? locale : (Object.hasOwn(aliases, locale) ? aliases[locale] : "zh-CN");
  return formatMessage(normalized, key, catalogs[normalized][key], params);
}
