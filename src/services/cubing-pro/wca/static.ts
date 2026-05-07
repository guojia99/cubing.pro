import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
import {
  AllEventAvgPersonResults, AllEventChampionshipsPodium,
  RankWithEventsStatic,
  RankWithPersonCompStartYear,
  StaticSuccessRateResult,
  StaticWithTimerRank,
  WCAResult,
} from '@/services/cubing-pro/wca/types';

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
    `/wca/ranks/historical/full/${eventID}`,
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


export async function GetEventRankWithFullNow(
  eventID: string,
  country: string,
  is_avg: boolean,
  page: number,
  size: number,
): Promise<{
  data: WCAResult[];
  total: number;
}>{
  const response = await Request.post<{
    data: WCAResult[];
    total: number;
  }>(
    `/wca/ranks/full/${eventID}`,
    {
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


export async function GetEventRankWithOnlyYear(
  eventID: string,
  year: number,
  country: string,
  is_avg: boolean,
  page: number,
  size: number,
  month: number = 0,
): Promise<{
  data: WCAResult[];
  total: number;
}> {
  const response = await Request.post<{
    data: WCAResult[];
    total: number;
  }>(
    `/wca/ranks/historical/${eventID}`,
    {
      year: year,
      month,
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

export async function GetRankWithStartCompYear(
  eventID: string,
  year: number,
  country: string,
  is_avg: boolean,
  page: number,
  size: number,
): Promise<{
  data: RankWithPersonCompStartYear[];
  total: number;
}> {
  const response = await Request.post<{
    data: RankWithPersonCompStartYear[];
    total: number;
  }>(
    `/wca/rank/rank-with-start-comp-year/${eventID}`,
    {
      year,
      country,
      is_avg,
      page,
      size,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}


export async function GetStaticSuccessRateResult(
  eventID: string,
  country: string,
  page: number,
  size: number,
  minAttempted: number = 3,
): Promise<{
  data: StaticSuccessRateResult[];
  total: number;
}> {
  const response = await Request.post<{
    data: StaticSuccessRateResult[];
    total: number;
  }>(
    `/wca/ranks/success_rate/${eventID}`,
    {
      country: country,
      page: page,
      size: size,
      min_attempted: minAttempted,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}



export async function GetAllEventsAchievement(
  lackNum: number = 0,
  country: string,
  page: number,
  size: number,
): Promise<{
  data: AllEventAvgPersonResults[];
  total: number;
}> {
  const response = await Request.post<{
    data: AllEventAvgPersonResults[];
    total: number;
  }>(
    `/wca/ranks/all-events-achiever`,
    {
      country: country,
      page: page,
      size: size,
      lackNum: lackNum,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}

/** 多项目综合排行：所选项目的世界（或国家）名次之和，越小越靠前；events 传空表示全部正式项目 */
export async function GetRankWithDiyEvents(
  events: string[],
  country: string,
  is_avg: boolean,
  page: number,
  size: number,
): Promise<{
  data: RankWithEventsStatic[];
  total: number;
}> {
  const response = await Request.post<{
    data: RankWithEventsStatic[];
    total: number;
  }>(
    `/wca/ranks/diy_events`,
    {
      events,
      country,
      is_avg,
      page,
      size,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}

/** 在综合排行基础上仅保留从未登上领奖台的选手；best_misser 为 4 时表示「殿军之王」 */
export async function GetNotPodiumRankWithDiyEvents(
  events: string[],
  country: string,
  best_misser: number,
  is_avg: boolean,
  page: number,
  size: number,
): Promise<{
  data: RankWithEventsStatic[];
  total: number;
}> {
  const response = await Request.post<{
    data: RankWithEventsStatic[];
    total: number;
  }>(
    `/wca/rank/diy_events/not_podium`,
    {
      events,
      country,
      best_misser,
      is_avg,
      page,
      size,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}


export async function GetAllEventChampionshipsPodium(): Promise<AllEventChampionshipsPodium[]>{
  const response = await Request.get<AllEventChampionshipsPodium[]>(
    `/wca/grand-slam`,    {
      headers: AuthHeader(),
    },
  )
  return response.data
}
