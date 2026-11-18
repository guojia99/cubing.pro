import { editorMessages } from "@/components/Markdown/editorLocale";
import { formatMessage } from "../formatMessage";
import { isLocale } from "../locales";

// Keep each row in zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es order.
const messages = {
  "shared.copy": ["复制", "Copy", "コピー", "複製", "복사", "Copier", "Copiar"],
  "shared.copy.success": ["复制成功", "Copied", "コピーしました", "已複製", "복사했습니다", "Copié", "Copiado"],
  "shared.copy.failed": ["复制失败", "Copy failed", "コピーできませんでした", "複製失敗", "복사 실패", "Échec de la copie", "Error al copiar"],
  "shared.copy.manual": ["请手动复制", "Please copy manually", "手動でコピーしてください", "請手動複製", "직접 복사해 주세요", "Veuillez copier manuellement", "Copia el texto manualmente"],
  "shared.cloud.uploaded": ["已上传", "Uploaded", "アップロードしました", "已上載", "업로드했습니다", "Envoyé", "Subido"],
  "shared.cloud.synced": ["已同步", "Synced", "同期しました", "已同步", "동기화했습니다", "Synchronisé", "Sincronizado"],
  "shared.cloud.uploadFailed": ["上传失败", "Upload failed", "アップロードに失敗しました", "上載失敗", "업로드 실패", "Échec de l’envoi", "Error al subir"],
  "shared.cloud.syncFailed": ["同步失败", "Sync failed", "同期に失敗しました", "同步失敗", "동기화 실패", "Échec de la synchronisation", "Error al sincronizar"],
  "shared.cloud.progress": ["上传进度", "Upload progress", "アップロードの進行状況", "上載進度", "업로드 진행률", "Progression de l’envoi", "Progreso de subida"],
  "shared.markdown.contents": ["目录", "Contents", "目次", "目錄", "목차", "Sommaire", "Índice"],
  "shared.markdown.placeholder": ["请输入内容...", "Enter content...", "内容を入力してください...", "請輸入內容...", "내용을 입력하세요...", "Saisissez le contenu...", "Escribe el contenido..."],
  "shared.markdown.loading": ["正在加载编辑器...", "Loading editor...", "エディターを読み込み中...", "載入編輯器中...", "편집기 로딩 중...", "Chargement de l’éditeur...", "Cargando el editor..."],
  "shared.markdown.preview": ["图片预览", "Image preview", "画像プレビュー", "圖片預覽", "이미지 미리보기", "Aperçu de l’image", "Vista previa de imagen"],
  "shared.close": ["关闭", "Close", "閉じる", "關閉", "닫기", "Fermer", "Cerrar"],
  "shared.error.request": ["请求失败，请稍后重试", "Request failed. Please try again later", "リクエストに失敗しました。後でもう一度お試しください", "請求失敗，請稍後再試", "요청에 실패했습니다. 잠시 후 다시 시도해 주세요", "Échec de la requête. Réessayez plus tard", "La solicitud falló. Inténtalo de nuevo más tarde"],
  "shared.error.http": ["请求失败（{status}）", "Request failed ({status})", "リクエストに失敗しました（{status}）", "請求失敗（{status}）", "요청 실패 ({status})", "Échec de la requête ({status})", "Error en la solicitud ({status})"],
  "shared.error.unknown": ["未知错误", "Unknown error", "不明なエラー", "未知錯誤", "알 수 없는 오류", "Erreur inconnue", "Error desconocido"],
  "shared.error.payloadLimit": ["数据超过 {limit} 字节上限", "Data exceeds the {limit}-byte limit", "データが上限の {limit} バイトを超えています", "資料超過 {limit} 位元組上限", "데이터가 {limit}바이트 제한을 초과했습니다", "Les données dépassent la limite de {limit} octets", "Los datos superan el límite de {limit} bytes"],
  "shared.error.wcaId": ["WCA ID 长度应为 10", "WCA ID must be 10 characters long", "WCA ID は10文字で入力してください", "WCA ID 長度應為 10", "WCA ID는 10자여야 합니다", "L’identifiant WCA doit contenir 10 caractères", "El ID de WCA debe tener 10 caracteres"],
  "shared.error.queryLength": ["搜索内容过长", "Search query is too long", "検索文字列が長すぎます", "搜尋內容太長", "검색어가 너무 깁니다", "La recherche est trop longue", "La búsqueda es demasiado larga"],
  "shared.error.adminOnly": ["人工核查确认仅限管理员", "Only administrators can confirm a manual review", "手動確認は管理者のみ実行できます", "只有管理員可以確認人工核查", "관리자만 수동 검토를 확인할 수 있습니다", "Seuls les administrateurs peuvent confirmer une vérification manuelle", "Solo los administradores pueden confirmar una revisión manual"],
  "shared.error.reviewReason": ["人工核查理由不能为空", "A manual review reason is required", "手動確認の理由を入力してください", "請填寫人工核查理由", "수동 검토 사유를 입력해 주세요", "Un motif de vérification manuelle est requis", "Es obligatorio indicar el motivo de la revisión manual"],
  "shared.error.createCompetition": ["创建比赛失败", "Could not create competition", "大会を作成できませんでした", "建立比賽失敗", "대회 생성 실패", "Impossible de créer la compétition", "No se pudo crear la competición"],
  "shared.error.invalidHistory": ["练习历史数据无效", "Invalid practice history data", "練習履歴データが無効です", "練習紀錄資料無效", "연습 기록 데이터가 잘못되었습니다", "Données d’historique d’entraînement invalides", "Los datos del historial de práctica no son válidos"],
  "shared.error.historyConflict": ["练习历史数据冲突", "Conflicting practice history data", "練習履歴データが競合しています", "練習紀錄資料有衝突", "연습 기록 데이터가 충돌합니다", "Conflit dans l’historique d’entraînement", "Conflicto en los datos del historial de práctica"],
  "shared.error.historyFormat": ["不支持的练习历史格式", "Unsupported practice history format", "未対応の練習履歴形式です", "不支援嘅練習紀錄格式", "지원하지 않는 연습 기록 형식입니다", "Format d’historique d’entraînement non pris en charge", "Formato de historial de práctica no compatible"],
  "shared.error.sessionMissing": ["练习会话已不存在，请重新开始练习", "This practice session no longer exists. Start a new session", "練習セッションがありません。新しく開始してください", "練習階段已不存在，請重新開始", "연습 세션이 없습니다. 새로 시작해 주세요", "Cette session n’existe plus. Commencez une nouvelle session", "Esta sesión ya no existe. Inicia una nueva"],
  "shared.error.databaseUnavailable": ["浏览器不支持 IndexedDB", "IndexedDB is unavailable", "IndexedDB を利用できません", "無法使用 IndexedDB", "IndexedDB를 사용할 수 없습니다", "IndexedDB est indisponible", "IndexedDB no está disponible"],
  "shared.error.databaseOpen": ["无法打开练习历史数据库", "Cannot open the practice history database", "練習履歴データベースを開けません", "無法開啟練習紀錄資料庫", "연습 기록 데이터베이스를 열 수 없습니다", "Impossible d’ouvrir la base d’historique d’entraînement", "No se puede abrir la base de datos del historial"],
  "shared.error.databaseBlocked": ["数据库升级受阻，请关闭其他标签页", "Database upgrade blocked. Close other tabs", "データベースを更新できません。他のタブを閉じてください", "資料庫更新受阻，請關閉其他分頁", "데이터베이스 업그레이드가 차단되었습니다. 다른 탭을 닫아 주세요", "Mise à niveau bloquée. Fermez les autres onglets", "Actualización bloqueada. Cierra las otras pestañas"],
  "shared.error.transaction": ["练习历史事务已中止", "Practice history transaction aborted", "練習履歴の処理が中止されました", "練習紀錄交易已中止", "연습 기록 트랜잭션이 중단되었습니다", "Transaction d’historique interrompue", "Transacción del historial cancelada"],
  "shared.error.practiceConfig": ["练习配置无效", "Invalid practice configuration", "練習設定が無効です", "練習設定無效", "연습 설정이 잘못되었습니다", "Configuration d’entraînement invalide", "Configuración de práctica no válida"],
  "shared.error.backupFormat": ["备份格式无效或版本不受支持", "Invalid backup format or unsupported version", "バックアップ形式が無効か、未対応のバージョンです", "備份格式無效或版本不受支援", "백업 형식이 잘못되었거나 지원하지 않는 버전입니다", "Format de sauvegarde invalide ou version non prise en charge", "Formato de copia de seguridad no válido o versión no compatible"],
  "shared.error.storageVerification": ["存储校验失败", "Storage verification failed", "保存データの検証に失敗しました", "儲存驗證失敗", "저장 데이터 확인 실패", "Échec de la vérification du stockage", "Error al verificar el almacenamiento"],
  "shared.error.import": ["导入失败", "Import failed", "インポートに失敗しました", "匯入失敗", "가져오기 실패", "Échec de l’importation", "Error al importar"],
  "shared.error.rollback": ["设置回滚失败", "Settings rollback failed", "設定を復元できませんでした", "設定還原失敗", "설정 복원 실패", "Échec de la restauration des paramètres", "Error al restaurar la configuración"],
  "shared.proficiency.mastered": ["精通", "Mastered", "習得済み", "精通", "완전 숙달", "Maîtrisé", "Dominado"],
  "shared.proficiency.skilled": ["熟练", "Skilled", "熟練", "熟練", "숙련", "Confirmé", "Avanzado"],
  "shared.proficiency.average": ["一般", "Average", "普通", "一般", "보통", "Moyen", "Intermedio"],
  "shared.proficiency.unskilled": ["生疏", "Unskilled", "不慣れ", "生疏", "미숙", "Débutant", "Principiante"],
  "shared.proficiency.unknown": ["未知", "Unknown", "未評価", "未知", "미평가", "Non évalué", "Sin evaluar"],
} as const;

export type EditorMessagePath = keyof typeof editorMessages;
export type SharedMessageKey = keyof typeof messages | `shared.editor.${EditorMessagePath}`;
export type SharedLocale = "zh-CN" | "en-US" | "ja" | "yue-Hant-HK" | "ko" | "fr" | "es";
function catalog(index: number): Record<SharedMessageKey, string> {
  return Object.fromEntries([
    ...Object.entries(messages).map(([key, values]) => [key, values[index]]),
    ...Object.entries(editorMessages).map(([key, values]) => [`shared.editor.${key}`, values.split("|")[index]]),
  ]) as Record<SharedMessageKey, string>;
}
export const sharedZhCN = catalog(0);
export const sharedEnUS = catalog(1);
export const sharedJa = catalog(2);
export const sharedYue = catalog(3);
export const sharedKo = catalog(4);
export const sharedFr = catalog(5);
export const sharedEs = catalog(6);

const catalogs: Record<SharedLocale, Record<SharedMessageKey, string>> = {
  "zh-CN": sharedZhCN, "en-US": sharedEnUS, ja: sharedJa,
  "yue-Hant-HK": sharedYue, ko: sharedKo, fr: sharedFr, es: sharedEs,
};
export function isSharedMessageKey(key: string): key is SharedMessageKey {
  return Object.hasOwn(sharedZhCN, key);
}
export function translateShared(locale: string, key: SharedMessageKey, params: Record<string, string | number> = {}): string {
  const normalized = isLocale(locale) ? locale : "zh-CN";
  return formatMessage(normalized, key, catalogs[normalized][key], params);
}

export function markdownEditorResources(locale: string): Record<string, Record<string, string>> {
  const resources: Record<string, Record<string, string>> = {};
  for (const path of Object.keys(editorMessages) as EditorMessagePath[]) {
    const [group, key] = path.split(".");
    (resources[group] ??= {})[key] = translateShared(locale, `shared.editor.${path}`);
  }
  return resources;
}
