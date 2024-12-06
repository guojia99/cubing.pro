import { AuthHeader, removeToken, saveToken } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
import {AuthAPI} from "@/services/cubing-pro/auth/typings";

export async function captchaCode(): Promise<AuthAPI.captchaCodeResp> {
  const result = await Request.get('/auth/code');
  return result.data;
}

/** 登录接口 POST /api/login/account */
export async function login(body: AuthAPI.LoginRequest) {
  const response = await Request.post<AuthAPI.Token>('/auth/login', body);
  // 检查响应并保存token
  if (response && response.data.token) {
    saveToken(response.data);
  }
  return response;
}

export async function getEmailCode(body: AuthAPI.GetEmailCodeRequest) {
  return Request.post<{
    data: AuthAPI.GetEmailCodeResponse;
  }>('/auth/register/email_code', body, { headers: AuthHeader() });
}

export async function refreshToken() {
  return await Request.post<AuthAPI.Token>('/auth/refresh', { headers: AuthHeader() });
}

export async function logout() {
  removeToken();
  return Request.post<AuthAPI.Token>('/auth/logout', {}, { headers: AuthHeader() });
}

export async function currentUser() {
  return Request.get<{ data: AuthAPI.CurrentUser }>('/auth/current', { headers: AuthHeader() });
}

export async function register(req: AuthAPI.RegisterRequest) {
  return Request.post<any>('/auth/register', req);
}

export async function updateAvatar(req: AuthAPI.UpdateAvatarRequest) {
  return Request.post<any>('/auth/user/avatar', req, { headers: AuthHeader() });
}


