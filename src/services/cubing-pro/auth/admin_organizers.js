import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
export async function apiAdminOrganizersList(params) {
    const response = await Request.get('/admin/competition/organizers', {
        params,
        headers: AuthHeader(),
    });
    return response.data.data;
}
export async function apiAdminCreateOrganizer(body) {
    const response = await Request.post('/admin/competition/organizers', body, { headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminGetOrganizer(orgId) {
    const response = await Request.get(`/admin/competition/organizers/${orgId}`, { headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminUpdateOrganizer(orgId, body) {
    const response = await Request.put(`/admin/competition/organizers/${orgId}`, body, { headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminDeleteOrganizer(orgId) {
    await Request.delete(`/admin/competition/organizers/${orgId}`, { headers: AuthHeader() });
}
export async function apiAdminOrganizerGroups(orgId, params) {
    const response = await Request.get(`/admin/competition/organizers/${orgId}/groups`, { params, headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminCreateGroup(orgId, body) {
    const response = await Request.post(`/admin/competition/organizers/${orgId}/groups`, body, { headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminUpdateGroup(groupId, body) {
    const response = await Request.put(`/admin/competition/groups/${groupId}`, body, { headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminDeleteGroup(groupId) {
    await Request.delete(`/admin/competition/groups/${groupId}`, { headers: AuthHeader() });
}
export async function apiAdminAddOrganizerMember(orgId, body) {
    const response = await Request.post(`/admin/competition/organizers/${orgId}/members`, body, { headers: AuthHeader() });
    return response.data.data;
}
export async function apiAdminRemoveOrganizerMember(orgId, cubeId) {
    const response = await Request.delete(`/admin/competition/organizers/${orgId}/members`, { params: { cube_id: cubeId }, headers: AuthHeader() });
    return response.data.data;
}
//# sourceMappingURL=admin_organizers.js.map