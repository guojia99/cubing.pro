const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY = 1000; // 重试间隔，毫秒

async function fetchWithRetry<T>(url: string, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`404: 请求资源未找到: ${url}`);
        }
        throw new Error(`请求失败: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      // 如果是最后一次或 404 错误，抛出
      if (attempt === retries || err.message.includes('404')) {
        console.error(`请求失败（不再重试）: ${url}`, err);
        throw err;
      }
      console.warn(`请求失败，${RETRY_DELAY}ms 后重试 (${attempt + 1}/${retries}): ${url}`, err);
      await new Promise((resolve) => {setTimeout(resolve, RETRY_DELAY)});
    }
  }
  throw new Error('未能获取数据'); // 理论上不会触发
}

