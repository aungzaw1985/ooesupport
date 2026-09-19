import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlaDto } from './dto/create-sla.dto';

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async createSla(dto: CreateSlaDto) {
    try {
      return await this.prisma.sla.create({
        data: {
          name: dto.name,
          gracePeriod: dto.graceHours,
          priority: dto.priority as any,
          scheduleId: dto.scheduleId || null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create SLA: ' + message);
    }
  }

  async getSlas() {
    return this.prisma.sla.findMany({ include: { schedule: true } });
  }

  // Method used by TicketsService to find the deadline rule
  async getSlaByPriority(priority: string) {
    return this.prisma.sla.findFirst({
      where: { priority: priority as any },
    });
  }

  // Update the signature to accept isResponse flag
  async calculateDueDate(priority?: string, slaId?: number, isResponse: boolean = false): Promise<Date> {
    const sla = await this.prisma.sla.findFirst({
      where: { priority: priority as any },
      include: { schedule: { include: { days: true } } }
    });

    // Use responseGracePeriod if isResponse is true, else use gracePeriod
    const hoursToAdd = sla ? (isResponse ? sla.responseGracePeriod : sla.gracePeriod) : 24;

    if (!sla || !sla.schedule) {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + hoursToAdd);
      return dueDate;
    }

    const holidays = await this.prisma.holiday.findMany();
    const scheduleDays = sla.schedule.days;

    let dueDate = new Date();
    let remainingHours = hoursToAdd;

    while (remainingHours > 0) {
      const day = dueDate.getDay();
      const dateString = dueDate.toISOString().split('T')[0];

      const isHoliday = holidays.some(h => h.date.toISOString().split('T')[0] === dateString);
      if (isHoliday) {
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(0, 0, 0, 0);
        continue;
      }

      const daySchedule = scheduleDays.find(d => d.dayOfWeek === day);
      if (!daySchedule || !daySchedule.isWorkingDay) {
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(0, 0, 0, 0);
        continue;
      }

      const hour = dueDate.getHours();
      if (hour < daySchedule.startTime) {
        dueDate.setHours(daySchedule.startTime, 0, 0, 0);
        continue;
      }

      if (hour >= daySchedule.endTime) {
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(0, 0, 0, 0);
        continue;
      }

      dueDate.setHours(dueDate.getHours() + 1);
      remainingHours -= 1;
    }

    return dueDate;
  }
}