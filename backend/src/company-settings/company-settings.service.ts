import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanySettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.companySetting.findFirst();
    if (!settings) {
      return this.prisma.companySetting.create({ data: {} });
    }
    return settings;
  }

  async updateSettings(dto: any) {
    const existing = await this.prisma.companySetting.findFirst();
    if (existing) {
      return this.prisma.companySetting.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.companySetting.create({ data: dto });
  }

  async updateLogoUrl(url: string) {
    const existing = await this.prisma.companySetting.findFirst();
    if (existing) {
      return this.prisma.companySetting.update({ where: { id: existing.id }, data: { logoUrl: url } });
    }
    return this.prisma.companySetting.create({ data: { logoUrl: url } });
  }

  async updateFaviconUrl(url: string) {
    const existing = await this.prisma.companySetting.findFirst();
    if (existing) {
      return this.prisma.companySetting.update({ where: { id: existing.id }, data: { faviconUrl: url } });
    }
    return this.prisma.companySetting.create({ data: { faviconUrl: url } });
  }
}
