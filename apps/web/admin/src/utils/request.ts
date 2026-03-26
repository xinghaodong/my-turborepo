import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '@repo/types/api';

// 基础配置
const request = axios.create({
  baseURL: 'http://localhost:3002/api',
  timeout: 10000,
});

// 标记是否正在刷新 Token
let isRefreshing = false;
// 存储因为等待刷新 Token 而挂起的请求
let requests: any[] = [];

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
  (response) => {
    const res = response.data as ApiResponse;
    
    // 如果业务逻辑失败
    if (res.success === false) {
      message.error(res.message || '请求失败');
      return Promise.reject(res);
    }
    
    // 重点：直接返回响应中的 data 部分
    // 这样外部调用时 let res = await request.get<User>('/users') 后，res 直接就是 User 类型
    return res.data;
  },
  async (error: AxiosError) => {
    const { response, config } = error;
    
    // 如果后端返回了 401 且不是登录相关的接口
    if (response?.status === 401 && config && !config.url?.includes('/auth/login')) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const res = await axios.post<ApiResponse<{ accessToken: string, refreshToken: string }>>(
            'http://localhost:3002/api/auth/refresh',
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

    // 处理 B：如果业务代码是 401（针对我们在 Filter 里做的 200 逻辑）
    const res = error as any as ApiResponse;
    if (res.code === 401) {
       // ... 逻辑同上，可以抽象成一个 refresh 方法
    }

    message.error(res.message || '系统错误');
    return Promise.reject(error);
  },
);

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // window.location.href = '/login';
  console.log('用户已登出');
}

export default request;
