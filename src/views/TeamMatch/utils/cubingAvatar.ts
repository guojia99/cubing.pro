import { apiGetCubingChinaPerson } from '@/services/cubing-pro/wca/cubing_china_person';

/**
 * 经后端拉取粗饼选手页，返回头像图片 URL（HTTPS，可直接作 Avatar src）
 */
export async function fetchCubingAvatarUrl(wcaId: string): Promise<string | null> {
  const id = wcaId.trim();
  if (id.length !== 10) return null;
  const res = await apiGetCubingChinaPerson(id);
  if (res.code !== 'OK' || !res.person) return null;
  const url = res.person.avatar_url?.trim();
  return url || null;
}
