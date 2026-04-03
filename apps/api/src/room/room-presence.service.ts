import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomPresenceService {
  // roomId -> Set of connections
  private roomConnections = new Map<string, Set<any>>();

  /** 添加连接 */
  joinRoom(roomId: string, connection: any) {
    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
    }
    const connections = this.roomConnections.get(roomId);
    if (connections) {
      connections.add(connection);
      connection.roomId = roomId; // 绑定用于断开时查找
    }
  }

  /** 移除连接 */
  leaveRoom(connection: any) {
    const roomId = connection.roomId;
    if (roomId) {
      const connections = this.roomConnections.get(roomId);
      if (connections) {
        connections.delete(connection);
        if (connections.size === 0) {
          this.roomConnections.delete(roomId);
        }
      }
    }
  }

  /** 获取实时在线人数 */
  getOnlineCount(roomId: string): number {
    return this.roomConnections.get(roomId)?.size || 0;
  }

  /** 向房间内所有在线用户广播消息 */
  broadcastToRoom(roomId: string, data: any) {
    const connections = this.roomConnections.get(roomId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((conn) => {
        // 使用 ws 库的原生 send 方法
        if (conn.readyState === 1) {
          // 确认连接处于 OPEN 状态
          conn.send(message);
        }
      });
    }
  }
}
