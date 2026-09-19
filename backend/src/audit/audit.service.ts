import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(user: any, action: string, entity: string, entityId: number | null, message: string, ipAddress?: string) {
    return this.prisma.auditLog.create({
      data: {
        staffId: user?.role !== 'USER' ? user?.id : null,
        userId: user?.role === 'USER' ? user?.id : null,
        action,
        entity,
        entityId,
        message,
        ipAddress,
      },
    });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        staff: { select: { firstname: true, lastname: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to last 200 events for performance
    });
  }
}
