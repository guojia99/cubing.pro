import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
import { StaticWithTimerRank } from '@/services/cubing-pro/wca/types';

export async function GetEventRankTimers(
  eventID: string,
  year: number,
  country: string,
  is_avg: boolean,
  page: number,
  size: number,
): Promise<{
  data: StaticWithTimerRank[];
  total: number;
}> {
  const response = await Request.post<{
    data: StaticWithTimerRank[];
    total: number;
  }>(
    `/wca/ranks/${eventID}`,
    {
      year: year,
      country: country,
      is_avg: is_avg,
      page: page,
      size: size,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}
