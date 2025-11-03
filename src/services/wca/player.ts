import {
  WCACompetition,
  WcaProfile,
  WCAResult,
  WCAUserRole,
  WCAUserRoleResponse,
} from '@/services/wca/types';


export async function fetchUserRoles(userId: number): Promise<WCAUserRole[]> {
  const apiUrl = `https://www.worldcubeassociation.org/api/v0/user_roles?sort=lead%2CeligibleVoter%2CgroupTypeRank%2Cstatus%3Adesc%2CgroupName&isActive=true&isGroupHidden=false&userId=${userId}&per_page=100`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WCAUserRoleResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
}
async function fetchWithRetry<T>(url: string, retries = 3, delayMs = 500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 404) {
        throw new Error('404'); // 404 不重试
      }

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message === '404') {
        throw error; // 直接抛出 404
      }

      if (attempt < retries) {
        console.warn(`请求失败，重试中 (${attempt + 1}/${retries})...`, error);
        await new Promise(res => {setTimeout(res, delayMs)});
      } else {
        throw error; // 超过重试次数仍失败，抛出错误
      }
    }
  }
  throw new Error('未知错误'); // 防止类型报错
}

// --------- 改造后的函数 ---------
export async function getWCAPersonProfile(wcaID: string): Promise<WcaProfile> {
  if (wcaID.length !== 10) throw new Error('WCAID错误');
  const url = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}`;
  return fetchWithRetry<WcaProfile>(url);
}

export async function getWCAPersonCompetitions(wcaID: string): Promise<WCACompetition[]> {
  const url = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}/competitions`;
  return fetchWithRetry<WCACompetition[]>(url);
}

export async function getWCAPersonResults(wcaID: string): Promise<WCAResult[]> {
  if (wcaID.length !== 10) throw new Error('WCAID错误');
  const url = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}/results`;
  return fetchWithRetry<WCAResult[]>(url);
}
