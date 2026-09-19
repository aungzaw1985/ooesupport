import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KbService {
  constructor(private prisma: PrismaService) {}

  // --- Hierarchy Management ---
  async createCategory(name: string) { return this.prisma.kbCategory.create({ data: { name } }); }
  async getCategories() { return this.prisma.kbCategory.findMany({ include: { sections: true } }); }
  async deleteCategory(id: number) { return this.prisma.kbCategory.delete({ where: { id } }); }

  async createSection(categoryId: number, name: string) { return this.prisma.kbSection.create({ data: { categoryId, name } }); }
  async deleteSection(id: number) { return this.prisma.kbSection.delete({ where: { id } }); }

  // --- Article Management ---
  async createArticle(dto: any, user: any) {
    if (!['KB_CREATOR', 'KB_APPROVER'].includes(user.kbRole)) {
      throw new ForbiddenException('You do not have permission to create KB articles.');
    }
    return this.prisma.kbArticle.create({
      data: {
        title: dto.title,
        publicContent: dto.publicContent,
        internalContent: dto.internalContent || null,
        sectionId: dto.sectionId,
        creatorId: user.id,
      }
    });
  }

  async getArticlesForStaff() {
    // For Agents: Calculate Stale Status (older than 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const articles = await this.prisma.kbArticle.findMany({
      include: { 
        section: { include: { category: true } },
        creator: { select: { firstname: true, lastname: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 } // Get latest version
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Map to add isStale flag dynamically
    return articles.map(a => ({
      ...a,
      isStale: a.updatedAt < sixMonthsAgo
    }));
  }

  async updateArticle(id: number, dto: any, user: any) {
    const article = await this.prisma.kbArticle.findUnique({ where: { id } });
    if (!article) throw new BadRequestException('Article not found.');

    // Save current state as a new Version before updating
    const latestVersion = await this.prisma.kbArticleVersion.findFirst({
      where: { articleId: id },
      orderBy: { version: 'desc' }
    });
    const nextVersion = (latestVersion?.version || 0) + 1;

    await this.prisma.kbArticleVersion.create({
      data: {
        articleId: id,
        title: article.title,
        content: article.publicContent, // Saving the public content before overwrite
        version: nextVersion,
        editedById: user.id,
      }
    });

    return this.prisma.kbArticle.update({
      where: { id },
      data: {
        title: dto.title,
        publicContent: dto.publicContent,
        internalContent: dto.internalContent || null,
        isStale: false, // Reset stale flag on update
      }
    });
  }

  async getArticleVersions(articleId: number) {
    return this.prisma.kbArticleVersion.findMany({
      where: { articleId },
      include: { editedBy: { select: { firstname: true, lastname: true } } },
      orderBy: { version: 'desc' }
    });
  }

  // --- Workflow ---
  async submitForReview(articleId: number, user: any) {
    const article = await this.prisma.kbArticle.findUnique({ where: { id: articleId } });
    if (!article || article.creatorId !== user.id) throw new ForbiddenException('Only the creator can submit this article.');
    if (article.status !== 'DRAFT') throw new BadRequestException('Only DRAFT articles can be submitted.');
    return this.prisma.kbArticle.update({ where: { id: articleId }, data: { status: 'IN_REVIEW' } });
  }

  async approveArticle(articleId: number, user: any) {
    if (user.kbRole !== 'KB_APPROVER') throw new ForbiddenException('Only KB Approvers can approve articles.');
    const article = await this.prisma.kbArticle.findUnique({ where: { id: articleId } });
    if (!article || article.status !== 'IN_REVIEW') throw new BadRequestException('Article must be IN_REVIEW to be approved.');
    return this.prisma.kbArticle.update({ where: { id: articleId }, data: { status: 'APPROVED', approverId: user.id } });
  }

  async publishArticle(articleId: number, user: any) {
    if (user.kbRole !== 'KB_APPROVER') throw new ForbiddenException('Only KB Approvers can publish articles.');
    const article = await this.prisma.kbArticle.findUnique({ where: { id: articleId } });
    if (!article || article.status !== 'APPROVED') throw new BadRequestException('Article must be APPROVED before publishing.');

    const [updatedArticle] = await this.prisma.$transaction([
      this.prisma.kbArticle.update({ where: { id: articleId }, data: { status: 'PUBLISHED' } }),
      this.prisma.staff.update({ where: { id: article.creatorId }, data: { kbPoints: { increment: 10 } } })
    ]);
    return updatedArticle;
  }

  async archiveArticle(id: number) {
    const article = await this.prisma.kbArticle.findUnique({ where: { id } });
    if (!article || article.status !== 'PUBLISHED') throw new BadRequestException('Only published articles can be archived.');
    return this.prisma.kbArticle.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async republishArticle(id: number) {
    const article = await this.prisma.kbArticle.findUnique({ where: { id } });
    if (!article || article.status !== 'ARCHIVED') throw new BadRequestException('Only archived articles can be republished.');
    return this.prisma.kbArticle.update({ where: { id }, data: { status: 'PUBLISHED' } });
  }

  // --- Public KB (for End Users) ---
  async getPublishedArticles(search?: string) {
    const where: any = { status: 'PUBLISHED' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { publicContent: { contains: search, mode: 'insensitive' } }
      ];
    }

    // IMPORTANT: Only select publicContent! Do not send internalContent to the Client Portal.
    return this.prisma.kbArticle.findMany({
      where,
      select: {
        id: true,
        title: true,
        publicContent: true,
        updatedAt: true,
        section: { include: { category: true } },
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}