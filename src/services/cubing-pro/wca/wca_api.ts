import {  WcaProfilePerson } from '@/services/cubing-pro/wca/types';

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
export async function apiGetWCAPersonProfile(wcaID: string): Promise<WcaProfilePerson> {
  if (wcaID.length !== 10) throw new Error('WCAID错误');
  const url = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}`;
  return fetchWithRetry<WcaProfilePerson>(url);
}
