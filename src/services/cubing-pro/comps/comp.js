import { Request } from "@/services/cubing-pro/request";
export async function apiComp(id) {
    const response = await Request.get("/public/comps/" + id);
    return response.data;
}
export async function apiCompRecord(id) {
    const response = await Request.get("/public/comps/" + id + "/record");
    return response.data;
}
//# sourceMappingURL=comp.js.map