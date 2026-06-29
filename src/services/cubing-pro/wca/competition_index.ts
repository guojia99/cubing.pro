/** WCA 官方 competition_index 接口返回的赛事条目 */
export interface WcaCompetitionIndexItem {
  id: string;
  name: string;
  venue: string;
  registration_open: string;
  registration_close: string;
  start_date: string;
  end_date: string;
  short_display_name: string;
  city: string;
  country_iso2: string;
  event_ids: string[];
  latitude_degrees: number;
  longitude_degrees: number;
  announced_at: string;
  class: string;
}

export interface FetchCompetitionsOptions {
  countryIso2: string;
  events?: string[];
  page?: number;
}

const WCA_COMPETITION_INDEX =
  'https://www.worldcubeassociation.org/api/v0/competition_index';

/** 近 14 天内已开始或未来的比赛（与旧版 api.ts 一致） */
function ongoingAndFutureDate(): string {
  return new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
}

export async function fetchWcaCompetitionIndex(
  options: FetchCompetitionsOptions,
): Promise<WcaCompetitionIndexItem[]> {
  const { countryIso2, events = [], page = 1 } = options;

  const params = new URLSearchParams({
    country_iso2: countryIso2,
    include_cancelled: 'false',
    ongoing_and_future: ongoingAndFutureDate(),
    sort: 'start_date,end_date,name',
    page: page.toString(),
  });

  for (const event of events) {
    params.append('event_ids[]', event);
  }

  const res = await fetch(`${WCA_COMPETITION_INDEX}?${params}`);
  if (!res.ok) {
    throw new Error(`WCA API ${res.status}`);
  }
  const data = (await res.json()) as WcaCompetitionIndexItem[];
  return Array.isArray(data) ? data : [];
}
