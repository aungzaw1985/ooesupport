import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async createTask(ticketId: number, dto: any, staffId: number) {
    try {
      return await this.prisma.task.create({
        data: {
          ticketId,
          title: dto.title,
          description: dto.description || null,
          type: dto.type || 'INTERNAL',
          staffId: dto.staffId || staffId,
        },
        include: { staff: true }
      });
    } catch (error) {
      throw new BadRequestException('Failed to create sub-ticket');
    }
  }

  async getTasksByTicket(ticketId: number) {
    return this.prisma.task.findMany({
      where: { ticketId },
      include: { staff: { select: { id: true, firstname: true, lastname: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTaskStatus(taskId: number, status: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: status === 'COMPLETED' ? 'COMPLETED' : 'OPEN' },
    });
  }
}
