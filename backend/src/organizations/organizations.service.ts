import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(dto: any) {
    try {
      return await this.prisma.organization.create({
        data: { 
          name: dto.name, 
          parentId: dto.parentId || null,
          phone: dto.phone || null,
          website: dto.website || null,
          address: dto.address || null,
          city: dto.city || null,
          state: dto.state || null,
          zipCode: dto.zipCode || null,
          country: dto.country || null,
        },
        include: { parent: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create organization: ' + message);
    }
  }

  async getOrganizations() {
    return this.prisma.organization.findMany({
      include: { 
        parent: true,
        _count: { select: { users: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getOrganizationById(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { 
        users: true,
        parent: true,
        children: true,
        forms: { include: { form: true } }
      },
    });

    if (!org) throw new BadRequestException('Organization not found');
    return org;
  }

  // --- ADD THESE TWO METHODS ---
  async updateOrganization(id: number, dto: any) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        parentId: dto.parentId || null,
        phone: dto.phone,
        website: dto.website,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country,
        isBillable: dto.isBillable,
        hourlyRate: Number(dto.hourlyRate) || 0,
      }
    });
  }

  async deleteOrganization(id: number) {
    return this.prisma.organization.delete({ where: { id } });
  }

  async assignForm(orgId: number, formId: number) {
    return this.prisma.organizationForm.create({
      data: { orgId, formId }
    });
  }

  async unassignForm(orgId: number, formId: number) {
    return this.prisma.organizationForm.deleteMany({
      where: { orgId, formId }
    });
  }
}
