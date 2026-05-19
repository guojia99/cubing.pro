import { AuthHeader, removeToken, saveToken } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
export async function captchaCode() {
    const result = await Request.get('/auth/code');
    return result.data;
}
/** 登录接口 POST /api/login/account */
export async function login(body) {
    const response = await Request.post('/auth/login', body);
    // 检查响应并保存token
    if (response && response.data.token) {
        saveToken(response.data);
    }
    return response;
}
export async function getEmailCode(body) {
    return Request.post('/auth/register/email_code', body, { headers: AuthHeader() });
}
export async function refreshToken() {
    return await Request.post('/auth/refresh', { headers: AuthHeader() });
}
export async function logout() {
    removeToken();
    return Request.post('/auth/logout', {}, { headers: AuthHeader() });
}
export async function currentUser() {
    return Request.get('/auth/current', { headers: AuthHeader() });
}
export async function register(req) {
    return Request.post('/auth/register', req);
}
export async function updateAvatar(req) {
    return Request.post('/auth/user/avatar', req, { headers: AuthHeader() });
}
export async function updateDetail(req) {
    return Request.post('/auth/user/detail', req, { headers: AuthHeader() });
}
//# sourceMappingURL=auth.js.map