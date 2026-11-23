const messages = {
  "siteAnnouncement.title": ["公告", "Site announcement", "サイトのお知らせ", "網站公告", "사이트 공지", "Annonce du site", "Aviso del sitio"],
  "siteAnnouncement.fieldTitle": ["标题", "Title", "タイトル", "標題", "제목", "Titre", "Título"],
  "siteAnnouncement.back": ["返回公告列表", "Back to announcements", "お知らせ一覧に戻る", "返回公告列表", "공지 목록으로 돌아가기", "Retour aux annonces", "Volver a los avisos"],
  "siteAnnouncement.close": ["关闭", "Close", "閉じる", "關閉", "닫기", "Fermer", "Cerrar"],
  "siteAnnouncement.adminHint": ["公告发布后可通过顶栏铃铛和通知中心查看。", "Published announcements appear in the header bell and notification center.", "公開したお知らせはヘッダーのベルと通知センターに表示されます。", "公告發佈後可喺頂欄鈴鐺同通知中心查看。", "게시된 공지는 상단 알림 벨과 알림 센터에서 확인할 수 있습니다.", "Les annonces publiées sont accessibles via la cloche et le centre de notifications.", "Los avisos publicados aparecen en la campana y el centro de notificaciones."],
  "siteAnnouncement.new": ["新建公告", "New announcement", "新しいお知らせ", "新增公告", "새 공지", "Nouvelle annonce", "Nuevo aviso"],
  "siteAnnouncement.edit": ["编辑公告", "Edit announcement", "お知らせを編集", "編輯公告", "공지 편집", "Modifier l’annonce", "Editar aviso"],
  "siteAnnouncement.list": ["公告列表", "Announcements", "お知らせ一覧", "公告列表", "공지 목록", "Annonces", "Avisos"],
  "siteAnnouncement.empty": ["暂无公告", "No announcements yet", "お知らせはまだありません", "暫無公告", "아직 공지가 없습니다", "Aucune annonce pour le moment", "No hay avisos todavía"],
  "siteAnnouncement.active": ["已发布", "Published", "公開中", "展示中", "게시 중", "Publié", "Publicado"],
  "siteAnnouncement.inactive": ["已下线", "Unpublished", "非公開", "未展示", "게시 안 됨", "Non publié", "Sin publicar"],
  "siteAnnouncement.text": ["公告正文", "Message", "お知らせ本文", "公告正文", "공지 내용", "Message", "Mensaje"],
  "siteAnnouncement.save": ["保存修改", "Save changes", "変更を保存", "儲存修改", "변경 사항 저장", "Enregistrer les modifications", "Guardar cambios"],
  "siteAnnouncement.publish": ["发布", "Publish", "公開", "發布", "게시", "Publier", "Publicar"],
  "siteAnnouncement.withdraw": ["下线", "Unpublish", "公開を取り消す", "下線", "게시 취소", "Dépublier", "Retirar"],
  "siteAnnouncement.republish": ["重新发布", "Republish", "再公開", "重新發佈", "다시 게시", "Republier", "Volver a publicar"],
  "siteAnnouncement.published": ["已发布", "Published", "公開済み", "已發布", "게시 완료", "Publié", "Publicado"],
  "siteAnnouncement.saved": ["已保存", "Saved", "保存済み", "已儲存", "저장 완료", "Enregistré", "Guardado"],
  "siteAnnouncement.withdrawn": ["已下线", "Unpublished", "公開取り消し済み", "已下線", "게시 취소", "Dépublié", "Retirado"],
  "siteAnnouncement.loadError": ["暂时无法加载公告设置。", "Could not load the announcement settings.", "お知らせ設定を読み込めませんでした。", "暫時載入唔到公告設定。", "공지 설정을 불러올 수 없습니다.", "Impossible de charger les paramètres de l’annonce.", "No se pudo cargar la configuración del aviso."],
  "siteAnnouncement.writeError": ["操作未成功，请重试。", "The operation failed. Please try again.", "操作に失敗しました。もう一度お試しください。", "操作未成功，請再試。", "작업에 실패했습니다. 다시 시도하세요.", "L’opération a échoué. Veuillez réessayer.", "La operación falló. Inténtalo de nuevo."],
  "siteAnnouncement.retry": ["重试", "Retry", "再試行", "重試", "다시 시도", "Réessayer", "Reintentar"],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type SiteAnnouncementMessageKey = keyof typeof messages;

export function siteAnnouncementCatalog(column: number): Record<SiteAnnouncementMessageKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<SiteAnnouncementMessageKey, string>;
}
