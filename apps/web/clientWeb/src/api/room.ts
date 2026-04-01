import request from '@/utils/request';

/**
 * 获取公开房间列表 (搜索/标签)
 */
export const getPublicRooms = (params?: { search?: string; tag?: string }) => {
  return request.get('/rooms/public', { params }) as any;
};

/**
 * 获取我加入的房间
 */
export const getMyRooms = () => {
  return request.get('/rooms/my') as any;
};

/**
 * 获取房间详情 (包含协作者列表)
 */
export const getRoomDetail = (id: string) => {
  return request.get(`/rooms/${id}`) as any;
};

/**
 * 加入房间
 */
export const joinRoom = (data: { inviteCode: string; password?: string }) => {
  return request.post('/rooms/join', data) as any;
};
