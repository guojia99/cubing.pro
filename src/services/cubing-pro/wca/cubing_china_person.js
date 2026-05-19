import { Request } from '@/services/cubing-pro/request';
/**
 * GET /wca/cubing-china/person/:wcaID（后端代理粗饼选手页）
 * WCA ID 非法时后端返回 400；合法时 HTTP 200，data.code 区分 OK / NOT_FOUND 等。
 */
export async function apiGetCubingChinaPerson(wcaId) {
    const id = wcaId.trim();
    if (id.length !== 10) {
        throw new Error('WCA ID 长度应为 10');
    }
    const res = await Request.get(`/wca/cubing-china/person/${encodeURIComponent(id)}`);
    return res.data.data;
}
//# sourceMappingURL=cubing_china_person.js.map