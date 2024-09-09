import {history} from 'umi';
import {refreshToken} from "@/services/cubing-pro/auth/auth";


const AUTH_TOKEN_KEY = 'authToken_cubing_pro';

export const saveToken = (token: AuthAPI.Token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token));
};

export const getToken = (): AuthAPI.Token | null => {
  const str = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!str) {
    return null
  }
  return JSON.parse(str) as AuthAPI.Token
};

export const removeToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};


const REFRESH_INTERVAL = 5 * 60 * 1000; // 每5分钟检查一次

export const AuthHeader = () => {
  const token = getToken();
  return {
    "Authorization": "Bearer " + token?.token,
    // "x-cubing-pro": "Cubing-pro",
    "Accept": 'application/json',
  }
}


export const refreshTokenInter = async () => {
  const token = getToken();
  if (!token) {
    return;
  }
  refreshToken().then((value) => {
    if (value) {
      const expireTime = new Date(value.data.expire)
      const currentTime = new Date();
      const timeDifference = expireTime.getTime() - currentTime.getTime(); // 时间差以毫秒为单位
      // 计算15分钟的毫秒数
      const fifteenMinutesInMilliseconds = 15 * 60 * 1000;
      // 检查时间差是否小于等于15分钟
      if (timeDifference <= fifteenMinutesInMilliseconds) {
        return
      }
      saveToken(value.data);
      return
    }
    // 如果刷新token失败，可能token已经过期，需要用户重新登录
    removeToken()
  })
};


export const startTokenRefresh = async () => {
  await refreshTokenInter();
  setInterval(refreshTokenInter, REFRESH_INTERVAL);
};
