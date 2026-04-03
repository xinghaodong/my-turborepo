import axios, { InternalAxiosRequestConfig } from 'axios';

// 动态获取当前访问的主机名（IP 或 localhost），确保手机端访问时能正确连接到后端 API
const API_PORT = 3002;
const BASE_URL = `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;

const request: any = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

let isRefreshing = false;
let requests: any[] = [];

function handleLogout() {
    localStorage.removeItem('khaccessToken');
    localStorage.removeItem('khrefreshToken');
    window.location.href = '/login';
}

async function handleUnauthorized(config: InternalAxiosRequestConfig) {
    const refreshToken = localStorage.getItem('khrefreshToken');

    if (!refreshToken) {
        handleLogout();
        return Promise.reject(new Error('未登录 or Token 缺失'));
    }

    if (!isRefreshing) {
        isRefreshing = true;

        try {
            const res = await axios.post(`${BASE_URL}/auth/refresh`, {
                refreshToken,
            });

            if (res.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = res.data.data;
                localStorage.setItem('khaccessToken', accessToken);
                localStorage.setItem('khrefreshToken', newRefreshToken);

                isRefreshing = false;
                requests.forEach((cb) => cb(accessToken));
                requests = [];

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

request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = localStorage.getItem('khaccessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error: any) => Promise.reject(error),
);

request.interceptors.response.use(
    async (response: any) => {
        const res = response.data;

        if (res.success === false) {
            if (res.code === 401 && !response.config.url?.includes('/auth/login') && !response.config.url?.includes('/auth/refresh')) {
                return handleUnauthorized(response.config as InternalAxiosRequestConfig);
            }
            return Promise.reject(res);
        }

        return res.data;
    },
    async (error: any) => {
        const { response, config } = error;
        if (response?.status === 401 && config && !config.url?.includes('/auth/login')) {
            return handleUnauthorized(config as InternalAxiosRequestConfig);
        }
        return Promise.reject(error);
    },
);

export default request;
