import { Request } from '@/services/cubing-pro/request';
export async function apiKinch(req) {
    const response = await Request.post('public/statistics/kinch', {
        ...req,
    });
    return response.data;
}
export async function apiSeniorKinch(req) {
    const response = await Request.post('public/statistics/kinch/senior', {
        ...req,
    });
    return response.data;
}
//# sourceMappingURL=sor.js.map