import { Request } from "@/services/cubing-pro/request";
export async function apiRecords(req) {
    const response = await Request.post('public/statistics/records', {
        ...req,
    });
    return response.data;
}
//# sourceMappingURL=records.js.map