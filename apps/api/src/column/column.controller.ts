import {
  Controller,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ColumnService } from './column.service.js';
import { CreateColumnDto, UpdateColumnDto, MoveColumnDto } from './dto/column.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('boards/:boardId/columns')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  /** POST /boards/:boardId/columns - 创建列 */
  @Post()
  create(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.columnService.create(boardId, userId, dto);
  }

  /** PUT /boards/:boardId/columns/:id - 更新列 */
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnService.update(id, userId, dto);
  }

  /** DELETE /boards/:boardId/columns/:id - 删除列 */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.columnService.remove(id, userId);
  }

  /** PATCH /boards/:boardId/columns/:id/move - 移动列 */
  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MoveColumnDto,
  ) {
    return this.columnService.move(id, userId, dto.newPosition);
  }
}
