import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Patch, Req } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';

@Controller('api/forms')
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  async getForms() {
    return this.formsService.getForms();
  }

  // --- MOVE IT HERE (Above :id) ---
  @UseGuards(JwtAuthGuard)
  @Get('available')
  async getAvailableForms(@Req() req: any) {
    return this.formsService.getAvailableForms(req.user.orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('staff')
  async getFormsForStaff(@Req() req: any) {
    return this.formsService.getFormsForStaff(req.user.deptId);
  }

  @Get(':id')
  async getFormById(@Param('id', ParseIntPipe) id: number) {
    return this.formsService.getFormById(id);
  }

  @UseGuards(AdminGuard)
  @Post()
  async createForm(@Body() dto: CreateFormDto, @Req() req: any) {
    const form = await this.formsService.createForm(dto);
    await this.auditService.log(req.user, 'CREATED_FORM', 'Form', form.id, `Created form: ${form.title}`, req.ip);
    return form;
  }
  
  @UseGuards(AdminGuard)
  @Post(':id/fields')
  async addField(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: any) {
    const field = await this.formsService.addField(id, dto);
    await this.auditService.log(req.user, 'CREATED_FORM_FIELD', 'FormField', field.id, `Added field '${field.name}' to Form ID: ${id}`, req.ip);
    return field;
  }

  @UseGuards(AdminGuard)
  @Delete('fields/:fieldId')
  async deleteField(@Param('fieldId', ParseIntPipe) fieldId: number, @Req() req: any) {
    await this.formsService.deleteField(fieldId);
    await this.auditService.log(req.user, 'DELETED_FORM_FIELD', 'FormField', fieldId, `Deleted field ID: ${fieldId}`, req.ip);
    return { success: true };
  }

  @UseGuards(AdminGuard)
  @Post('fields/:fieldId/options')
  async addListOption(@Param('fieldId', ParseIntPipe) fieldId: number, @Body() dto: any, @Req() req: any) {
    const option = await this.formsService.addListOption(fieldId, dto.value);
    await this.auditService.log(req.user, 'CREATED_LIST_OPTION', 'ListOption', option.id, `Added option '${option.value}' to Field ID: ${fieldId}`, req.ip);
    return option;
  }

  @UseGuards(AdminGuard)
  @Delete('options/:optionId')
  async deleteListOption(@Param('optionId', ParseIntPipe) optionId: number, @Req() req: any) {
    await this.formsService.deleteListOption(optionId);
    await this.auditService.log(req.user, 'DELETED_LIST_OPTION', 'ListOption', optionId, `Deleted option ID: ${optionId}`, req.ip);
    return { success: true };
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateForm(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: any) {
    const form = await this.formsService.updateForm(id, dto);
    await this.auditService.log(req.user, 'UPDATED_FORM', 'Form', id, `Updated form configuration: ${form.title}`, req.ip);
    return form;
  }
  
  @UseGuards(AdminGuard)
  @Patch(':id/reorder')
  async reorderFields(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.formsService.reorderFields(id, dto.orderedIds);
  }

  @UseGuards(AdminGuard)
  @Patch('fields/:fieldId')
  async updateField(@Param('fieldId', ParseIntPipe) fieldId: number, @Body() dto: any, @Req() req: any) {
    const field = await this.formsService.updateField(fieldId, dto);
    await this.auditService.log(req.user, 'UPDATED_FORM_FIELD', 'FormField', fieldId, `Updated field: ${field.name}`, req.ip);
    return field;
  }

  // Added Delete Form Route
  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteForm(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.formsService.deleteForm(id);
    await this.auditService.log(req.user, 'DELETED_FORM', 'Form', id, `Deleted form ID: ${id}`, req.ip);
    return { success: true };
  }
}