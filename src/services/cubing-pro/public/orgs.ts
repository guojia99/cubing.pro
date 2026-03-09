import { Thank } from '@/services/cubing-pro/auth/typings';
import {Request} from "@/services/cubing-pro/request";

export async function apiPublicOrganizers(): Promise<any>{
  const response = await Request.get<any>('public/orgs')

  return response.data
}


export async function getAcknowledgments(): Promise<Thank[]> {
  const response = await Request.get<Thank[]>('/public/acknowledgments')

  return response.data
}
