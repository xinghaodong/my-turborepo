import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoomPresenceService } from './room-presence.service.js';
import { CreateRoomDto, UpdateRoomDto, JoinRoomDto } from './dto/room.dto.js';

@Injectable()
export class RoomService {
    constructor(
        private prisma: PrismaService,
        private presenceService: RoomPresenceService,
    ) {}

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
                document: {
                    create: {},
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

        return {
            ...room,
            onlineCount: this.presenceService.getOnlineCount(room.id),
        };
    }

    /** 获取所有房间 分页 */
    async findAll(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [rooms, total] = await Promise.all([
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
            list: rooms.map((room) => ({
                ...room,
                onlineCount: this.presenceService.getOnlineCount(room.id),
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /** 获取公开房间列表 (搜索/标签) */
    async findPublicRooms(search?: string, tag?: string) {
        const rooms = await this.prisma.room.findMany({
            where: {
                isPublic: true,
                status: { not: 'BANNED' }, // 过滤掉封禁的房间
                AND: [search ? { title: { contains: search, mode: 'insensitive' } } : {}, tag ? { tags: { has: tag } } : {}],
            },
            select: {
                id: true,
                title: true,
                description: true,
                isPublic: true,
                inviteCode: true,
                status: true,
                background: true,
                tags: true,
                createdAt: true,
                owner: { select: { username: true, avatar: true } },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return rooms.map((room) => ({
            ...room,
            onlineCount: this.presenceService.getOnlineCount(room.id),
        }));
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
            onlineCount: this.presenceService.getOnlineCount(room.id),
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

        if (!room || room.status === 'BANNED') {
            throw new NotFoundException('该房间已被管理员禁用或已不存在');
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
            onlineCount: this.presenceService.getOnlineCount(room.id),
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
            return { msg: '你已在该房间中', roomId: room.id, title: room.title };
        }

        await this.prisma.roomMember.create({
            data: {
                userId,
                roomId: room.id,
                role: 'MEMBER',
            },
        });

        return { msg: '成功加入房间', roomId: room.id, title: room.title };
    }

    /** 更新房间设置 */
    async update(roomId: string, userId: string, dto: UpdateRoomDto) {
        await this.checkPermission(roomId, userId, ['OWNER', 'ADMIN', 'SUPER_ADMIN']);

        return this.prisma.room.update({
            where: { id: roomId },
            data: dto as any,
        });
    }

    /** 删除房间 (仅限所有者或系统管理员或超管) */
    async remove(roomId: string, userId: string) {
        await this.checkPermission(roomId, userId, ['OWNER', 'ADMIN', 'SUPER_ADMIN']);
        return this.prisma.room.delete({
            where: { id: roomId },
        });
    }

    /** 更新房间状态 (用于后台封禁等) */
    async updateStatus(roomId: string, status: any) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            throw new NotFoundException('找不到该房间');
        }

        // 如果管理员设置成了 状态禁用房间
        if (status === 'BANNED') {
            // 1. 发送 WS 广播通知在线用户
            this.presenceService.broadcastToRoom(roomId, {
                event: 'room_disabled', // 统一定义事件名
                data: {
                    message: '该房间已被管理员禁用，系统将在 5 秒后自动跳转至首页',
                    duration: 5000,
                },
            });

            // 2. 延迟一点点或者直接移除数据库成员（保证前端先收到通知）
            await this.prisma.roomMember.deleteMany({
                where: { roomId },
            });
        } else {
            // 如果从禁用恢复到正常状态，确保房主回到房间成员列表中
            const existingOwner = await this.prisma.roomMember.findUnique({
                where: {
                    userId_roomId: {
                        userId: room.ownerId,
                        roomId: roomId,
                    },
                },
            });

            if (!existingOwner) {
                await this.prisma.roomMember.create({
                    data: {
                        userId: room.ownerId,
                        roomId: roomId,
                        role: 'OWNER',
                    },
                });
            }
        }
        return this.prisma.room.update({
            where: { id: roomId },
            data: { status },
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
    private async checkPermission(roomId: string, userId: string, roles: string[]) {
        // 先检查用户本身的系统角色
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        // 如果是系统超级管理员，直接放行，不需要检查房间成员身份
        if (user?.role === 'SUPER_ADMIN') {
            return;
        }

        // 如果不是系统超管，再检查房间内的成员角色
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
