import type { Locale } from "../locales";

type Translations = readonly [string, string, string, string, string, string, string];

// zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es
const messages = {
  "notification.title": ["通知", "Notifications", "通知", "通知", "알림", "Notifications", "Notificaciones"],
  "notification.all": ["全部", "All", "すべて", "全部", "전체", "Toutes", "Todas"],
  "notification.replies": ["回复我的", "Replies to me", "自分への返信", "回覆我嘅留言", "내게 온 답글", "Réponses reçues", "Respuestas recibidas"],
  "notification.announcements": ["系统公告", "System announcements", "システムのお知らせ", "系統公告", "시스템 공지", "Annonces du système", "Avisos del sistema"],
  "notification.unread": ["未读", "unread", "未読", "未讀", "읽지 않음", "non lues", "sin leer"],
  "notification.markRead": ["标为已读", "Mark as read", "既読にする", "標示為已讀", "읽음으로 표시", "Marquer comme lue", "Marcar como leída"],
  "notification.viewAll": ["查看全部", "View all", "すべて見る", "查看全部", "모두 보기", "Tout afficher", "Ver todas"],
  "notification.empty": ["暂无通知", "No notifications yet", "通知はまだありません", "暫時未有通知", "아직 알림이 없습니다", "Aucune notification", "Aún no hay notificaciones"],
  "notification.error": ["通知操作失败，请重试。", "Could not update notifications. Please try again.", "通知を更新できませんでした。再試行してください。", "通知操作失敗，請再試。", "알림을 업데이트할 수 없습니다. 다시 시도하세요.", "Impossible de mettre à jour les notifications. Réessayez.", "No se pudieron actualizar las notificaciones. Inténtalo de nuevo."],
  "notification.replyTitle": ["收到一条回复", "You received a reply", "返信が届きました", "收到一則回覆", "답글을 받았습니다", "Vous avez reçu une réponse", "Has recibido una respuesta"],
  "notification.announcementTitle": ["系统公告", "System announcement", "システムのお知らせ", "系統公告", "시스템 공지", "Annonce du système", "Aviso del sistema"],
  "notification.guestHint": ["登录后可查看个人回复，并在不同设备间同步公告已读状态。", "Sign in to view personal replies and sync read announcements across devices.", "ログインすると自分への返信を確認し、お知らせの既読状態を端末間で同期できます。", "登入後可查看個人回覆，並喺唔同裝置同步公告已讀狀態。", "로그인하면 개인 답글을 확인하고 여러 기기에서 공지 읽음 상태를 동기화할 수 있습니다.", "Connectez-vous pour consulter vos réponses et synchroniser les annonces lues entre vos appareils.", "Inicia sesión para ver tus respuestas y sincronizar los avisos leídos entre dispositivos."],
} as const satisfies Record<string, Translations>;

const locales: Locale[] = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];
export type NotificationMessageKey = keyof typeof messages;
export function notificationCatalog(locale: Locale) {
  const index = locales.indexOf(locale);
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])) as Record<NotificationMessageKey, string>;
}
