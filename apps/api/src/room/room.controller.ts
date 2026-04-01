import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RoomService } from './room.service.js';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 获取所有的房间 分页
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.roomService.findAll(parseInt(page) || 1, parseInt(limit) || 20);
  }

  /** POST /rooms - 创建新房间 */
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRoomDto) {
    return this.roomService.create(userId, dto);
  }

  /** GET /rooms/public - 发现/搜索公开房间 */
  @Get('public')
  findPublic(@Query('search') search?: string, @Query('tag') tag?: string) {
    return this.roomService.findPublicRooms(search, tag);
  }

  /** GET /rooms/my - 获取我已加入的房间 */
  @Get('my')
  findMy(@CurrentUser('id') userId: string) {
    return this.roomService.findMyRooms(userId);
  }

  /** GET /rooms/:id - 查看特定房间详情 */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomService.findOne(id, userId);
  }

  /** POST /rooms/join - 通过邀请码加入房间 */
  @Post('join')
  join(@CurrentUser('id') userId: string, @Body() dto: JoinRoomDto) {
    return this.roomService.joinByInviteCode(userId, dto);
  }

  /** PUT /rooms/:id - 更新房间设置 */
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, userId, dto);
  }

  /** DELETE /rooms/:id - 删除房间 */
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roomService.remove(id, userId);
  }

  /** PUT /rooms/:id/status - 更新房间状态 (封禁/解封) */
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.roomService.updateStatus(id, status);
  }
}
