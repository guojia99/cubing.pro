import type { Locale } from "../locales";

type Translations = readonly [string, string, string, string, string, string, string];

// zh-CN, en-US, ja, yue-Hant-HK, ko, fr, es
const messages = {
  "forum.class": ["{className} 讨论", "{className} discussion", "{className} の議論", "{className} 討論", "{className} 토론", "Discussion {className}", "Debate de {className}"],
  "forum.classScope": ["讨论整个 {className} 分类", "Discuss the entire {className} class", "{className} カテゴリ全体について議論", "討論成個 {className} 分類", "{className} 분류 전체 토론", "Discuter de toute la catégorie {className}", "Debatir toda la categoría {className}"],
  "forum.discuss": ["讨论", "Discuss", "議論", "討論", "토론", "Discussion", "Debate"],
  "forum.group": ["分组讨论", "Discuss group", "グループで議論", "分組討論", "그룹 토론", "Discuter du groupe", "Debatir el grupo"],
  "forum.solution": ["讨论这条解法", "Discuss this solution", "この解法について議論", "討論呢個解法", "이 해법 토론", "Discuter de cette solution", "Debatir esta solución"],
  "forum.viewContext": ["查看上下文", "View context", "前後のコメントを見る", "查看上下文", "맥락 보기", "Voir le contexte", "Ver contexto"],
  "forum.viewFormula": ["查看公式", "View formula", "手順を見る", "查看公式", "해법 보기", "Voir la formule", "Ver fórmula"],
  "forum.recent": ["最近讨论", "Recent discussions", "最近の議論", "最近討論", "최근 토론", "Discussions récentes", "Debates recientes"],
  "forum.replies": ["回复我的", "Replies to me", "自分への返信", "回覆我嘅留言", "내게 온 답글", "Mes réponses reçues", "Respuestas recibidas"],
  "forum.moderation": ["公式发言管理", "Algorithm comment moderation", "手順のコメント管理", "公式留言管理", "해법 댓글 관리", "Modération des commentaires", "Moderación de comentarios"],
  "forum.moderationHint": ["查看和删除公式库中的发言。", "Review and remove algorithm library comments.", "手順ライブラリのコメントを確認・削除します。", "查看同刪除公式庫嘅留言。", "해법 라이브러리의 댓글을 확인하고 삭제합니다.", "Consulter et supprimer les commentaires de la bibliothèque.", "Consulta y elimina comentarios de la biblioteca."],
  "forum.reply": ["回复", "Reply", "返信", "回覆", "답글", "Répondre", "Responder"],
  "forum.replyTo": ["回复 {name}", "Reply to {name}", "{name} への返信", "回覆 {name}", "{name}님에게 답글", "Réponse à {name}", "Respuesta a {name}"],
  "forum.write": ["写评论", "Write a comment", "コメントを書く", "寫留言", "댓글 쓰기", "Écrire un commentaire", "Escribe un comentario"],
  "forum.post": ["发表", "Post", "投稿", "發表", "게시", "Publier", "Publicar"],
  "forum.login": ["登录后参与讨论", "Sign in to join the discussion", "ログインして議論に参加", "登入後參與討論", "로그인하고 토론에 참여", "Connectez-vous pour participer", "Inicia sesión para participar"],
  "forum.deleted": ["该评论已删除", "This comment was deleted", "このコメントは削除されました", "呢則留言已刪除", "삭제된 댓글입니다", "Ce commentaire a été supprimé", "Se eliminó este comentario"],
  "forum.deletePrompt": ["删除这条评论？已有回复将保留。", "Delete this comment? Replies will remain.", "このコメントを削除しますか？返信は残ります。", "刪除呢則留言？現有回覆會保留。", "이 댓글을 삭제할까요? 답글은 유지됩니다.", "Supprimer ce commentaire ? Les réponses seront conservées.", "¿Eliminar este comentario? Se conservarán las respuestas."],
  "forum.empty": ["暂无评论", "No comments yet", "コメントはまだありません", "暫時未有留言", "아직 댓글이 없습니다", "Aucun commentaire", "Aún no hay comentarios"],
  "forum.noRecent": ["还没有公开讨论", "No public discussions yet", "公開された議論はまだありません", "暫時未有公開討論", "아직 공개 토론이 없습니다", "Aucune discussion publique", "Aún no hay debates públicos"],
  "forum.noReplies": ["还没有人回复你", "No replies yet", "返信はまだありません", "暫時未有人回覆你", "아직 받은 답글이 없습니다", "Vous n’avez pas encore reçu de réponse", "Aún no has recibido respuestas"],
  "forum.unread": ["未读", "Unread", "未読", "未讀", "읽지 않음", "Non lu", "Sin leer"],
  "forum.targetUnavailable": ["公式不可用", "Formula unavailable", "手順を表示できません", "公式無法顯示", "해법을 볼 수 없습니다", "Formule indisponible", "Fórmula no disponible"],
  "forum.markRead": ["标为已读", "Mark as read", "既読にする", "標示為已讀", "읽음으로 표시", "Marquer comme lu", "Marcar como leída"],
  "forum.comments": ["发言数", "Comments", "コメント数", "留言數", "댓글 수", "Commentaires", "Comentarios"],
  "forum.error": ["操作失败，请重试。", "Request failed. Please try again.", "処理に失敗しました。再試行してください。", "操作失敗，請再試。", "실패했습니다. 다시 시도하세요.", "La requête a échoué. Réessayez.", "La solicitud falló. Inténtalo de nuevo."],
  "forum.blocked": ["评论包含受限词，请修改后再发表。", "Please edit the restricted wording before posting.", "制限語を編集してから投稿してください。", "留言包含受限詞，請修改後再發表。", "제한 단어를 수정한 후 게시하세요.", "Modifiez les termes interdits avant de publier.", "Modifica los términos restringidos antes de publicar."],
} as const satisfies Record<string, Translations>;

const locales: Locale[] = ["zh-CN", "en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"];
export type ForumMessageKey = keyof typeof messages;
export function forumCatalog(locale: Locale) {
  const index = locales.indexOf(locale);
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])) as Record<ForumMessageKey, string>;
}
