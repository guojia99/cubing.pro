import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { unwrapOtherLinks } from '@/services/cubing-pro/otherLinksNormalize';
import { Request } from '@/services/cubing-pro/request';
export async function getAcknowledgmentsWithAdmin() {
    const result = await Request.get('/admin/system_result/acknowledgments', { headers: AuthHeader() });
    return result.data;
}
export async function setAcknowledgmentsWithAdmin(req) {
    const result = await Request.put('/admin/system_result/acknowledgments', req, { headers: AuthHeader() });
    return result.data;
}
export async function getOtherLinksWithAdmin() {
    const result = await Request.get('/admin/system_result/otherLinks', {
        headers: AuthHeader(),
    });
    return unwrapOtherLinks(result.data);
}
export async function setOtherLinksWithAdmin(req) {
    const result = await Request.put('/admin/system_result/otherLinks', req, {
        headers: AuthHeader(),
    });
    return result.data;
}
//# sourceMappingURL=system.js.map