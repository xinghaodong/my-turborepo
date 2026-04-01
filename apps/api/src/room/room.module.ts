import { Module } from '@nestjs/common';
import { RoomService } from './room.service.js';
import { RoomController } from './room.controller.js';
import { RoomGateway } from './room.gateway.js';
import { RoomPresenceService } from './room-presence.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway, RoomPresenceService],
  exports: [RoomService, RoomPresenceService],
})
export class RoomModule {}
