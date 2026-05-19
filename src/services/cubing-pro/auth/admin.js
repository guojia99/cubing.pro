import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
export async function apiApprovalComp(compId) {
    const response = await Request.post('/admin/competition/approvals/' + compId + '/approval', {
        Ok: true,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
/** 管理员删除比赛（含成绩、报名等），需管理员或超级管理员权限 */
export async function apiAdminDeleteComp(compId) {
    const response = await Request.delete(`/admin/competition/comps/${compId}`, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiAdminPlayers(params) {
    const response = await Request.post('/admin/users/', {
        like: {
            name: params.name,
            cube_id: params.name,
        },
        page: params.page,
        size: params.size,
    }, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiAdminCreatePlayer(params) {
    const response = await Request.post('/admin/users/create_user', params, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiAdminUpdatePlayerName(params) {
    const response = await Request.put('/admin/users/update_user_name', params, { headers: AuthHeader() });
    return response.data;
}
export async function apiAdminUpdatePlayerWCAID(params) {
    const response = await Request.put('/admin/users/update_wca_id', params, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiUpdatePlayerAuth(params) {
    const response = await Request.post('/admin/users/update_auth', params, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiMergePlayers(params) {
    const response = await Request.post('/admin/users/merge_user', params, {
        headers: AuthHeader(),
    });
    return response.data;
}
//# sourceMappingURL=admin.js.map