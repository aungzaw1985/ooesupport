import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { EmailSettingsService } from './email-settings.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/email-settings')
export class EmailSettingsController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  @Get()
  async getSettings() {
    return this.emailSettingsService.getSettings();
  }

  @UseGuards(AdminGuard)
  @Post()
  async updateSettings(@Body() dto: any) {
    return this.emailSettingsService.updateSettings(dto);
  }
}
