import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('breakdown')
  async getBreakdown(@Query('groupBy') groupBy: string) {
    return this.analyticsService.getBreakdown(groupBy || 'AGENT');
  }

  @UseGuards(JwtAuthGuard)
  @Get('advanced')
  async getAdvancedMetrics() {
    return this.analyticsService.getAdvancedMetrics();
  }
}
