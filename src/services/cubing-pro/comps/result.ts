import {Request} from "@/services/cubing-pro/request";


export async function apiCompResult(id: number): Promise<CompResultAPI.CompResultResp> {
  const response = await Request.get<CompResultAPI.CompResultResp>(
    "/public/comps/" + id + "/result",
  )
  return response.data
}
