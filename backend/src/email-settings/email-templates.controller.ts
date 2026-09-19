import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EmailSettingsService } from './email-settings.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  @Get()
  async getTemplates() {
    return this.emailSettingsService.getTemplates();
  }

  @UseGuards(AdminGuard)
  @Post()
  async createTemplate(@Body() dto: any) {
    return this.emailSettingsService.createTemplate(dto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.emailSettingsService.updateTemplate(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.emailSettingsService.deleteTemplate(id);
  }
}
