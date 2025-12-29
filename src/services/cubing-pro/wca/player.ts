// /v3/cube-api/wca/player/:wcaID/rank_timers



import { Request } from '@/services/cubing-pro/request';
import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { StaticWithTimerRank, WCACompetition, WCAPerson, WcaProfile, WCAResult } from './types';





export async function GetPlayerRankTimers(personID: string): Promise<StaticWithTimerRank[]> {

  const response = await Request.get<{data: StaticWithTimerRank[]}>(
    `/wca/player/${personID}/rank_timers`,
    {
      headers: AuthHeader(),
    },
  );
  return response.data.data
}



// --------- 改造后的函数 ---------
export async function getWCAPersonProfile(wcaID: string): Promise<WcaProfile> {
  if (wcaID.length !== 10) throw new Error('WCAID错误');
  const response = await Request.get<WcaProfile>(
    `/wca/player/${wcaID}`,
    {
      headers: AuthHeader(),
    },
  );

  return response.data
}

export async function getWCAPersonCompetitions(wcaID: string): Promise<WCACompetition[]> {
  if (wcaID.length !== 10) throw new Error('WCAID错误');
  const response = await Request.get<WCACompetition[]>(
    `/wca/player/${wcaID}/competitions`,
    {
      headers: AuthHeader(),
    },
  );

  return response.data
}

export async function getWCAPersonResults(wcaID: string): Promise<WCAResult[]> {
  if (wcaID.length !== 10) throw new Error('WCAID错误');
  const response = await Request.get<WCAResult[]>(
    `/wca/player/${wcaID}/results`,
    {
      headers: AuthHeader(),
    },
  );
  return response.data
}


export async function getWCAPersons(query: string): Promise<WCAPerson[]> {
  if (query.length >= 32) throw new Error('内容太长');
  const response = await Request.get<WCAPerson[]>(
    `/wca/players/${query}`,
    {
      headers: AuthHeader(),
    },
  );
  return response.data
}
