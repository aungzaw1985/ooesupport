import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CannedResponsesService } from './canned-responses.service';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/canned-responses')
export class CannedResponsesController {
  constructor(private readonly service: CannedResponsesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
