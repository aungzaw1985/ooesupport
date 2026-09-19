import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async createDepartment(dto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({
        data: { name: dto.name, slaId: dto.slaId },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create department: ' + message);
    }
  }

  async getDepartments() {
    return this.prisma.department.findMany({
      include: { 
        staff: true, 
        sla: true 
      },
    });
  }
  
  async updateDepartment(id: number, dto: any) {
    return this.prisma.department.update({
      where: { id },
      data: { name: dto.name, slaId: dto.slaId },
    });
  }

  async deleteDepartment(id: number) {
    return this.prisma.department.delete({ where: { id } });
  }

   async getDepartmentById(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { 
        staff: true,
        sla: true 
      },
    });

    if (!dept) {
      throw new BadRequestException('Department not found');
    }

    return dept;
  }
}
