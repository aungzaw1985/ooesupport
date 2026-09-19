import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async getSchedules() {
    return this.prisma.schedule.findMany({ include: { days: { orderBy: { dayOfWeek: 'asc' } } } });
  }

  async createSchedule(name: string) {
    // Create all 7 days (0 = Sunday, 6 = Saturday). Default Mon-Fri as working days.
    const defaultDays = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isWorkingDay: i >= 1 && i <= 5, 
      startTime: 9,
      endTime: 17
    }));

    return this.prisma.schedule.create({
      data: { name, days: { create: defaultDays } },
      include: { days: { orderBy: { dayOfWeek: 'asc' } } }
    });
  }

  async deleteSchedule(id: number) {
    // onDelete: Cascade in Prisma schema will automatically delete the days
    return this.prisma.schedule.delete({ where: { id } });
  }

  async updateDay(dayId: number, dto: any) {
    return this.prisma.scheduleDay.update({
      where: { id: dayId },
      data: { isWorkingDay: dto.isWorkingDay, startTime: dto.startTime, endTime: dto.endTime }
    });
  }

  async getHolidays() {
    return this.prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  }

  async createHoliday(name: string, date: string) {
    return this.prisma.holiday.create({ data: { name, date: new Date(date) } });
  }

  async deleteHoliday(id: number) {
    return this.prisma.holiday.delete({ where: { id } });
  }
}