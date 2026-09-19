import { Controller, Get, Post, Body, UseGuards, Param, ParseIntPipe, Delete, Patch, Req } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AdminGuard } from '../auth/admin.guard';
import { AuditService } from '../audit/audit.service';

@Controller('api/organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService
  ) {}

  @UseGuards(AdminGuard)
  @Post()
  async createOrganization(@Body() dto: CreateOrganizationDto, @Req() req: any) {
    const org = await this.organizationsService.createOrganization(dto);
    await this.auditService.log(req.user, 'CREATED_ORGANIZATION', 'Organization', org.id, `Created organization: ${org.name}`, req.ip);
    return org;
  }

  @Get()
  async getOrganizations() {
    return this.organizationsService.getOrganizations();
  }

  @Get(':id')
  async getOrganizationById(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.getOrganizationById(id);
  }

  // --- NEW: Update Organization ---
  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateOrganization(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: any) {
    const org = await this.organizationsService.updateOrganization(id, dto);
    await this.auditService.log(req.user, 'UPDATED_ORGANIZATION', 'Organization', id, `Updated organization: ${org.name}`, req.ip);
    return org;
  }

  // --- NEW: Delete Organization ---
  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteOrganization(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.organizationsService.deleteOrganization(id);
    await this.auditService.log(req.user, 'DELETED_ORGANIZATION', 'Organization', id, `Deleted organization ID: ${id}`, req.ip);
    return { success: true };
  }

  @UseGuards(AdminGuard)
  @Post(':orgId/forms/:formId')
  async assignForm(@Param('orgId', ParseIntPipe) orgId: number, @Param('formId', ParseIntPipe) formId: number, @Req() req: any) {
    const result = await this.organizationsService.assignForm(orgId, formId);
    await this.auditService.log(req.user, 'ASSIGNED_FORM_TO_ORG', 'Organization', orgId, `Assigned Form ID: ${formId} to Organization ID: ${orgId}`, req.ip);
    return result;
  }

  @UseGuards(AdminGuard)
  @Delete(':orgId/forms/:formId')
  async unassignForm(@Param('orgId', ParseIntPipe) orgId: number, @Param('formId', ParseIntPipe) formId: number, @Req() req: any) {
    await this.organizationsService.unassignForm(orgId, formId);
    await this.auditService.log(req.user, 'UNASSIGNED_FORM_FROM_ORG', 'Organization', orgId, `Unassigned Form ID: ${formId} from Organization ID: ${orgId}`, req.ip);
    return { success: true };
  }
}