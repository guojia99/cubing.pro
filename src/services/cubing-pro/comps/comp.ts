
import {Request} from "@/services/cubing-pro/request";
import {CompAPI} from "@/services/cubing-pro/comps/typings";


export async function apiComp(id: string): Promise<CompAPI.CompResp> {
  const response = await Request.get<CompAPI.CompResp>(
    "/public/comps/" + id,
  )
  return response.data
}
