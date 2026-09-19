import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.auditService.findAll();
  }
}
