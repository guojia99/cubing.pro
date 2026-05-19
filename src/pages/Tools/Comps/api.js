import axios from 'axios';
export async function fetchCompetitions(options) {
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
    const res = await axios.get(url);
    return res.data;
}
//# sourceMappingURL=api.js.map