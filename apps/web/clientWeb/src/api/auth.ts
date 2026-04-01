import request from '@/utils/request';

export const login = (data: any) => request.post('/auth/login', data) as any;
export const register = (data: any) => request.post('/auth/register', data) as any;
export const getProfile = () => request.get('/auth/profile') as any;
