import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
export async function apiMeOrganizers() {
    const response = await Request.get('/organizers/me', {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiOrganizers(orgId) {
    const response = await Request.get('/organizers/' + orgId, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiCreateComps(orgID, req) {
    const response = await Request.post('/organizers/' + orgID + '/comp/', req, {
        headers: AuthHeader(),
    });
    return response.data;
}
// 注意路由带orgID
export async function apiGetComps(orgID) {
    const response = await Request.get('/organizers/' + orgID + '/comp/', {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiGetOrgComp(orgID, compId) {
    const response = await Request.get('/organizers/' + orgID + '/comp/' + compId, {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiGetGroups(orgID) {
    const response = await Request.get('/organizers/' + orgID + '/groups', {
        headers: AuthHeader(),
    });
    return response.data;
}
export async function apiEndComp(orgId, compId) {
    const response = await Request.post('/organizers/' + orgId + '/comp/' + compId + '/end', {}, { headers: AuthHeader() });
    return response.data;
}
export async function apiGetAllPlayers(orgId, compId) {
    const response = await Request.get('/organizers/' + orgId + '/comp/' + compId + '/all_players', { headers: AuthHeader() });
    return response.data;
}
export async function apiGetCompsResults(orgId, compId, eventId, eventRoundNum) {
    const response = await Request.get('organizers/' +
        orgId +
        '/comp/' +
        compId +
        '/result' +
        '?event_id=' +
        eventId +
        '&round_num=' +
        eventRoundNum, { headers: AuthHeader() });
    return response.data;
}
export async function apiGetCompsResultsWithPlayer(orgId, compId, cubeId) {
    const response = await Request.get('organizers/' + orgId + '/comp/' + compId + '/result' + '?cube_id=' + cubeId, { headers: AuthHeader() });
    return response.data;
}
export async function apiAddCompResults(orgId, compId, eventId, eventRoundNum, results, cubeID) {
    const response = await Request.post('organizers/' + orgId + '/comp/' + compId + '/result', {
        Results: results,
        CubeID: cubeID,
        eventId: eventId,
        Round: eventRoundNum,
    }, { headers: AuthHeader() });
    return response.data;
}
export async function apiGetCompsPreResult(orgId, compId, finish, page, size) {
    let f = '/pre_results?page=' + page + '&size=' + size;
    if (finish !== undefined) {
        f += '&finish=';
        f += finish ? '1' : '0';
    }
    const response = await Request.get('organizers/' + orgId + '/comp/' + compId + f, { headers: AuthHeader() });
    return response.data;
}
export async function apiApprovalCompsPreResult(orgId, compId, ok, result_id) {
    const response = await Request.post('organizers/' + orgId + '/comp/' + compId + '/pre_results/' + result_id + '/approval', {
        FinishDetail: ok ? 'ok' : 'not',
    }, { headers: AuthHeader() });
    return response.data;
}
export async function apiDeleteCompsResult(orgId, compId, result_id) {
    const response = await Request.delete('organizers/' + orgId + '/comp/' + compId + '/result/' + result_id, { headers: AuthHeader() });
    return response.data;
}
export async function apiUpdateCompName(orgId, compId, newName) {
    const response = await Request.post('organizers/' + orgId + '/comp/' + compId + '/update_name', {
        newName: newName,
    }, { headers: AuthHeader() });
    return response.data;
}
//# sourceMappingURL=organizers.js.map