import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(staffId: number | null, userId: number | null, ticketId: number, message: string) {
    return this.prisma.notification.create({
      data: { staffId, userId, ticketId, message }
    });
  }

  async getNotificationsForStaff(staffId: number) {
    return this.prisma.notification.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }
}
