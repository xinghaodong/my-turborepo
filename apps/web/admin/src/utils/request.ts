import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '@repo/types/api';

const BASE_URL = 'http://localhost:3002/api';

// 基础配置
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 标记是否正在刷新 Token
let isRefreshing = false;
// 存储因为等待刷新 Token 而挂起的请求
let requests: any[] = [];

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
  console.log('用户已登出');
}

async function handleUnauthorized(config: InternalAxiosRequestConfig) {
  console.log('Token 过期，尝试刷新...');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    handleLogout();
    return Promise.reject(new Error('未登录或 Token 缺失'));
  }

  if (!isRefreshing) {
    isRefreshing = true;

    try {
      const res = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      if (res.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 刷新成功，重新执行挂起的请求
        isRefreshing = false;
        requests.forEach((cb) => cb(accessToken));
        requests = [];

        // 重新执行当前请求
        if (config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return request(config);
      } else {
        throw new Error('刷新 Token 失败');
      }
    } catch (refreshError) {
      isRefreshing = false;
      handleLogout();
      return Promise.reject(refreshError);
    }
  } else {
    // 正在刷新中，将请求挂起
    return new Promise((resolve) => {
      requests.push((token: string) => {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        resolve(request(config));
      });
    });
  }
}

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
request.interceptors.response.use(
  async (response) => {
    const res = response.data as ApiResponse;

    // 如果业务逻辑失败
    if (res.success === false) {
      // 重点：由于后端的 HttpException Filter，任何 HTTP 错误都会以 200 返回并在 body 里携带 success: false 和对应的 code
      // 登录和刷新接口如果有 401 (账号密码错误等) 应直接弹出错误，不应走过期重试和登出逻辑
      if (res.code === 401 && response.config && !response.config.url?.includes('/auth/login') && !response.config.url?.includes('/auth/refresh')) {
        return handleUnauthorized(response.config as InternalAxiosRequestConfig);
      }

      message.error(res.message || '请求失败');
      return Promise.reject(res);
    }

    // 重点：直接返回响应中的 data 部分
    // 这样外部调用时 let res = await request.get<User>('/users') 后，res 直接就是 User 类型
    return res.data;
  },
  async (error: AxiosError) => {
    console.log(error, 'error');
    const { response, config } = error;

    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh');
    // 兜底处理：如果依然有原生抛出的 401 HTTP 状态码
    if (response?.status === 401 && config && !isAuthEndpoint) {
      return handleUnauthorized(config as InternalAxiosRequestConfig);
    }

    const res = error as any as ApiResponse;
    if (res?.code === 401 && config && !isAuthEndpoint) {
      return handleUnauthorized(config as InternalAxiosRequestConfig);
    }

    message.error(res?.message || error.message || '系统错误');
    return Promise.reject(error);
  },
);

export default request;
