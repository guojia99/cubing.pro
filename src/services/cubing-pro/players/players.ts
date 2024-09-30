
import {Request} from "@/services/cubing-pro/request";
import {PlayersAPI} from "@/services/cubing-pro/players/typings";


export async function apiPlayers(params: PlayersAPI.PlayersReq): Promise<PlayersAPI.PlayersResp> {
  const response = await Request.post<PlayersAPI.PlayersResp>(
    "/public/player/",
    {
      like: {
        name: params.name
      },
      page: params.page,
      size: params.size,
    },
  )
  return response.data
}




export async function apiPlayer(cubeID: string): Promise<PlayersAPI.PlayerResp> {
  const response = await Request.get<PlayersAPI.PlayerResp>(
    "/public/player/" + cubeID,
  )
  return response.data
}



export async function apiPlayerResults(cubeId: string): Promise<PlayersAPI.PlayerResultResp> {
  const response = await Request.get<PlayersAPI.PlayerResultResp>(
    "public/player/" + cubeId + "/results"
  )
  return response.data
}


export async function apiPlayerRecords(cubeId: string): Promise<PlayersAPI.PlayerRecordResp> {
  const response = await Request.get<PlayersAPI.PlayerRecordResp>(
    "public/player/" + cubeId + "/records"
  )
  return response.data
}


export async function apiPlayerNemesis(cubeId: string): Promise<PlayersAPI.PlayerNemesisResp> {
  const response = await Request.get<PlayersAPI.PlayerNemesisResp>(
    "public/player/" + cubeId + "/nemesis"
  )
  return response.data
}

export async function apiPlayerComps(cubeId: string): Promise<PlayersAPI.PlayerCompsResp> {
  const response = await Request.get<PlayersAPI.PlayerCompsResp>(
    "public/player/" + cubeId + "/comps"
  )
  return response.data
}

export async function apiPlayerSor(cubeId: string): Promise<PlayersAPI.PlayerSorResp> {
  const response = await Request.get<PlayersAPI.PlayerSorResp>(
    "public/player/" + cubeId + "/sor"
  )
  return response.data
}
