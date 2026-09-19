import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AdminGuard } from '../auth/admin.guard';
import { AuditService } from '../audit/audit.service';

@Controller('api/departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly auditService: AuditService
  ) {}

  @UseGuards(AdminGuard)
  @Post()
  async createDepartment(@Body() dto: CreateDepartmentDto, @Req() req: any) {
    const dept = await this.departmentsService.createDepartment(dto);
    await this.auditService.log(req.user, 'CREATED_DEPARTMENT', 'Department', dept.id, `Created department: ${dept.name}`, req.ip);
    return dept;
  }

  @Get()
  async getDepartments() {
    return this.departmentsService.getDepartments();
  }

  @Get(':id')
  async getDepartmentById(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.getDepartmentById(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateDepartment(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: any) {
    const dept = await this.departmentsService.updateDepartment(id, dto);
    await this.auditService.log(req.user, 'UPDATED_DEPARTMENT', 'Department', id, `Updated department name to: ${dept.name}`, req.ip);
    return dept;
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteDepartment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.departmentsService.deleteDepartment(id);
    await this.auditService.log(req.user, 'DELETED_DEPARTMENT', 'Department', id, `Deleted department ID: ${id}`, req.ip);
    return { success: true };
  }
}