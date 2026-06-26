import { type ApiRequestConfig, Request } from "@/services/cubing-pro/request";
import { CompResultAPI } from "@/services/cubing-pro/comps/typings";

function withSignal(config?: ApiRequestConfig) {
  return config?.signal ? { signal: config.signal } : undefined;
}

export async function apiCompResult(
  id: number,
  config?: ApiRequestConfig,
): Promise<CompResultAPI.CompResultResp> {
  const response = await Request.get<CompResultAPI.CompResultResp>(
    `/public/comps/${id}/result`,
    withSignal(config),
  );
  return response.data;
}
