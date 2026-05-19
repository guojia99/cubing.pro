import { unwrapOtherLinks } from '@/services/cubing-pro/otherLinksNormalize';
import { Request } from '@/services/cubing-pro/request';
export async function apiPublicOrganizers() {
    const response = await Request.get('public/orgs');
    return response.data;
}
export async function apiPublicCompGroups() {
    const response = await Request.get('public/comp_groups');
    return response.data;
}
export async function getAcknowledgments() {
    const response = await Request.get('/public/acknowledgments');
    return response.data;
}
export async function getOtherLinks() {
    const response = await Request.get('/public/otherLinks');
    return unwrapOtherLinks(response.data);
}
//# sourceMappingURL=orgs.js.map