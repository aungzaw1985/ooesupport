import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketStatusesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const defaults = [
      { name: 'OPEN', color: '#10b981', isClosed: false },
      { name: 'IN_PROGRESS', color: '#3b82f6', isClosed: false },
      { name: 'WAITING_ON_CUSTOMER', color: '#f59e0b', isClosed: false },
      { name: 'RESOLVED', color: '#8b5cf6', isClosed: true },
      { name: 'CLOSED', color: '#6b7280', isClosed: true },
    ];

    for (const s of defaults) {
      const exists = await this.prisma.ticketStatusConfig.findUnique({ where: { name: s.name } });
      if (!exists) {
        await this.prisma.ticketStatusConfig.create({ data: s });
      }
    }
  }

  async findAll() {
    return this.prisma.ticketStatusConfig.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: any) {
    return this.prisma.ticketStatusConfig.create({ data: { name: dto.name.toUpperCase(), color: dto.color, isClosed: dto.isClosed } });
  }

  async update(id: number, dto: any) {
    return this.prisma.ticketStatusConfig.update({ where: { id }, data: { color: dto.color, isClosed: dto.isClosed } });
  }

  async remove(id: number) {
    return this.prisma.ticketStatusConfig.delete({ where: { id } });
  }
}
