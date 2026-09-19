import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Req, Query } from '@nestjs/common';
import { KbService } from './kb.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { KbRoleGuard } from '../auth/kb-role.guard';

@Controller('api/kb')
export class KbController {
  constructor(private readonly kbService: KbService) {}

  // --- Hierarchy Routes ---
  // Admins can manage categories/sections
  @UseGuards(JwtAuthGuard, KbRoleGuard)
  @Post('categories')
  createCategory(@Body() dto: any) { return this.kbService.createCategory(dto.name); }

  @UseGuards(JwtAuthGuard)
  @Get('categories')
  getCategories() { return this.kbService.getCategories(); }

  @UseGuards(JwtAuthGuard, KbRoleGuard)
  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) { return this.kbService.deleteCategory(id); }

  @UseGuards(JwtAuthGuard, KbRoleGuard)
  @Post('sections')
  createSection(@Body() dto: any) { return this.kbService.createSection(dto.categoryId, dto.name); }

  @UseGuards(JwtAuthGuard, KbRoleGuard)
  @Delete('sections/:id')
  deleteSection(@Param('id', ParseIntPipe) id: number) { return this.kbService.deleteSection(id); }

  // --- Article Workflow Routes ---
  // Any logged-in staff can view articles
  @UseGuards(JwtAuthGuard)
  @Get('articles')
  getArticlesForStaff() { return this.kbService.getArticlesForStaff(); }

  @UseGuards(JwtAuthGuard)
  @Get('articles/:id/versions')
  getArticleVersions(@Param('id', ParseIntPipe) id: number) { return this.kbService.getArticleVersions(id); }

  // KB Creators can create/edit articles (Service checks kbRole)
  @UseGuards(JwtAuthGuard)
  @Post('articles')
  createArticle(@Body() dto: any, @Req() req: any) { return this.kbService.createArticle(dto, req.user); }

  @UseGuards(JwtAuthGuard)
  @Patch('articles/:id')
  updateArticle(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req: any) { return this.kbService.updateArticle(id, dto, req.user); }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/submit')
  submitForReview(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return this.kbService.submitForReview(id, req.user); }

  // KB Approvers can approve/publish/archive
  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/approve')
  approveArticle(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return this.kbService.approveArticle(id, req.user); }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/publish')
  publishArticle(@Param('id', ParseIntPipe) id: number, @Req() req: any) { return this.kbService.publishArticle(id, req.user); }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/archive')
  archiveArticle(@Param('id', ParseIntPipe) id: number) { return this.kbService.archiveArticle(id); }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/republish')
  republishArticle(@Param('id', ParseIntPipe) id: number) { return this.kbService.republishArticle(id); }

  // --- Public KB Routes ---
  @Get('public')
  getPublicArticles(@Query('search') search?: string) { return this.kbService.getPublishedArticles(search); }
}