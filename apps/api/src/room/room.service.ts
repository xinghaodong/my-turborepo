import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto.js';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  /** 创建房间 */
  async create(userId: string, dto: CreateRoomDto) {
    const inviteCode = this.generateInviteCode();

    const room = await this.prisma.room.create({
      data: {
        title: dto.title,
        description: dto.description,
        background: dto.background,
        isPublic: dto.isPublic ?? true,
        password: dto.password,
        tags: dto.tags ?? [],
        inviteCode,
        ownerId: userId,
        // 创建者自动成为 OWNER 成员
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        // 默认创建一些协作列
        columns: {
          create: [
            { title: '待办', position: 0 },
            { title: '正在做', position: 1 },
            { title: '完成', position: 2 },
          ],
        },
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    return room;
  }

  /** 获取所有房间 分页 */
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    // const [rooms, total] = await this.prisma.room.findMany({
    //   skip,
    //   take: limit,
    //   include: {
    //     columns: { orderBy: { position: 'asc' } },
    //     members: {
    //       include: {
    //         user: { select: { id: true, username: true, avatar: true } },
    //       },
    //     },
    //   },
    // });
    // return {
    //   list: rooms,
    //   total,
    //   page,
    //   totalPages: Math.ceil(total / limit),
    // };

    const [users, total] = await Promise.all([
      this.prisma.room.findMany({
        include: {
          columns: { orderBy: { position: 'asc' } },
          members: {
            include: {
              user: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.room.count(),
    ]);
    return {
      list: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** 获取公开房间列表 (搜索/标签) */
  async findPublicRooms(search?: string, tag?: string) {
    return this.prisma.room.findMany({
      where: {
        isPublic: true,
        AND: [
          search ? { title: { contains: search, mode: 'insensitive' } } : {},
          tag ? { tags: { has: tag } } : {},
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        isPublic: true,
        inviteCode: true,
        background: true,
        tags: true,
        createdAt: true,
        owner: { select: { username: true, avatar: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 获取用户已加入的房间 */
  async findMyRooms(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((room) => ({
      ...room,
      myRole: room.members[0]?.role,
      members: undefined,
    }));
  }

  /** 获取房间详情（包含权限检查） */
  async findOne(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, username: true, avatar: true },
                    },
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('找不到该房间');
    }

    // 检查是否有权访问
    const member = room.members.find((m) => m.userId === userId);
    if (!member && !room.isPublic) {
      throw new ForbiddenException('该房间为私密，你需要获得邀请才能加入');
    }

    return {
      ...room,
      myRole: member?.role || 'GUEST',
      isMember: !!member,
    };
  }

  /** 通过邀请码加入房间 */
  async joinByInviteCode(userId: string, dto: JoinRoomDto) {
    const room = await this.prisma.room.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!room) {
      throw new NotFoundException('无效的邀请码');
    }

    // 检查密码（针对设了密码的公开/私密房间）
    if (room.password && room.password !== dto.password) {
      throw new UnauthorizedException('房间密码错误');
    }

    // 检查是否已经是成员
    const existingMember = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId: room.id } },
    });

    if (existingMember) {
      return { msg: '你已在该房间中', roomId: room.id };
    }

    await this.prisma.roomMember.create({
      data: {
        userId,
        roomId: room.id,
        role: 'MEMBER',
      },
    });

    return { msg: '成功加入房间', roomId: room.id };
  }

  /** 更新房间设置 */
  async update(roomId: string, userId: string, dto: UpdateRoomDto) {
    await this.checkPermission(roomId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.room.update({
      where: { id: roomId },
      data: dto,
    });
  }

  /** 工具：生成短邀请码 */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /** 权限验证辅助器 */
  private async checkPermission(
    roomId: string,
    userId: string,
    roles: string[],
  ) {
    const member = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException('权限限制：你没有操作权限');
    }
  }
}

// 需要导入用的异常类
import { UnauthorizedException } from '@nestjs/common';
