import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RoomModule } from './room/room.module.js';
import { ColumnModule } from './column/column.module.js';
import { CardModule } from './card/card.module.js';
import { UserModule } from './user/user.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';

@Module({
  imports: [
    // 加载 .env 配置
    ConfigModule.forRoot({ isGlobal: true }),
    // 基础模块
    PrismaModule,
    // 业务模块
    AuthModule,
    RoomModule,
    ColumnModule,
    CardModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局 JWT 认证守卫（默认所有接口都需要认证，用 @Public() 标记公开接口）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
