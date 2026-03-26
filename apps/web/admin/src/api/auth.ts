import request from '../utils/request.js';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

/** 注册 */
export const registerApi = (data: any) => {
  return request.post<AuthResponse>('/auth/register', data) as any as Promise<AuthResponse>;
};

/** 登录 */
export const loginApi = (data: any) => {
  return request.post<AuthResponse>('/auth/login', data) as any as Promise<AuthResponse>;
};

/** 刷新 Token */
export const refreshTokensApi = (refreshToken: string) => {
  return request.post<{ accessToken: string; refreshToken: string }>(
    '/auth/refresh',
    { refreshToken },
  ) as any as Promise<{ accessToken: string; refreshToken: string }>;
};
