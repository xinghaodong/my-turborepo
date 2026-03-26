import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateColumnDto, UpdateColumnDto } from './dto/column.dto.js';

@Injectable()
export class ColumnService {
  constructor(private prisma: PrismaService) {}

  /** 创建房间内的分类列 */
  async create(roomId: string, userId: string, dto: CreateColumnDto) {
    await this.checkRoomMembership(roomId, userId);

    const maxPosition = await this.prisma.column.aggregate({
      where: { roomId },
      _max: { position: true },
    });

    return this.prisma.column.create({
      data: {
        title: dto.title,
        position: (maxPosition._max.position ?? -1) + 1,
        roomId,
      },
    });
  }

  /** 更新列标题 */
  async update(columnId: string, userId: string, dto: UpdateColumnDto) {
    const column = await this.findColumnWithRoom(columnId);
    await this.checkRoomMembership(column.roomId, userId);

    return this.prisma.column.update({
      where: { id: columnId },
      data: { title: dto.title },
    });
  }

  /** 删除列 */
  async remove(columnId: string, userId: string) {
    const column = await this.findColumnWithRoom(columnId);
    await this.checkRoomMembership(column.roomId, userId, ['OWNER', 'ADMIN']);

    return this.prisma.column.delete({
      where: { id: columnId },
    });
  }

  /** 移动列排序 */
  async move(columnId: string, userId: string, newPosition: number) {
    const column = await this.findColumnWithRoom(columnId);
    await this.checkRoomMembership(column.roomId, userId);

    const oldPosition = column.position;
    if (oldPosition === newPosition) return column;

    if (newPosition > oldPosition) {
      await this.prisma.column.updateMany({
        where: {
          roomId: column.roomId,
          position: { gt: oldPosition, lte: newPosition },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      await this.prisma.column.updateMany({
        where: {
          roomId: column.roomId,
          position: { gte: newPosition, lt: oldPosition },
        },
        data: { position: { increment: 1 } },
      });
    }

    return this.prisma.column.update({
      where: { id: columnId },
      data: { position: newPosition },
    });
  }

  private async findColumnWithRoom(columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!column) throw new NotFoundException('列不存在');
    return column;
  }

  private async checkRoomMembership(roomId: string, userId: string, roles?: string[]) {
    const member = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (!member) throw new ForbiddenException('你不是该房间成员');
    if (roles && !roles.includes(member.role)) throw new ForbiddenException('权限不足');
    return member;
  }
}
