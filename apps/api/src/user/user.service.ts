import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

import { PaginatedResponse } from '@repo/types/api';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /** 获取所有用户（管理端用的列表） */
  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { rooms: true, ownedRooms: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      list: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** 更新个人资料 (如头像) */
  async updateProfile(
    userId: string,
    data: { avatar?: string; username?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
  }

  /** 封禁/解封用户 */
  async toggleActive(targetUserId: string, operatorId: string) {
    if (targetUserId === operatorId) {
      throw new ForbiddenException('不能封禁自己');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.role === 'SUPER_ADMIN')
      throw new ForbiddenException('不能封禁超级管理员');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !user.isActive },
    });
  }

  /** 更新用户系统角色 (管理员用) */
  async updateRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
  }
}
