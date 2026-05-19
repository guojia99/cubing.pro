import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
export async function apiDiyRanking(key) {
    const response = await Request.get('diy_static/diy_rankings/' + key, {});
    return response.data;
}
export async function apiDiyRankingKinch(key, req) {
    const response = await Request.post('diy_static/diy_rankings/' + key + '/kinch', {
        ...req,
    });
    return response.data;
}
export async function apiGetAllDiyRankingKey() {
    const response = await Request.get('diy_static/diy_rankings', {});
    return response.data;
}
export async function apiUpdateRankingWithKey(key, description, persons) {
    const response = await Request.post(`diy_static/diy_rankings/${key}`, {
        description: description,
        persons: persons,
    }, { headers: AuthHeader() });
    return response.data;
}
export async function apiCreateRanking(key, description) {
    const response = await Request.post(`diy_static/diy_rankings`, {
        description: description,
        key: key,
    }, { headers: AuthHeader() });
    return response.data;
}
export async function apiDiyRankingSor(key, req) {
    const response = await Request.post(`diy_static/diy_rankings/${key}/sor`, req, {});
    return response.data;
}
export async function apiDiyRankingPersons(key) {
    const response = await Request.get(`diy_static/diy_rankings/${key}/person_list`, {});
    return response.data;
}
//# sourceMappingURL=diy_ranking.js.map