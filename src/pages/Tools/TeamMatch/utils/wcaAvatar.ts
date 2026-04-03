import { apiGetWCAPersonProfile } from '@/services/cubing-pro/wca/wca_api';

/**
 * 从 WCA persons API 获取头像缩略图 URL（与致谢栏 ThanksSection 一致，使用 person.avatar.thumb_url）
 * 例如：https://avatars.worldcubeassociation.org/uploads/user/avatar/2018SHEN07/1520499207_thumb.JPG
 */
export async function fetchWcaAvatarThumbUrl(wcaId: string): Promise<string | null> {
  const id = wcaId.trim();
  if (id.length !== 10) return null;
  const res = await apiGetWCAPersonProfile(id);
  const url = res.person?.avatar?.thumb_url;
  return url && typeof url === 'string' ? url : null;
}
