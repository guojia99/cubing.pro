import { Request } from "@/services/cubing-pro/request";
export async function apiCompResult(id) {
    const response = await Request.get("/public/comps/" + id + "/result");
    return response.data;
}
//# sourceMappingURL=result.js.map