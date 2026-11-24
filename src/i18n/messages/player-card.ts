import type { Locale } from "../locales";

// Column order: zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es.
const messages = {
  "playerCard.replaceBackground": ["替换纯色背景", "Replace solid background", "単色の背景を置換", "替換純色背景", "단색 배경 바꾸기", "Remplacer le fond uni", "Reemplazar fondo liso"],
  "playerCard.cancelBackground": ["取消替换", "Cancel replacement", "置換をキャンセル", "取消替換", "바꾸기 취소", "Annuler le remplacement", "Cancelar reemplazo"],
  "playerCard.pickBackground": ["轻点预览中清晰的纯色背景区域。", "Tap a clear solid background area in the preview.", "プレビューの単色の背景部分をタップしてください。", "輕點預覽入面清晰嘅純色背景位置。", "미리보기에서 선명한 단색 배경을 탭하세요.", "Touchez une zone de fond uni dans l’aperçu.", "Toca una zona de fondo liso en la vista previa."],
  "playerCard.retryBackground": ["未找到清晰的背景，请换个位置再试。", "No clear background found. Try another spot.", "背景を判別できません。別の場所をお試しください。", "搵唔到清晰嘅背景，請換個位置再試。", "배경을 찾지 못했습니다. 다른 곳을 탭하세요.", "Aucun fond net détecté. Essayez un autre endroit.", "No se encontró un fondo claro. Prueba en otro punto."],
  "playerCard.restoreBackground": ["恢复原背景", "Restore original background", "元の背景に戻す", "還原原本背景", "원래 배경 복원", "Restaurer le fond d’origine", "Restaurar fondo original"],
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
