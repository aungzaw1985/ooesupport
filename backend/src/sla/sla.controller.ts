import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SlaService } from './sla.service';
import { CreateSlaDto } from './dto/create-sla.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @UseGuards(AdminGuard)
  @Post()
  async createSla(@Body() dto: CreateSlaDto) {
    return this.slaService.createSla(dto);
  }

  @Get()
  async getSlas() {
    return this.slaService.getSlas();
  }
}
