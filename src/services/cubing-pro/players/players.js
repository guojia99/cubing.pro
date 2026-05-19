import { Request } from "@/services/cubing-pro/request";
export async function apiPlayers(params) {
    const response = await Request.post("/public/player/", {
        like: {
            name: params.name
        },
        page: params.page,
        size: params.size,
    });
    return response.data;
}
export async function apiPlayer(cubeID) {
    const response = await Request.get("/public/player/" + cubeID);
    return response.data;
}
export async function apiPlayerResults(cubeId) {
    const response = await Request.get("public/player/" + cubeId + "/results");
    return response.data;
}
export async function apiPlayerRecords(cubeId) {
    const response = await Request.get("public/player/" + cubeId + "/records");
    return response.data;
}
export async function apiPlayerNemesis(cubeId) {
    const response = await Request.get("public/player/" + cubeId + "/nemesis");
    return response.data;
}
export async function apiPlayerComps(cubeId) {
    const response = await Request.get("public/player/" + cubeId + "/comps");
    return response.data;
}
export async function apiPlayerSor(cubeId) {
    const response = await Request.get("public/player/" + cubeId + "/sor");
    return response.data;
}
//# sourceMappingURL=players.js.map