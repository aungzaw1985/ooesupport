import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get('ticket/:ticketId')
  async getTasks(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.tasksService.getTasksByTicket(ticketId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ticket/:ticketId')
  async createTask(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: any,
    @Req() req: any
  ) {
    return this.tasksService.createTask(ticketId, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.tasksService.updateTaskStatus(id, dto.status);
  }
}
