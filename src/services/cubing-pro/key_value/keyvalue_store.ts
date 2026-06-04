import { AuthHeader } from "@/services/cubing-pro/auth/token";
import { Request } from "@/services/cubing-pro/request";

type KeyValue = {
  Key: string;
  Value: string;
  Type: number;
};

async function getKeyValue(key: string): Promise<{ data: KeyValue }> {
  const response = await Request.get<{ data: KeyValue }>(
    `/user/kv/${encodeURIComponent(key)}`,
    { headers: AuthHeader() },
  );
  return response.data;
}

async function setKeyValue(key: string, value: unknown) {
  await Request.post(
    `/user/kv/`,
    { key, value: JSON.stringify(value), type: 3 },
    { headers: AuthHeader() },
  );
}

export async function getKeyMap(key: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await getKeyValue(key);
    const raw =
      (data as { value?: string; Value?: string }).value ??
      (data as { Value?: string }).Value ??
      "";
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function setSubKeyValue(
  key: string,
  subKey: string,
  value: unknown,
): Promise<void> {
  const map = await getKeyMap(key);
  map[subKey] = value;
  await setKeyValue(key, map);
}
