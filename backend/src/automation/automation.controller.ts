import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/automation')
export class AutomationController {
  constructor(private readonly service: AutomationService) {}

  @UseGuards(AdminGuard)
  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
