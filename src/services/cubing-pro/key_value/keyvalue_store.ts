import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';

type KeyValue = {
  Key: string;
  Value: string;
  Type: number; // 1 string 2 int 3 json
};

async function getKeyValue(key: string): Promise<{ data: KeyValue }> {
  const response = await Request.get<{ data: KeyValue }>(`/user/kv/${key}`, {
    headers: AuthHeader(),
  });
  return response.data;
}

async function setKeyValue(key: string, value: any) {
  const response = await Request.post<{ data: KeyValue }>(
    `/user/kv/`,
    {
      Key: key,
      Value: JSON.stringify(value),
      Type: 3,
    },
    { headers: AuthHeader() },
  );
  return response.data;
}

// 获取某个 key 对应的 map（如果没有，返回空对象）
export async function getKeyMap(key: string): Promise<Record<string, any>> {
  try {
    const { data } = await getKeyValue(key);
    return JSON.parse(data.Value);
  } catch (e) {
    // 可以按需处理 404 等错误
  }
  return {}; // 默认空 map
}

// 获取 key 下某个 subkey 的值
export async function getSubKeyValue(key: string, subKey: string): Promise<any | undefined> {
  const map = await getKeyMap(key);
  return map[subKey];
}

// 设置 key 下某个 subkey 的值
export async function setSubKeyValue(key: string, subKey: string, value: any): Promise<void> {
  const map = await getKeyMap(key);
  map[subKey] = value;
  await setKeyValue(key, map); // 更新整个 map
}

// 删除 key 下的某个 subkey
export async function deleteSubKey(key: string, subKey: string): Promise<void> {
  const map = await getKeyMap(key);
  if (subKey in map) {
    delete map[subKey];
    await setKeyValue(key, map);
  }
}
