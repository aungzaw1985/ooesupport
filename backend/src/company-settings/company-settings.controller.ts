import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CompanySettingsService } from './company-settings.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/company-settings')
export class CompanySettingsController {
  constructor(private readonly service: CompanySettingsService) {}

  @Get()
  async getSettings() { return this.service.getSettings(); }

  @UseGuards(AdminGuard)
  @Post()
  async updateSettings(@Body() dto: any) { return this.service.updateSettings(dto); }

  @UseGuards(AdminGuard)
  @Post('logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, `logo-${Date.now()}${extname(file.originalname)}`),
    }),
    limits: { 
      fileSize: 10 * 1024 * 1024, // 10MB limit for logos
    },
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`;
    await this.service.updateLogoUrl(url);
    return { url };
  }
 
  @UseGuards(AdminGuard)
  @Post('favicon')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, `favicon-${Date.now()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for favicons
  }))
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/uploads/${file.filename}`;
    await this.service.updateFaviconUrl(url);
    return { url };
  }
}
