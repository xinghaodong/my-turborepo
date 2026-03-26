import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { CardService } from './card.service.js';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto/card.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class CardController {
  constructor(private readonly cardService: CardService) {}

  /** POST /columns/:columnId/cards - 创建卡片 */
  @Post('columns/:columnId/cards')
  create(
    @Param('columnId') columnId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardService.create(columnId, userId, dto);
  }

  /** GET /cards/:id - 获取卡片详情 */
  @Get('cards/:id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cardService.findOne(id, userId);
  }

  /** PUT /cards/:id - 更新卡片 */
  @Put('cards/:id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardService.update(id, userId, dto);
  }

  /** PATCH /cards/:id/move - 移动卡片 */
  @Patch('cards/:id/move')
  move(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardService.move(id, userId, dto);
  }

  /** DELETE /cards/:id - 删除卡片 */
  @Delete('cards/:id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cardService.remove(id, userId);
  }

  /** POST /cards/:id/assignees - 分配成员 */
  @Post('cards/:id/assignees')
  assignUser(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    return this.cardService.assignUser(id, userId, targetUserId);
  }

  /** DELETE /cards/:id/assignees/:targetUserId - 移除成员 */
  @Delete('cards/:id/assignees/:targetUserId')
  unassignUser(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.cardService.unassignUser(id, userId, targetUserId);
  }

  /** POST /cards/:id/comments - 添加评论 */
  @Post('cards/:id/comments')
  addComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.cardService.addComment(id, userId, content);
  }
}
