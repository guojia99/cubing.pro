import { Request } from '@/services/cubing-pro/request';
export async function GetPKTimer(params) {
    const response = await Request.get('/public/pkTimers', { params });
    return response.data;
}
//# sourceMappingURL=pktimer.js.map