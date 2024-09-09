import {Request} from "@/services/cubing-pro/request";


export async function apiComps(params: CompsAPI.CompsReq): Promise<CompsAPI.CompsResp> {
  if (params.name) {
    const response = await Request.post<CompsAPI.CompsResp>(
      "/public/comps/",
      {
        ...params,
        like: {
          name: params.name
        }
      },
      {params: params}
    )
    return response.data
  }

  const response = await Request.get<CompsAPI.CompsResp>(
    "/public/comps/",
    {params: params}
  )
  return response.data
}
