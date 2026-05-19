// /v3/cube-api/wca/player/:wcaID/rank_timers
import { Request } from '@/services/cubing-pro/request';
import { AuthHeader } from '@/services/cubing-pro/auth/token';
export async function GetPlayerRankTimers(personID) {
    const response = await Request.get(`/wca/player/${personID}/rank_timers`, {
        headers: AuthHeader(),
    });
    return response.data.data;
}
// --------- 改造后的函数 ---------
export async function getWCAPersonProfile(wcaID) {
    if (wcaID.length !== 10)
        throw new Error('WCAID错误');
    const response = await Request.get(`/wca/player/${wcaID}`, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function getWCAPersonCompetitions(wcaID) {
    if (wcaID.length !== 10)
        throw new Error('WCAID错误');
    const response = await Request.get(`/wca/player/${wcaID}/competitions`, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function getWCAPersonResults(wcaID) {
    if (wcaID.length !== 10)
        throw new Error('WCAID错误');
    const response = await Request.get(`/wca/player/${wcaID}/results`, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function getWCAPersons(query) {
    if (query.length >= 32)
        throw new Error('内容太长');
    const response = await Request.get(`/wca/players/${query}`, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function getPersonBestRanks(wcaID) {
    if (wcaID.length !== 10)
        throw new Error('WCAID错误');
    const response = await Request.get(`/wca/player/${wcaID}/best_ranks`, {
        headers: AuthHeader(),
    });
    return response.data;
}
//# sourceMappingURL=player.js.map