import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  @UseGuards(AdminGuard)
  @Post()
  async createStaff(@Body() dto: CreateStaffDto, @Req() req: any) {
    const staff = await this.staffService.createStaff(dto);
    await this.auditService.log(req.user, 'CREATED_STAFF', 'Staff', staff.id, `Created staff member: ${staff.firstname} ${staff.lastname}`, req.ip);
    await this.emailService.sendDynamicEmail(
      staff.email,
      'STAFF_CREATED',
      { name: `${staff.firstname} ${staff.lastname}` }
    );
    return staff;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getStaff() {
    return this.staffService.getStaff();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: any) {
    return this.staffService.getStaffById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req: any, file, cb) => cb(null, `staff-${req.user.id}-${Date.now()}${extname(file.originalname)}`),
    }),
  }))
  async uploadStaffPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/uploads/${file.filename}`;
    await this.staffService.updateMyProfile(req.user.id, { photoUrl: url });
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(@Req() req: any, @Body() dto: any) {
    return this.staffService.updateMyProfile(req.user.id, dto);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  async getStaffById(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.getStaffById(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto, @Req() req: any) {
    const staff = await this.staffService.updateStaff(id, dto);
    await this.auditService.log(req.user, 'UPDATED_STAFF', 'Staff', id, `Updated staff member: ${staff.firstname} ${staff.lastname}`, req.ip);
    return staff;
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteStaff(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.staffService.deleteStaff(id);
    await this.auditService.log(req.user, 'DELETED_STAFF', 'Staff', id, `Deleted staff member ID: ${id}`, req.ip);
    return { success: true };
  }
}