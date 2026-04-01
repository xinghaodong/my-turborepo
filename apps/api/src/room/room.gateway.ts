import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WebSocketServer as WS_Server } from 'ws';
import { RoomService } from './room.service.js';
import { RoomPresenceService } from './room-presence.service.js';
import { JwtService } from '@nestjs/jwt';

import { setupWSConnection } from 'y-websocket/bin/utils';

@WebSocketGateway({
  path: '/collaboration',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: WS_Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly presenceService: RoomPresenceService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(connection: any, request: any) {
    const url = new URL(
      request.url,
      `http://${request.headers.host || 'localhost'}`,
    );
    const docName = url.searchParams.get('room') || 'default';
    let token = url.searchParams.get('token');

    // 防御性代码：清除由于 y-websocket 客户端补全导致的末尾斜杠
    if (token && token.endsWith('/')) {
      token = token.replace(/\/$/, '');
    }

    let user = { username: '游客' };

    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        user = { username: payload.email || '未知用户' };
        // 将用户信息存入 connection 方便断开时使用
        connection.user = user;
      } catch (e) {
        console.error('[Yjs] Token 验证失败:', e.message);
      }
    }

    console.log(`[Yjs] 用户 [${user.username}] 进入房间: ${docName}`);

    // 记录在线状态
    this.presenceService.joinRoom(docName, connection);

    setupWSConnection(connection, request, {
      docName: docName,
      gc: true,
    });
  }

  handleDisconnect(connection: any) {
    const username = connection.user?.username || '未知用户';
    console.log(`[Yjs] 用户 [${username}] 已离开`);
    // 移除在线状态
    this.presenceService.leaveRoom(connection);
  }
}
