
import {Request} from "@/services/cubing-pro/request";
import {CompAPI, CompRecordAPI} from "@/services/cubing-pro/comps/typings";


export async function apiComp(id: string): Promise<CompAPI.CompResp> {
  const response = await Request.get<CompAPI.CompResp>(
    "/public/comps/" + id,
  )
  return response.data
}


export async  function apiCompRecord(id: number): Promise<CompRecordAPI.CompRecordResp> {
  const response = await Request.get<CompRecordAPI.CompRecordResp>(
    "/public/comps/" + id + "/record",
  )
  return response.data
}
