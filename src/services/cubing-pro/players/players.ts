
import {Request} from "@/services/cubing-pro/request";


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

