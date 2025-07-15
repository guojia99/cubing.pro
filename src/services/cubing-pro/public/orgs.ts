import {Request} from "@/services/cubing-pro/request";

export async function apiPublicOrganizers(): Promise<any>{
  const response = await Request.get<any>('public/orgs')

  return response.data
}
