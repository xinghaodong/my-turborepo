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

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /** POST /rooms - 创建新房间 */
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
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, userId, dto);
  }
}
