import axios from 'axios';

export interface WcaCompetition {
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

interface FetchCompetitionsOptions {
  countryIso2: string;
  events?: string[]; // event 过滤，如 ["333", "444"]
  page?: number;     // 页码，默认 1
}

export async function fetchCompetitions(
  options: FetchCompetitionsOptions,
): Promise<WcaCompetition[]> {
  const { countryIso2, events = [], page = 1 } = options;

  // 近 14 天前的日期
  const date = new Date(Date.now() - 14 * 86400000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    country_iso2: countryIso2,
    include_cancelled: "false",
    ongoing_and_future: date,
    sort: "start_date,end_date,name",
    page: page.toString(),
  });

  // 添加 event_ids[]
  for (const event of events) {
    params.append("event_ids[]", event);
  }

  const url = `https://www.worldcubeassociation.org/api/v0/competition_index?${params}`;
  const res = await axios.get<WcaCompetition[]>(url);
  return res.data;
}
