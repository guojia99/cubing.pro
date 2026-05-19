import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
export async function GetEventRankTimers(eventID, year, country, is_avg, page, size) {
    const response = await Request.post(`/wca/ranks/historical/full/${eventID}`, {
        year: year,
        country: country,
        is_avg: is_avg,
        page: page,
        size: size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function GetEventRankWithFullNow(eventID, country, is_avg, page, size) {
    const response = await Request.post(`/wca/ranks/full/${eventID}`, {
        country: country,
        is_avg: is_avg,
        page: page,
        size: size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function GetEventRankWithOnlyYear(eventID, year, country, is_avg, page, size, month = 0) {
    const response = await Request.post(`/wca/ranks/historical/${eventID}`, {
        year: year,
        month,
        country: country,
        is_avg: is_avg,
        page: page,
        size: size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function GetRankWithStartCompYear(eventID, year, country, is_avg, page, size) {
    const response = await Request.post(`/wca/rank/rank-with-start-comp-year/${eventID}`, {
        year,
        country,
        is_avg,
        page,
        size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function GetStaticSuccessRateResult(eventID, country, page, size, minAttempted = 3) {
    const response = await Request.post(`/wca/ranks/success_rate/${eventID}`, {
        country: country,
        page: page,
        size: size,
        min_attempted: minAttempted,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function GetAllEventsAchievement(lackNum = 0, country, page, size) {
    const response = await Request.post(`/wca/ranks/all-events-achiever`, {
        country: country,
        page: page,
        size: size,
        lackNum: lackNum,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
/** 多项目综合排行：所选项目的世界（或国家）名次之和，越小越靠前；events 传空表示全部正式项目 */
export async function GetRankWithDiyEvents(events, country, is_avg, page, size) {
    const response = await Request.post(`/wca/ranks/diy_events`, {
        events,
        country,
        is_avg,
        page,
        size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
/** 在综合排行基础上仅保留从未登上领奖台的选手；best_misser 为 4 时表示「殿军之王」 */
export async function GetNotPodiumRankWithDiyEvents(events, country, best_misser, is_avg, page, size) {
    const response = await Request.post(`/wca/rank/diy_events/not_podium`, {
        events,
        country,
        best_misser,
        is_avg,
        page,
        size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function GetAllEventChampionshipsPodium() {
    const response = await Request.get(`/wca/grand-slam`, {
        headers: AuthHeader(),
    });
    return response.data;
}
//# sourceMappingURL=static.js.map