import request from '@/utils/request';

/**
 * 获取公开房间列表 (管理员可以搜索)
 */
export const getPublicRooms = (params?: { search?: string; tag?: string }) => {
  return request.get('/rooms/public', { params });
};

/**
 * 创建新房间 (管理员辅助创建)
 */
export const createRoom = (data: {
  title: string;
  description?: string;
  isPublic?: boolean;
  password?: string;
  tags?: string[];
}) => {
  return request.post('/rooms', data);
};

/**
 * 更新房间信息
 */
export const updateRoom = (id: string, data: any) => {
  return request.put(`/rooms/${id}`, data);
};

/**
 * 加入房间 (管理员可以测试加入)
 */
export const joinRoom = (data: { inviteCode: string; password?: string }) => {
  return request.post('/rooms/join', data);
};

/**
 * 获取所有房间 分页
 */
export const getRooms = (params?: { page?: number; limit?: number }) => {
  return request.get('/rooms', { params });
};
