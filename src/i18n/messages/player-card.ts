import type { Locale } from "../locales";

// Column order: zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es.
const messages = {
  "playerCard.background": ["换背景", "Change background", "背景を変更", "換背景", "배경 바꾸기", "Changer le fond", "Cambiar fondo"],
  "playerCard.backgroundHelp": ["框住人物，框外留些背景；点击提取，再用保留／擦除修正。颜色相近、头发或复杂背景可能需要手动修补。图片仅在本地处理。", "Box the person, leaving some background outside; extract, then refine with Keep / Erase. Similar colors, hair and busy backgrounds may need correction. Images stay local.", "背景を枠外に残して人物を囲み、抽出後に残す／消すで修正します。似た色や髪、複雑な背景は手動修正が必要な場合があります。画像は端末内で処理します。", "框住人物，框外留啲背景；擷取後用保留／擦除修正。相近顏色、頭髮同複雜背景可能要手動修補。圖片只喺本機處理。", "배경 일부를 상자 밖에 남겨 인물을 감싼 후 추출하고 유지 / 지우기로 수정하세요. 비슷한 색, 머리카락, 복잡한 배경은 수정이 필요할 수 있습니다. 이미지는 기기에서만 처리됩니다.", "Encadrez la personne en laissant du fond à l’extérieur, extrayez puis corrigez avec Garder / Effacer. Les couleurs proches, cheveux et fonds complexes peuvent nécessiter des retouches. Traitement local.", "Rodea a la persona dejando algo de fondo fuera, extrae y retoca con Conservar / Borrar. Colores parecidos, pelo y fondos complejos pueden necesitar retoques. Procesamiento local."],
  "playerCard.editSurface": ["背景编辑照片", "Background editing photo", "背景編集用写真", "背景編輯相片", "배경 편집 사진", "Photo à retoucher", "Foto para editar el fondo"],
  "playerCard.box": ["框选人物", "Select person", "人物を囲む", "框選人物", "인물 선택", "Encadrer la personne", "Seleccionar persona"],
  "playerCard.cutout": ["提取人物", "Extract person", "人物を抽出", "擷取人物", "인물 추출", "Extraire la personne", "Extraer persona"],
  "playerCard.keep": ["保留", "Keep", "残す", "保留", "유지", "Garder", "Conservar"],
  "playerCard.erase": ["擦除", "Erase", "消す", "擦除", "지우기", "Effacer", "Borrar"],
  "playerCard.undo": ["撤销上一笔", "Undo last stroke", "直前の操作を戻す", "復原上一筆", "마지막 획 취소", "Annuler le dernier trait", "Deshacer último trazo"],
  "playerCard.color": ["背景颜色", "Background color", "背景色", "背景顏色", "배경색", "Couleur du fond", "Color de fondo"],
  "playerCard.backdrop": ["选择本地背景图", "Choose local backdrop", "端末の背景画像を選択", "揀本機背景圖", "기기 배경 이미지 선택", "Choisir un fond local", "Elegir fondo local"],
  "playerCard.original": ["恢复原图", "Restore original", "元の写真に戻す", "還原原相", "원본 복원", "Restaurer l’original", "Restaurar original"],
  "playerCard.done": ["完成编辑", "Finish editing", "編集を終了", "完成編輯", "편집 완료", "Terminer la retouche", "Terminar edición"],

  "playerCard.title": ["小卡生成器", "Player card maker", "選手カード作成", "小卡製作工具", "선수 카드 만들기", "Créateur de carte de joueur", "Creador de tarjetas de jugador"],
  "playerCard.description": ["一张照片，一个名字。制作属于你的方形小卡。", "One photo, one name. Make your own square portrait card.", "写真と名前で、自分だけの正方形カードを。", "一張相，一個名。整一張屬於你嘅正方形小卡。", "사진과 이름으로 나만의 정사각형 카드를 만드세요.", "Une photo, un nom. Créez votre carte portrait carrée.", "Una foto, un nombre. Crea tu tarjeta de retrato cuadrada."],
  "playerCard.preview": ["小卡预览", "Card preview", "カードのプレビュー", "小卡預覽", "카드 미리보기", "Aperçu de la carte", "Vista previa de la tarjeta"],
  "playerCard.loading": ["正在读取照片…", "Reading photo…", "写真を読み込み中…", "讀取緊相片…", "사진을 읽는 중…", "Lecture de la photo…", "Leyendo la foto…"],
  "playerCard.move": ["拖动照片调整位置 · 1:1 方形裁切", "Drag the photo to reposition · Square crop", "写真をドラッグして位置を調整 · 正方形", "拖動相片調整位置 · 正方形裁切", "사진을 드래그해 위치 조정 · 정사각형 자르기", "Déplacez la photo en la faisant glisser · Recadrage carré", "Arrastra la foto para moverla · Recorte cuadrado"],
  "playerCard.photo": ["选择照片", "Choose photo", "写真を選択", "揀相片", "사진 선택", "Choisir une photo", "Elegir foto"],
  "playerCard.private": ["照片仅在当前浏览器处理，不会上传。", "Your photo stays in this browser. Nothing is uploaded.", "写真はこのブラウザー内で処理され、送信されません。", "相片只會喺呢個瀏覽器處理，唔會上傳。", "사진은 이 브라우저에서만 처리되며 업로드되지 않습니다.", "Votre photo reste dans ce navigateur. Aucun envoi.", "Tu foto permanece en este navegador. No se sube nada."],
  "playerCard.name": ["显示名称（可选）", "Display name (optional)", "表示名（任意）", "顯示名稱（可選）", "표시 이름 (선택 사항)", "Nom affiché (facultatif)", "Nombre visible (opcional)"],
  "playerCard.zoom": ["缩放", "Zoom", "ズーム", "縮放", "확대/축소", "Zoom", "Zoom"],
  "playerCard.reset": ["重置位置与缩放", "Reset position and zoom", "位置とズームをリセット", "重設位置同縮放", "위치와 확대/축소 초기화", "Réinitialiser la position et le zoom", "Restablecer posición y zoom"],
  "playerCard.download": ["下载 PNG · 1080 × 1080", "Download PNG · 1080 × 1080", "PNG を保存 · 1080 × 1080", "下載 PNG · 1080 × 1080", "PNG 다운로드 · 1080 × 1080", "Télécharger PNG · 1080 × 1080", "Descargar PNG · 1080 × 1080"],
  "playerCard.decodeError": ["无法读取照片，请选择有效的 PNG、JPEG、WebP、AVIF、GIF 或 BMP 图片。", "Cannot read this photo. Choose a valid PNG, JPEG, WebP, AVIF, GIF or BMP image.", "写真を読み込めません。有効な PNG、JPEG、WebP、AVIF、GIF、BMP 画像を選んでください。", "讀唔到相片，請揀有效嘅 PNG、JPEG、WebP、AVIF、GIF 或 BMP 圖片。", "사진을 읽을 수 없습니다. 올바른 PNG, JPEG, WebP, AVIF, GIF 또는 BMP 이미지를 선택하세요.", "Photo illisible. Choisissez une image PNG, JPEG, WebP, AVIF, GIF ou BMP valide.", "No se puede leer la foto. Elige una imagen PNG, JPEG, WebP, AVIF, GIF o BMP válida."],
  "playerCard.exportError": ["图片导出失败，请重试。", "Could not export the image. Please try again.", "画像の保存に失敗しました。もう一度お試しください。", "圖片匯出失敗，請再試。", "이미지를 내보내지 못했습니다. 다시 시도하세요.", "Échec de l’exportation. Réessayez.", "No se pudo exportar la imagen. Inténtalo de nuevo."],
} as const satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type PlayerCardMessageKey = keyof typeof messages;
const locales = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"] as const;
export const playerCardCatalogs = Object.fromEntries(locales.map((locale, index) => [
  locale, Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])),
])) as Record<Locale, Record<PlayerCardMessageKey, string>>;
