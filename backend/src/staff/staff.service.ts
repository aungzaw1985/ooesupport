import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService implements OnModuleInit {
  private readonly logger = new Logger(StaffService.name);
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const staffCount = await this.prisma.staff.count();
    if (staffCount === 0) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await this.prisma.staff.create({
        data: {
          username: 'admin',
          firstname: 'System',
          lastname: 'Admin',
          email: 'admin@ooesupport.com',
          password: hashedPassword,
          isAdmin: true,
          role: 'ADMIN',
          kbRole: 'KB_APPROVER',
        }
      });
      this.logger.log('?? Default Admin user created: admin@ooesupport.com / Admin123!');
    }
  }

  async createStaff(dto: CreateStaffDto) {
    try {
      const hashedPassword = await bcrypt.hash(dto.password || 'password', 10);
      return await this.prisma.staff.create({
        data: {
          username: dto.username,
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone || null,
          isAdmin: dto.isAdmin ?? false,
          role: (dto.role as StaffRole) || 'AGENT',
          kbRole: (dto.kbRole as any) || 'NONE', // Ensure KB role is saved on creation
          deptId: dto.deptId ?? null,
          teamId: dto.teamId ?? null,
        },
        include: { department: true, memberTeam: true },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create staff: ' + message);
    }
  }

  async getStaff() {
    return this.prisma.staff.findMany({
      select: { 
        id: true, firstname: true, lastname: true, email: true, phone: true, isAdmin: true, role: true, 
        kbRole: true, kbPoints: true, // <-- ADDED HERE
        deptId: true, teamId: true,
        department: true, memberTeam: true 
      },
    });
  }

  async getStaffById(id: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: { 
        id: true, firstname: true, lastname: true, email: true, phone: true, isAdmin: true, role: true, 
        kbRole: true, kbPoints: true, // <-- ADDED HERE
        deptId: true, teamId: true,
        department: true, memberTeam: true 
      },
    });
    if (!staff) throw new BadRequestException('Staff not found');
    return staff;
  }

  async updateStaff(id: number, dto: UpdateStaffDto) {
    try {
      const data: any = {
        firstname: dto.firstname,
        lastname: dto.lastname,
        email: dto.email,
        phone: dto.phone,
        isAdmin: dto.isAdmin,
        role: dto.role as any,
        kbRole: dto.kbRole as any,
        deptId: dto.deptId ?? null,
        teamId: dto.teamId ?? null,
      };

      if (dto.password && dto.password.trim() !== '') {
        data.password = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.staff.update({
        where: { id },
        data,
        select: { 
          id: true, firstname: true, lastname: true, email: true, phone: true, isAdmin: true, role: true, 
          kbRole: true, kbPoints: true, // <-- ADDED HERE
          department: true, memberTeam: true 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update staff: ' + message);
    }
  }

  async updateMyProfile(id: number, dto: any) {
    try {
      const data: any = {
        firstname: dto.firstname,
        lastname: dto.lastname,
        phone: dto.phone,
        photoUrl: dto.photoUrl,
      };

      if (dto.password && dto.password.trim() !== '') {
        data.password = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.staff.update({
        where: { id },
        data,
        select: { id: true, firstname: true, lastname: true, email: true, phone: true, role: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update profile: ' + message);
    }
  }

  async deleteStaff(id: number) {
    return this.prisma.staff.delete({ where: { id } });
  }
}