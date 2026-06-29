
import { type ApiRequestConfig, Request } from "@/services/cubing-pro/request";
import { PlayersAPI } from "@/services/cubing-pro/players/typings";

function withSignal(config?: ApiRequestConfig) {
  return config?.signal ? { signal: config.signal } : undefined;
}

export async function apiPlayers(params: PlayersAPI.PlayersReq): Promise<PlayersAPI.PlayersResp> {
  const response = await Request.post<PlayersAPI.PlayersResp>(
    "/public/player/",
    {
      like: {
        name: params.name,
      },
      page: params.page,
      size: params.size,
    },
  );
  return response.data;
}

export async function apiPlayer(
  cubeID: string,
  config?: ApiRequestConfig,
): Promise<PlayersAPI.PlayerResp> {
  const response = await Request.get<PlayersAPI.PlayerResp>(
    `/public/player/${cubeID}`,
    withSignal(config),
  );
  return response.data;
}

export async function apiPlayerResults(
  cubeId: string,
  config?: ApiRequestConfig,
): Promise<PlayersAPI.PlayerResultResp> {
  const response = await Request.get<PlayersAPI.PlayerResultResp>(
    `/public/player/${cubeId}/results`,
    withSignal(config),
  );
  return response.data;
}

export async function apiPlayerRecords(
  cubeId: string,
  config?: ApiRequestConfig,
): Promise<PlayersAPI.PlayerRecordResp> {
  const response = await Request.get<PlayersAPI.PlayerRecordResp>(
    `/public/player/${cubeId}/records`,
    withSignal(config),
  );
  return response.data;
}

export async function apiPlayerNemesis(
  cubeId: string,
  config?: ApiRequestConfig,
): Promise<PlayersAPI.PlayerNemesisResp> {
  const response = await Request.get<PlayersAPI.PlayerNemesisResp>(
    `/public/player/${cubeId}/nemesis`,
    withSignal(config),
  );
  return response.data;
}

export async function apiPlayerComps(
  cubeId: string,
  config?: ApiRequestConfig,
): Promise<PlayersAPI.PlayerCompsResp> {
  const response = await Request.get<PlayersAPI.PlayerCompsResp>(
    `/public/player/${cubeId}/comps`,
    withSignal(config),
  );
  return response.data;
}

export async function apiPlayerSor(
  cubeId: string,
  config?: ApiRequestConfig,
): Promise<PlayersAPI.PlayerSorResp> {
  const response = await Request.get<PlayersAPI.PlayerSorResp>(
    `/public/player/${cubeId}/sor`,
    withSignal(config),
  );
  return response.data;
}
