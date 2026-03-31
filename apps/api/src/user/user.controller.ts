import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get('test')
  test() {
    return '我是test 接口';
  }

  /** GET /users - 获取所有用户（仅管理员） */
  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.userService.findAll(parseInt(page) || 1, parseInt(limit) || 20);
  }

  /** PATCH /users/:id/role - 修改用户角色（仅超级管理员） */
  @Patch(':id/role')
  @Roles('SUPER_ADMIN')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.updateRole(id, role);
  }

  /** PATCH /users/:id/toggle-active - 封禁/解封用户（管理员+） */
  @Patch(':id/toggle-active')
  @Roles('ADMIN', 'SUPER_ADMIN')
  toggleActive(@Param('id') id: string, @CurrentUser('id') operatorId: string) {
    return this.userService.toggleActive(id, operatorId);
  }
}
