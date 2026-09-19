import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async createForm(dto: CreateFormDto) {
    try {
      return await this.prisma.form.create({
        data: {
          title: dto.title,
          deptId: dto.deptId || null,
          slaId: dto.slaId || null,
          fields: { 
            create: dto.fields.map((f: any) => ({
              name: f.name,
              type: f.type,
              visibility: f.visibility || 'OPTIONAL'
            }))
          },
        },
        include: { fields: { include: { options: true } } },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create form: ' + message);
    }
  }

  async getForms() {
    return this.prisma.form.findMany({
      include: { fields: { include: { options: true } } },
    });
  }

  async deleteForm(id: number) { 
     return this.prisma.form.delete({ where: { id } }); 
  }

  async getFormById(id: number) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: { fields: { include: { options: true }, orderBy: { order: 'asc' } } },
    });

    if (!form) {
      throw new BadRequestException('Form not found');
    }

    return form;
  }

  // --- NEW FIELD & OPTION METHODS ---

  async addField(formId: number, dto: any) {
    const fieldCount = await this.prisma.formField.count({ where: { formId } });
    return this.prisma.formField.create({
      data: {
        formId: formId,
        name: dto.name,
        type: dto.type,
        visibility: dto.visibility || 'OPTIONAL',
        order: fieldCount,
      },
    });
  }

  async reorderFields(formId: number, orderedIds: number[]) {
    // Use a transaction to update all field orders securely
    const updates = orderedIds.map((id, index) => 
      this.prisma.formField.update({
        where: { id },
        data: { order: index }
      })
    );
    
    await this.prisma.$transaction(updates);
    return { success: true };
  }

   async getFormsForStaff(deptId?: number) {
    return this.prisma.form.findMany({
      where: {
        OR: [
          { deptId: null }, // Global forms available to all
          { deptId: deptId } // Forms specific to the agent's department
        ]
      },
      include: { fields: { include: { options: true } } }
    });
  }

  async deleteField(fieldId: number) {
    return this.prisma.formField.delete({ where: { id: fieldId } });
  }

  async addListOption(fieldId: number, value: string) {
    return this.prisma.listOption.create({
      data: { fieldId: fieldId, value: value },
    });
  }

  async deleteListOption(optionId: number) {
    return this.prisma.listOption.delete({ where: { id: optionId } });
  }

  async updateForm(id: number, dto: any) {
    return this.prisma.form.update({
      where: { id },
      data: { 
        slaId: dto.slaId,
        deptId: dto.deptId,
        ticketPrefix: dto.ticketPrefix, // <-- Add
        ticketSeqType: dto.ticketSeqType // <-- Add
      }
    });
  }
  
  async updateField(fieldId: number, dto: any) {
    return this.prisma.formField.update({
      where: { id: fieldId },
      data: {
        name: dto.name,
        type: dto.type,
        visibility: dto.visibility,
      },
    });
  }

  async getAvailableForms(userOrgId?: number) {
    if (!userOrgId) return [];
    
    const orgForms = await this.prisma.organizationForm.findMany({
      where: { orgId: userOrgId },
      include: { 
        form: { 
          include: { 
            fields: { 
              include: { options: true },
              // FILTER: Hide Internal and Agent-Required fields from Customers
              where: {
                visibility: { notIn: ['INTERNAL_OPTIONAL', 'INTERNAL_REQUIRED', 'REQUIRED_AGENTS'] }
              }
            } 
          } 
        } 
      },
    });

    return orgForms.map(of => of.form);
  }
}