import { OtherLinks, Thank } from '@/services/cubing-pro/auth/typings';
import { unwrapOtherLinks } from '@/services/cubing-pro/otherLinksNormalize';
import { Request } from '@/services/cubing-pro/request';

export async function apiPublicOrganizers(): Promise<any>{
  const response = await Request.get<any>('public/orgs')

  return response.data
}


export async function getAcknowledgments(): Promise<Thank[]> {
  const response = await Request.get<Thank[]>('/public/acknowledgments')

  return response.data
}


export async function getOtherLinks(): Promise<OtherLinks> {
  const response = await Request.get<OtherLinks | OtherLinks[]>('/public/otherLinks');
  return unwrapOtherLinks(response.data);
}
