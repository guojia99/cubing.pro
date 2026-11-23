const messages = {
  "siteAnnouncement.title": ["网站公告", "Site announcement", "サイトのお知らせ", "網站公告", "사이트 공지", "Annonce du site", "Aviso del sitio"],
  "siteAnnouncement.details": ["查看详情", "View details", "詳細を見る", "睇詳情", "자세히 보기", "Voir les détails", "Ver detalles"],
  "siteAnnouncement.close": ["关闭", "Close", "閉じる", "關閉", "닫기", "Fermer", "Cerrar"],
  "siteAnnouncement.adminHint": ["访客进站时会看到当前公告。修改正文或链接会让它重新显示。", "Visitors see the active announcement when they enter the site. Changing the message or link shows it again.", "来訪者には入場時に公開中のお知らせが表示されます。本文やリンクを変更すると再表示されます。", "訪客入站時會睇到目前公告。改咗正文或連結會重新顯示。", "방문자가 사이트에 들어오면 게시 중인 공지가 표시됩니다. 문구나 링크를 바꾸면 다시 표시됩니다.", "L’annonce active s’affiche à l’arrivée sur le site. Modifier le texte ou le lien la fera réapparaître.", "El aviso activo se muestra al entrar al sitio. Al cambiar el texto o el enlace, volverá a aparecer."],
  "siteAnnouncement.active": ["展示中", "Published", "公開中", "展示中", "게시 중", "Publié", "Publicado"],
  "siteAnnouncement.inactive": ["未展示", "Not published", "非公開", "未展示", "게시 안 됨", "Non publié", "Sin publicar"],
  "siteAnnouncement.text": ["公告正文", "Message", "お知らせ本文", "公告正文", "공지 내용", "Message", "Mensaje"],
  "siteAnnouncement.link": ["详情链接（选填）", "Details link (optional)", "詳細リンク（任意）", "詳情連結（選填）", "상세 링크(선택)", "Lien vers les détails (facultatif)", "Enlace a los detalles (opcional)"],
  "siteAnnouncement.linkHint": ["填写以 / 开头的站内路径或完整 HTTPS 地址。", "Use a site path starting with / or a full HTTPS URL.", "/ から始まるサイト内パス、または完全な HTTPS URL を入力してください。", "填 / 開頭嘅站內路徑或完整 HTTPS 網址。", "/로 시작하는 사이트 경로 또는 전체 HTTPS 주소를 입력하세요.", "Saisissez un chemin du site commençant par / ou une URL HTTPS complète.", "Introduce una ruta del sitio que empiece por / o una URL HTTPS completa."],
  "siteAnnouncement.save": ["保存", "Save", "保存", "儲存", "저장", "Enregistrer", "Guardar"],
  "siteAnnouncement.publish": ["发布", "Publish", "公開", "發布", "게시", "Publier", "Publicar"],
  "siteAnnouncement.withdraw": ["下线", "Unpublish", "公開を取り消す", "下線", "게시 취소", "Dépublier", "Retirar"],
  "siteAnnouncement.saved": ["公告已保存并展示。", "The announcement is published.", "お知らせは公開中です。", "公告已儲存並展示。", "공지가 게시되었습니다.", "L’annonce est publiée.", "El aviso está publicado."],
  "siteAnnouncement.withdrawn": ["已下线，正文与链接已保留。", "Unpublished. The message and link were kept.", "公開を取り消しました。本文とリンクは保存されています。", "已下線，保留正文同連結。", "게시가 취소되었습니다. 문구와 링크는 유지됩니다.", "Annonce retirée. Le message et le lien sont conservés.", "Aviso retirado. Se conservaron el mensaje y el enlace."],
  "siteAnnouncement.loadError": ["暂时无法加载公告设置。", "Could not load the announcement settings.", "お知らせ設定を読み込めませんでした。", "暫時載入唔到公告設定。", "공지 설정을 불러올 수 없습니다.", "Impossible de charger les paramètres de l’annonce.", "No se pudo cargar la configuración del aviso."],
  "siteAnnouncement.writeError": ["操作未成功，请重试。", "The operation failed. Please try again.", "操作に失敗しました。もう一度お試しください。", "操作未成功，請再試。", "작업에 실패했습니다. 다시 시도하세요.", "L’opération a échoué. Veuillez réessayer.", "La operación falló. Inténtalo de nuevo."],
  "siteAnnouncement.retry": ["重试", "Retry", "再試行", "重試", "다시 시도", "Réessayer", "Reintentar"],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type SiteAnnouncementMessageKey = keyof typeof messages;

export function siteAnnouncementCatalog(column: number): Record<SiteAnnouncementMessageKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<SiteAnnouncementMessageKey, string>;
}
