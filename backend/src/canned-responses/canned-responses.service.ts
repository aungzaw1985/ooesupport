import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CannedResponsesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.cannedResponse.create({ data: { title: dto.title, body: dto.body, departmentId: dto.departmentId || null } });
  }

  async findAll() {
    return this.prisma.cannedResponse.findMany({ include: { department: true } });
  }

  async update(id: number, dto: any) {
    return this.prisma.cannedResponse.update({ where: { id }, data: { title: dto.title, body: dto.body, departmentId: dto.departmentId || null } });
  }

  async remove(id: number) {
    return this.prisma.cannedResponse.delete({ where: { id } });
  }
}
