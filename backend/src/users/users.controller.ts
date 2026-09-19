import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService
  ) {}

  @UseGuards(AdminGuard)
  @Post()
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    const user = await this.usersService.createUser(dto);
    await this.auditService.log(req.user, 'CREATED_USER', 'User', user.id, `Created user: ${user.name}`, req.ip);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(@Req() req: any, @Query('search') search?: string) {
    // Security: Prevent customers from listing all other customers
    if (req.user.role === 'USER') {
      return [];
    }
    return this.usersService.getUsers(search);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: any) {
    return this.usersService.getUserById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req: any, file, cb) => cb(null, `user-${req.user.id}-${Date.now()}${extname(file.originalname)}`),
    }),
  }))
  async uploadUserPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/uploads/${file.filename}`;
    await this.usersService.updateMyProfile(req.user.id, { photoUrl: url });
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(@Req() req: any, @Body() dto: any) {
    return this.usersService.updateMyProfile(req.user.id, dto);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @Req() req: any) {
    const user = await this.usersService.updateUser(id, dto);
    await this.auditService.log(req.user, 'UPDATED_USER', 'User', id, `Updated user: ${user.name}`, req.ip);
    return user;
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.usersService.deleteUser(id);
    await this.auditService.log(req.user, 'DELETED_USER', 'User', id, `Deleted user ID: ${id}`, req.ip);
    return { success: true };
  }
}