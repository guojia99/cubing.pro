import {Request} from "@/services/cubing-pro/request";
import {StaticAPI} from "@/services/cubing-pro/statistics/typings";

export async function apiRecords(req?: StaticAPI.RecordsReq): Promise<StaticAPI.RecordsResp> {
  const response = await Request.post<StaticAPI.RecordsResp>('public/statistics/records', {
    ...req,
  });
  return response.data;
}
