import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto/card.dto.js';

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  /** 创建协作卡片 (Item) */
  async create(columnId: string, userId: string, dto: CreateCardDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!column) throw new NotFoundException('列不存在');

    await this.checkRoomMembership(column.roomId, userId);

    const maxPosition = await this.prisma.card.aggregate({
      where: { columnId },
      _max: { position: true },
    });

    const card = await this.prisma.card.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        position: (maxPosition._max.position ?? -1) + 1,
        columnId,
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    // 记录动态（简化版）
    await this.prisma.activity.create({
      data: {
        action: 'card_created',
        details: JSON.stringify({ cardTitle: card.title }),
        userId,
        roomId: column.roomId,
        cardId: card.id,
      },
    });

    return card;
  }

  /** 获取卡片详情 */
  async findOne(cardId: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: { select: { id: true, title: true, roomId: true } },
        assignees: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!card) throw new NotFoundException('卡片不存在');

    await this.checkRoomMembership(card.column.roomId, userId);

    return card;
  }

  /** 移动卡片 (跨列或排序) */
  async move(cardId: string, userId: string, dto: MoveCardDto) {
    const card = await this.getCardWithRoomId(cardId);
    await this.checkRoomMembership(card.roomId, userId);

    const sourceColumnId = card.columnId;
    const { targetColumnId, newPosition } = dto;

    if (sourceColumnId === targetColumnId) {
      // 同列排序
      const oldPosition = card.position;
      if (oldPosition === newPosition) return card;

      if (newPosition > oldPosition) {
        await this.prisma.card.updateMany({
          where: {
            columnId: sourceColumnId,
            position: { gt: oldPosition, lte: newPosition },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        await this.prisma.card.updateMany({
          where: {
            columnId: sourceColumnId,
            position: { gte: newPosition, lt: oldPosition },
          },
          data: { position: { increment: 1 } },
        });
      }
    } else {
      // 跨列移动
      await this.prisma.card.updateMany({
        where: { columnId: sourceColumnId, position: { gt: card.position } },
        data: { position: { decrement: 1 } },
      });
      await this.prisma.card.updateMany({
        where: { columnId: targetColumnId, position: { gte: newPosition } },
        data: { position: { increment: 1 } },
      });
    }

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: { columnId: targetColumnId, position: newPosition },
    });

    return updatedCard;
  }

  /** 更新卡片基本信息 */
  async update(cardId: string, userId: string, dto: UpdateCardDto) {
    const card = await this.getCardWithRoomId(cardId);
    await this.checkRoomMembership(card.roomId, userId);

    return this.prisma.card.update({
      where: { id: cardId },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  /** 将卡片指派给用户 */
  async assignUser(cardId: string, userId: string, targetUserId: string) {
    const card = await this.getCardWithRoomId(cardId);
    await this.checkRoomMembership(card.roomId, userId);

    const assign = await this.prisma.cardAssignee.create({
      data: { cardId, userId: targetUserId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    // 记录动态
    await this.prisma.activity.create({
      data: {
        action: 'card_assigned',
        details: JSON.stringify({ targetUserId }),
        userId,
        roomId: card.roomId,
        cardId: card.id,
      },
    });

    return assign;
  }

  /** 取消指派 */
  async unassignUser(cardId: string, userId: string, targetUserId: string) {
    const card = await this.getCardWithRoomId(cardId);
    await this.checkRoomMembership(card.roomId, userId);

    await this.prisma.cardAssignee.delete({
      where: { cardId_userId: { cardId, userId: targetUserId } },
    });

    return { success: true };
  }

  /** 添加评论 */
  async addComment(cardId: string, userId: string, content: string) {
    const card = await this.getCardWithRoomId(cardId);
    await this.checkRoomMembership(card.roomId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        content,
        cardId,
        userId,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    // 记录动态
    await this.prisma.activity.create({
      data: {
        action: 'card_commented',
        details: JSON.stringify({ commentId: comment.id }),
        userId,
        roomId: card.roomId,
        cardId: card.id,
      },
    });

    return comment;
  }

  /** 删除卡片 */
  async remove(cardId: string, userId: string) {
    const card = await this.getCardWithRoomId(cardId);
    await this.checkRoomMembership(card.roomId, userId);

    await this.prisma.card.delete({
      where: { id: cardId },
    });

    return { success: true };
  }

  /** 辅助：权限检查 */
  private async getCardWithRoomId(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { select: { roomId: true } } },
    });
    if (!card) throw new NotFoundException('卡片不存在');
    return { ...card, roomId: card.column.roomId };
  }

  private async checkRoomMembership(roomId: string, userId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (!member) throw new ForbiddenException('你不是该房间成员');
    return member;
  }
}
