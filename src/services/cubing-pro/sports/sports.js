import { AuthHeader } from "@/services/cubing-pro/auth/token";
import { Request } from '@/services/cubing-pro/request';
export async function apiGetSportResults(query) {
    const response = await Request.get('/sports/admin/results', {
        headers: AuthHeader(),
        params: query,
    });
    return response.data;
}
export async function apiCreateSportResult(params) {
    const response = await Request.post('/sports/admin/results', params, { headers: AuthHeader() });
    return response.data;
}
export async function apiDeleteSportResult(id) {
    const response = await Request.delete(`/sports/admin/results/${id}`, { headers: AuthHeader() });
    return response.data;
}
export async function apiGetSportEvents() {
    const response = await Request.get('/sports/admin/events', { headers: AuthHeader() });
    return response.data;
}
export async function apiCreateSportEvent(params) {
    const response = await Request.post('/sports/admin/events', params, { headers: AuthHeader() });
    return response.data;
}
export async function apiDeleteSportEvent(id) {
    const response = await Request.delete(`/sports/admin/events/${id}`, { headers: AuthHeader() });
    return response.data;
}
//# sourceMappingURL=sports.js.map