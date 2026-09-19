import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  async getSchedules() { return this.scheduleService.getSchedules(); }

  @UseGuards(AdminGuard)
  @Post()
  async createSchedule(@Body() dto: any) { return this.scheduleService.createSchedule(dto.name); }

  @UseGuards(AdminGuard)
  @Patch('days/:dayId')
  async updateDay(@Param('dayId', ParseIntPipe) dayId: number, @Body() dto: any) { 
    return this.scheduleService.updateDay(dayId, dto); 
  }

  @Get('holidays')
  async getHolidays() { return this.scheduleService.getHolidays(); }

  @UseGuards(AdminGuard)
  @Post('holidays')
  async createHoliday(@Body() dto: any) { return this.scheduleService.createHoliday(dto.name, dto.date); }

  @UseGuards(AdminGuard)
  @Delete('holidays/:id')
  async deleteHoliday(@Param('id', ParseIntPipe) id: number) { return this.scheduleService.deleteHoliday(id); }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteSchedule(@Param('id', ParseIntPipe) id: number) { 
    return this.scheduleService.deleteSchedule(id); 
  }
}
