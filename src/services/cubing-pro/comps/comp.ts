import { type ApiRequestConfig, Request } from "@/services/cubing-pro/request";
import { CompAPI, CompRecordAPI } from "@/services/cubing-pro/comps/typings";

function withSignal(config?: ApiRequestConfig) {
  return config?.signal ? { signal: config.signal } : undefined;
}

export async function apiComp(
  id: string,
  config?: ApiRequestConfig,
): Promise<CompAPI.CompResp> {
  const response = await Request.get<CompAPI.CompResp>(`/public/comps/${id}`, withSignal(config));
  return response.data;
}

export async function apiCompRecord(
  id: number,
  config?: ApiRequestConfig,
): Promise<CompRecordAPI.CompRecordResp> {
  const response = await Request.get<CompRecordAPI.CompRecordResp>(
    `/public/comps/${id}/record`,
    withSignal(config),
  );
  return response.data;
}
