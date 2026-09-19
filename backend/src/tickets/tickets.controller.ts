import { Controller, Post, Body, Get, Param, ParseIntPipe, Query, UseGuards, Patch, Delete, Req, Res, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { GetTicketsDto } from './dto/get-tickets.dto';
import { CreateThreadEntryDto } from './dto/create-thread-entry.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Req() req: any) {
    // Fix: Check for uppercase 'USER'
    if (req.user.role === 'USER') {
      createTicketDto.userId = req.user.id;
    }
    return this.ticketsService.createTicket(createTicketDto, req.user.role, req.user.orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getTickets(@Query() query: GetTicketsDto, @Req() req: any) {
    return this.ticketsService.getTickets(query, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getTicketStats(@Req() req: any) {
    return this.ticketsService.getTicketStats(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export')
  async exportTickets(@Res() res: Response) {
    const tickets = await this.ticketsService.getTicketsForExport();

    const header = [
      'Ticket ID', 'Number', 'Subject', 'Status', 'Priority',
      'User Name', 'User Email', 'Department', 'Assigned Agent',
      'Created At', 'Due Date'
    ].join(',');

    const rows = tickets.map((t: any) => [
      t.id,
      t.number,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${t.user?.name || 'N/A'}"`,
      t.user?.email || 'N/A',
      t.department?.name || 'N/A',
      t.staff ? `"${t.staff.firstname} ${t.staff.lastname}"` : 'Unassigned',
      new Date(t.createdAt).toISOString(),
      t.dueDate ? new Date(t.dueDate).toISOString() : 'N/A'
    ].join(','));

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets-export.csv"');
    res.send(csv);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/escalate')
  async escalateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Req() req: any
  ) {
    return this.ticketsService.escalateTicket(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  async getUserTickets(@Req() req: any) {
    const userId = req.user.id;
    return this.ticketsService.getTicketsByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getTicket(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // The service method already handles the ForbiddenException and filtering internal customData
    return this.ticketsService.getTicketById(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(id, dto);
  }

    @UseGuards(JwtAuthGuard)
  @Post(':id/timer/start')
  async startTimer(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ticketsService.startTimer(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/timer/stop')
  async stopTimer(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ticketsService.stopTimer(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/time-logs')
  async getTimeLogs(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.getTimeLogs(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rate')
  async rateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Req() req: any
  ) {
    return this.ticketsService.rateTicket(id, dto.rating, dto.comment, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/thread')
  async getTicketThread(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const ticket = await this.ticketsService.getTicketById(id);
    
    // Fix: Check for uppercase 'USER'
    if (req.user.role === 'USER' && ticket.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this thread.');
    }
    
    return this.ticketsService.getTicketThread(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/replies')
  async addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateThreadEntryDto,
    @Req() req: any
  ) {
    // Fix: Check for uppercase 'USER'
    dto.type = req.user.role === 'USER' ? 'message' : 'response';
    return this.ticketsService.addThreadEntry(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/notes')
  async addInternalNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateThreadEntryDto,
  ) {
    dto.type = 'note';
    return this.ticketsService.addThreadEntry(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tags')
  async addTag(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.ticketsService.addTag(id, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/tags/:name')
  async removeTag(@Param('id', ParseIntPipe) id: number, @Param('name') name: string) {
    return this.ticketsService.removeTag(id, name);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/merge')
  async mergeTickets(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.ticketsService.mergeTickets(id, dto.secondaryTicketId);
  }
}