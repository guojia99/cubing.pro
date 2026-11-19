import { formatMessage } from "../formatMessage";
import { isLocale } from "../locales";

// Simplified Chinese, English, Japanese, Cantonese, Korean, French, Spanish.
const messages = {
  "advertisements.basicInfo": ["基础信息", "Basic information", "基本情報", "基本資料", "기본 정보", "Informations générales", "Información básica"],
  "advertisements.detailContent": ["详细内容", "Detailed content", "詳細内容", "詳細內容", "상세 내용", "Contenu détaillé", "Contenido detallado"],
  "advertisements.saveChanges": ["保存修改", "Save changes", "変更を保存", "儲存修改", "변경 사항 저장", "Enregistrer les modifications", "Guardar cambios"],
  "advertisements.adminTitle": ["广告管理", "Advertisements", "広告管理", "廣告管理", "광고 관리", "Gestion des publicités", "Gestión de anuncios"],
  "advertisements.adminDescription": ["管理动态广告、图片和展示顺序，保存后公开生效。", "Manage dynamic ads, images and display order. Save to publish changes.", "動的広告、画像、表示順を管理します。保存すると公開されます。", "管理動態廣告、圖片同顯示次序，儲存後公開生效。", "동적 광고, 이미지와 표시 순서를 관리합니다. 저장하면 공개됩니다.", "Gérez les publicités dynamiques, images et ordre d’affichage. Enregistrez pour publier.", "Gestiona anuncios dinámicos, imágenes y orden. Guarda para publicar los cambios."],
  "advertisements.products": ["产品图片", "Products", "商品画像", "產品圖片", "제품 이미지", "Produits", "Productos"],
  "advertisements.showcase": ["展示图片", "Showcase", "展示画像", "展示圖片", "갤러리", "Galerie", "Galería"],
  "advertisements.visit": ["前往查看", "Visit", "アクセス", "前往查看", "방문하기", "Consulter", "Visitar"],
  "advertisements.preview": ["预览", "Preview", "プレビュー", "預覽", "미리 보기", "Aperçu", "Vista previa"],
  "advertisements.close": ["关闭", "Close", "閉じる", "關閉", "닫기", "Fermer", "Cerrar"],
  "advertisements.loading": ["正在加载广告…", "Loading advertisements…", "広告を読み込み中…", "載入廣告中…", "광고 불러오는 중…", "Chargement des publicités…", "Cargando anuncios…"],
  "advertisements.loadError": ["广告加载失败，重试成功前无法编辑或保存。", "Could not load advertisements. Editing and saving are disabled until a retry succeeds.", "広告を読み込めませんでした。再試行が成功するまで編集・保存できません。", "廣告載入失敗，重試成功前無法編輯或儲存。", "광고를 불러오지 못했습니다. 재시도가 성공할 때까지 편집과 저장이 잠깁니다.", "Impossible de charger les publicités. Réessayez avant de modifier ou enregistrer.", "No se pudieron cargar los anuncios. Reintenta antes de editar o guardar."],
  "advertisements.retry": ["重试", "Retry", "再試行", "重試", "다시 시도", "Réessayer", "Reintentar"],
  "advertisements.publicLoadError": ["广告加载失败，请重试。", "Could not load advertisements. Please retry.", "広告を読み込めませんでした。再試行してください。", "廣告載入失敗，請重試。", "광고를 불러오지 못했습니다. 다시 시도하세요.", "Impossible de charger les publicités. Réessayez.", "No se pudieron cargar los anuncios. Reintenta."],
  "advertisements.imageUnavailable": ["图片暂不可用", "Image unavailable", "画像を表示できません", "圖片暫時無法顯示", "이미지를 표시할 수 없습니다", "Image indisponible", "Imagen no disponible"],
  "advertisements.add": ["新增广告", "Add advertisement", "広告を追加", "新增廣告", "광고 추가", "Ajouter une publicité", "Añadir anuncio"],
  "advertisements.empty": ["暂无动态广告，请新增。既有固定广告不受影响。", "No dynamic advertisements. Add one to get started. Existing fixed ads are unaffected.", "動的広告はありません。追加してください。既存の固定広告には影響しません。", "暫無動態廣告，請新增。現有固定廣告不受影響。", "동적 광고가 없습니다. 추가해 보세요. 기존 고정 광고에는 영향이 없습니다.", "Aucune publicité dynamique. Ajoutez-en une. Les publicités fixes existantes restent inchangées.", "No hay anuncios dinámicos. Añade uno. Los anuncios fijos existentes no se ven afectados."],
  "advertisements.key": ["唯一标识", "Unique key", "一意のキー", "唯一識別碼", "고유 키", "Identifiant unique", "Clave única"],
  "advertisements.keyHint": ["1–64 位字母、数字、下划线或短横线；不可使用 cuberwenjun、contact。", "1–64 letters, digits, underscores or hyphens; cuberwenjun and contact are reserved.", "英数字・_・- の1～64文字。cuberwenjun と contact は使用不可。", "1–64 位字母、數字、底線或短橫線；不可用 cuberwenjun、contact。", "영문, 숫자, 밑줄, 하이픈 1–64자. cuberwenjun과 contact는 예약되어 있습니다.", "1 à 64 lettres, chiffres, tirets ou tirets bas ; cuberwenjun et contact sont réservés.", "1–64 letras, números, guiones o guiones bajos; cuberwenjun y contact están reservados."],
  "advertisements.title": ["标题", "Title", "タイトル", "標題", "제목", "Titre", "Título"],
  "advertisements.description": ["简介", "Description", "説明", "簡介", "설명", "Description", "Descripción"],
  "advertisements.contact": ["联系信息", "Contact details", "連絡先", "聯絡資料", "연락처", "Coordonnées", "Datos de contacto"],
  "advertisements.duration": ["轮播时长（秒）", "Rotation duration (seconds)", "表示時間（秒）", "輪播時間（秒）", "표시 시간(초)", "Durée d’affichage (secondes)", "Duración (segundos)"],
  "advertisements.targetUrl": ["目标地址", "Destination URL", "リンク先", "目標網址", "대상 주소", "URL de destination", "URL de destino"],
  "advertisements.urlHint": ["可留空，或填写 / 开头的站内路径、完整 http(s) 地址。", "Optional: a site path starting with / or a full http(s) URL.", "省略可。/ で始まるサイト内パス、または完全な http(s) URL。", "可留空，或填 / 開頭嘅站內路徑、完整 http(s) 網址。", "선택 사항: /로 시작하는 사이트 경로 또는 전체 http(s) URL.", "Facultatif : chemin du site commençant par / ou URL http(s) complète.", "Opcional: ruta del sitio que empiece por / o URL http(s) completa."],
  "advertisements.enabled": ["启用", "Enabled", "有効", "啟用", "활성화", "Activée", "Activado"],
  "advertisements.disabled": ["已停用", "Disabled", "無効", "已停用", "비활성화", "Désactivée", "Desactivado"],
  "advertisements.cover": ["封面图片", "Cover image", "カバー画像", "封面圖片", "표지 이미지", "Image de couverture", "Imagen de portada"],
  "advertisements.imageUrl": ["图片地址", "Image URL", "画像URL", "圖片網址", "이미지 주소", "URL de l’image", "URL de imagen"],
  "advertisements.caption": ["图片文案", "Caption", "画像の説明", "圖片文案", "이미지 설명", "Légende", "Texto de imagen"],
  "advertisements.productLink": ["产品链接", "Product link", "商品リンク", "產品連結", "제품 링크", "Lien du produit", "Enlace del producto"],
  "advertisements.upload": ["上传图片", "Upload image", "画像をアップロード", "上傳圖片", "이미지 업로드", "Importer une image", "Subir imagen"],
  "advertisements.uploadHint": ["JPEG/PNG，最大 5 MiB，单边不超过 8192 像素，总像素不超过 2000 万。", "JPEG/PNG, up to 5 MiB, 8192 pixels per side and 20 million pixels total.", "JPEG/PNG、5 MiB以下、各辺8192ピクセル以下、合計2000万画素以下。", "JPEG/PNG，最多 5 MiB，每邊不超過 8192 像素，總像素不超過 2000 萬。", "JPEG/PNG, 최대 5 MiB, 한 변 8192픽셀, 총 2000만 픽셀 이하.", "JPEG/PNG, 5 Mio maximum, 8192 pixels par côté et 20 millions de pixels au total.", "JPEG/PNG, máximo 5 MiB, 8192 píxeles por lado y 20 millones de píxeles en total."],
  "advertisements.enlarge": ["放大图片", "Enlarge image", "画像を拡大", "放大圖片", "이미지 확대", "Agrandir l’image", "Ampliar imagen"],
  "advertisements.addImage": ["新增图片", "Add image", "画像を追加", "新增圖片", "이미지 추가", "Ajouter une image", "Añadir imagen"],
  "advertisements.moveUp": ["上移", "Move up", "上へ", "上移", "위로", "Monter", "Subir"],
  "advertisements.moveDown": ["下移", "Move down", "下へ", "下移", "아래로", "Descendre", "Bajar"],
  "advertisements.save": ["保存完整列表", "Save complete list", "一覧全体を保存", "儲存完整清單", "전체 목록 저장", "Enregistrer toute la liste", "Guardar lista completa"],
  "advertisements.unsaved": ["有未保存的修改；保存完整列表后才会公开生效。", "Unsaved changes. Save the complete list to publish them.", "未保存の変更があります。一覧全体を保存すると公開されます。", "有未儲存修改；儲存完整清單後先會公開生效。", "저장하지 않은 변경 사항이 있습니다. 전체 목록을 저장하면 공개됩니다.", "Modifications non enregistrées. Enregistrez toute la liste pour les publier.", "Hay cambios sin guardar. Guarda la lista completa para publicarlos."],
  "advertisements.leaveConfirm": ["有未保存的修改或正在处理的操作，确定离开并放弃吗？", "Unsaved changes or an operation in progress. Leave and discard?", "未保存の変更または処理中の操作があります。破棄して移動しますか？", "有未儲存修改或處理中嘅操作，確定離開並放棄？", "저장하지 않은 변경 사항 또는 진행 중인 작업이 있습니다. 나가시겠습니까?", "Modifications non enregistrées ou opération en cours. Quitter et abandonner ?", "Hay cambios sin guardar o una operación en curso. ¿Salir y descartar?"],
  "advertisements.deleteConfirm": ["删除这条广告？保存完整列表后生效。", "Delete this advertisement? Save the complete list to apply.", "この広告を削除しますか？一覧全体の保存後に反映されます。", "刪除呢條廣告？儲存完整清單後生效。", "이 광고를 삭제할까요? 전체 목록을 저장하면 적용됩니다.", "Supprimer cette publicité ? Enregistrez toute la liste pour appliquer.", "¿Eliminar este anuncio? Guarda la lista completa para aplicar."],
  "advertisements.clearConfirm": ["将保存空列表，移除所有动态广告，确定继续？", "Saving an empty list removes all dynamic advertisements. Continue?", "空の一覧を保存すると動的広告がすべて削除されます。続行しますか？", "儲存空清單會移除所有動態廣告，確定繼續？", "빈 목록을 저장하면 모든 동적 광고가 삭제됩니다. 계속할까요?", "Une liste vide supprime toutes les publicités dynamiques. Continuer ?", "Guardar una lista vacía elimina todos los anuncios dinámicos. ¿Continuar?"],
  "advertisements.cardPreview": ["草稿卡片预览", "Draft card preview", "下書きカードのプレビュー", "草稿卡片預覽", "초안 카드 미리 보기", "Aperçu de la carte brouillon", "Vista previa de tarjeta borrador"],
  "advertisements.detailPreview": ["草稿详情预览", "Draft details preview", "下書き詳細のプレビュー", "草稿詳情預覽", "초안 상세 미리 보기", "Aperçu détaillé du brouillon", "Vista previa de detalles del borrador"],
  "advertisements.invalidKey": ["标识格式无效、重复或使用了保留名称。", "The key is invalid, duplicated or reserved.", "キーが無効、重複、または予約済みです。", "識別碼格式無效、重複或用咗保留名稱。", "키가 잘못되었거나 중복 또는 예약되어 있습니다.", "Identifiant invalide, dupliqué ou réservé.", "La clave no es válida, está duplicada o reservada."],
  "advertisements.invalidTitle": ["标题必填，最多 200 个字符。", "A title is required, up to 200 characters.", "タイトルは必須で、200文字以内です。", "標題必填，最多 200 個字。", "제목은 필수이며 최대 200자입니다.", "Le titre est requis, 200 caractères maximum.", "El título es obligatorio, máximo 200 caracteres."],
  "advertisements.textLimit": ["简介最多 4000 字，联系信息最多 500 字。", "Description: up to 4000 characters. Contact details: up to 500.", "説明は4000文字、連絡先は500文字以内です。", "簡介最多 4000 字，聯絡資料最多 500 字。", "설명은 최대 4000자, 연락처는 최대 500자입니다.", "Description : 4000 caractères maximum. Coordonnées : 500.", "Descripción: máximo 4000 caracteres. Contacto: máximo 500."],
  "advertisements.invalidDuration": ["时长必须为 1–120 秒，可用小数。", "Duration must be 1–120 seconds; decimals are allowed.", "表示時間は1～120秒です。小数も使えます。", "時間必須係 1–120 秒，可用小數。", "시간은 1–120초이며 소수도 가능합니다.", "La durée doit être de 1 à 120 secondes ; décimales acceptées.", "La duración debe ser de 1–120 segundos; se admiten decimales."],
  "advertisements.invalidUrl": ["图片地址必填；地址仅支持安全的站内路径或 http(s)，不允许凭据、反斜杠及控制字符。", "Images require a URL. Use a safe site path or http(s) URL without credentials, backslashes or control characters.", "画像URLは必須です。認証情報・バックスラッシュ・制御文字のないサイト内パスか http(s) URL を使用してください。", "圖片網址必填；只支援安全站內路徑或 http(s)，不可有登入資料、反斜線或控制字元。", "이미지 주소는 필수입니다. 인증 정보, 역슬래시, 제어 문자가 없는 사이트 경로나 http(s) URL을 사용하세요.", "Une URL est requise pour les images. Utilisez un chemin sûr ou une URL http(s), sans identifiants, antislashs ni caractères de contrôle.", "Las imágenes requieren URL. Usa una ruta segura o URL http(s) sin credenciales, barras inversas ni caracteres de control."],
  "advertisements.limit": ["最多 50 条广告，每条产品图和展示图各最多 20 张。", "Up to 50 ads, with up to 20 product images and 20 showcase images per ad.", "広告は最大50件、商品画像と展示画像は各20枚までです。", "最多 50 條廣告，每條產品圖同展示圖各最多 20 張。", "광고 최대 50개, 광고당 제품 및 갤러리 이미지 각각 최대 20개.", "50 publicités maximum, avec 20 images de produits et 20 de galerie par publicité.", "Máximo 50 anuncios, con 20 imágenes de productos y 20 de galería por anuncio."],
  "advertisements.payloadLimit": ["完整列表超过 8 MiB，请缩短文案或图片地址。", "The complete list exceeds 8 MiB. Shorten captions or image URLs.", "一覧全体が8 MiBを超えています。説明文や画像URLを短くしてください。", "完整清單超過 8 MiB，請縮短文案或圖片網址。", "전체 목록이 8 MiB를 초과합니다. 설명이나 이미지 주소를 줄이세요.", "La liste dépasse 8 Mio. Raccourcissez les légendes ou URL des images.", "La lista supera 8 MiB. Acorta los textos o las URL de imágenes."],
  "advertisements.uploadError": ["上传失败，请检查图片格式、大小和尺寸后重试。", "Upload failed. Check the image format, file size and dimensions, then retry.", "アップロードに失敗しました。形式・ファイルサイズ・寸法を確認して再試行してください。", "上傳失敗，請檢查圖片格式、大小同尺寸後重試。", "업로드에 실패했습니다. 이미지 형식, 파일 크기와 해상도를 확인하고 다시 시도하세요.", "Échec de l’import. Vérifiez le format, la taille et les dimensions de l’image, puis réessayez.", "Error al subir. Revisa el formato, tamaño y dimensiones de la imagen y reintenta."],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type AdvertisementMessageKey = keyof typeof messages;
function catalog(column: number): Record<AdvertisementMessageKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<AdvertisementMessageKey, string>;
}
export const advertisementZhCN = catalog(0);
export const advertisementEnUS = catalog(1);
export const advertisementJa = catalog(2);
export const advertisementYue = catalog(3);
export const advertisementKo = catalog(4);
export const advertisementFr = catalog(5);
export const advertisementEs = catalog(6);
const catalogs = { "zh-CN": advertisementZhCN, "en-US": advertisementEnUS, ja: advertisementJa, "yue-Hant-HK": advertisementYue, ko: advertisementKo, fr: advertisementFr, es: advertisementEs };

export function getAdvertisementMessages(locale: string) {
  const normalized = isLocale(locale) ? locale : "zh-CN";
  return (key: AdvertisementMessageKey, params: Record<string, string | number> = {}) =>
    formatMessage(normalized, key, catalogs[normalized][key], params);
}
