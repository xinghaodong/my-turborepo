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