import request from '../utils/request.js';
import { PaginatedResponse } from '@repo/types/api';
import { User } from '@repo/types/user';

/** 获取用户列表 */
export const getUserList = (params?: { page?: number; limit?: number }) => {
  return request.get<PaginatedResponse<User>>('/users', {
    params,
  }) as any;
};

export const getTestApi = () => {
  return request.get('/users/test') as any;
};

/** 修改用户角色 */
export const updateUserRole = (id: string, role: string) => {
  return request.patch(`/users/${id}/role`, { role }) as any as Promise<User>;
};

/** 启用/停用用户 */
export const toggleUserActive = (id: string) => {
  return request.patch(`/users/${id}/toggle-active`) as any as Promise<User>;
};