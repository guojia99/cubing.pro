import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';

export async function apiApprovalComp(compId: number): Promise<any> {
  const response = await Request.post<any>(
    '/admin/competition/approvals/' + compId + '/approval',
    {
      Ok: true,
    },
    {
      headers: AuthHeader(),
    },
  );

  return response.data;
}
