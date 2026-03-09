import { AuthHeader } from '@/services/cubing-pro/auth/token';
import {  Thank } from '@/services/cubing-pro/auth/typings';
import { Request } from '@/services/cubing-pro/request';


export async function getAcknowledgmentsWithAdmin(): Promise<Thank[]> {
  const result = await Request.get<Thank[]>('/admin/system_result/acknowledgments', { headers: AuthHeader() });
  return result.data;
}


export async function setAcknowledgmentsWithAdmin(req: Thank[]): Promise<undefined> {
  const result = await Request.put('/admin/system_result/acknowledgments', req, { headers: AuthHeader() });
  return result.data;
}
