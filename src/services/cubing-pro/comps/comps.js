import { Request } from '@/services/cubing-pro/request';
export async function apiComps(params) {
    const response = await Request.post('/public/comps/', {
        like: {
            name: params.name,
        },
        page: params.page,
        size: params.size,
    });
    return response.data;
}
//# sourceMappingURL=comps.js.map