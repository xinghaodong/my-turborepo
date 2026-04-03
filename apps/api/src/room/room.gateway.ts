// 总结 Tiptap + Yjs 的通信流程：
// 数据的起点 (Front-end)：

// 您在编辑器里输入一个词，Tiptap 捕获这个事件，并通知 Y.Doc。
// Y.Doc 是一个在内存中维护的“虚拟文档”，它能计算出这次编辑的最小差异（Binary Update）。
// 传输的通道 (Network)：

// WebsocketProvider 侦听到 Y.Doc 有变动，立刻把这些二进制数据通过 WebSocket 推送到后端的 /collaboration 接口。
// 后端的路由 (Back-end Gateway)：

// RoomGateway 拦截连接，先校验 Token。
// 校验通过后，调用 setupWSConnection。这就像是把前端的吸管插进了后端的大桶里。
// 此时，后端会自动负责把 A 的编辑转发给同房间的 B 和 C，并解决“谁快谁慢”的问题（CRDT 算法）。

import {
  WebSocketGateway, // 1. [装饰器] 类级别：声明这是一个 WebSocket 入口（像控制器）
  WebSocketServer, // 2. [装饰器] 属性级别：把“底层的服务器对象”注入到类里
  OnGatewayConnection, // 3. [接口] 生命周期：规范“连接建立时”该干什么
  OnGatewayDisconnect, // 4. [接口] 生命周期：规范“连接断开时”该干什么
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

  // 当有新用户（前端的 WebsocketProvider）尝试建立连接时触发
  async handleConnection(connection: any, request: any) {
    // 1. 从请求 URL 中解析房间号和 Token
    // 前端连接地址示例: ws://.../collaboration?room=123&token=abc
    const url = new URL(
      request.url,
      `http://${request.headers.host || 'localhost'}`,
    );
    const docName = url.searchParams.get('room') || 'default'; // 房间 ID，对应 Yjs 的独立文档
    let token = url.searchParams.get('token');

    // 防御性代码：清除由于 y-websocket 客户端补全导致的末尾斜杠
    if (token && token.endsWith('/')) {
      token = token.replace(/\/$/, '');
    }

    let user = { username: '游客' };

    // 2. 身份验证：通过 JWT 验证用户是否有权进入该房间
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        user = { username: payload.email || '未知用户' };
        // 将用户信息存入 connection 方便断开时记录日志
        connection.user = user;
      } catch (e) {
        console.error('[Yjs] Token 验证失败:', e.message);
      }
    }

    console.log(`[Yjs] 用户 [${user.username}] 进入房间: ${docName}`);

    // 3. 记录在线状态 (内部维护一个房间内连接的集合)
    this.presenceService.joinRoom(docName, connection);

    // 4. 重头戏：建立 Yjs 协同链路
    // setupWSConnection 是 y-websocket 提供的核心工具函数。
    // 它会自动：
    // a. 将当前 WebSocket 连接加入到名为 docName 的“同步房间”中。
    // b. 负责转发 binary 格式的 Yjs Update 数据包。
    // c. 自动处理同步状态（谁的数据旧，谁的数据新）。
    setupWSConnection(connection, request, {
      docName: docName,
      gc: true, // 开启垃圾回收，防止文档历史记录无限膨胀
    });
  }

  handleDisconnect(connection: any) {
    const username = connection.user?.username || '未知用户';
    console.log(`[Yjs] 用户 [${username}] 已离开`);
    // 移除在线状态
    this.presenceService.leaveRoom(connection);
  }
}
