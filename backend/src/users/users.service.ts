import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(dto.password || 'password', 10);
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone || null, // <-- ADD THIS
          orgId: dto.orgId || null,
          role: (dto.role as UserRole) || 'USER',
        },
        include: { organization: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create user: ' + message);
    }
  }

  async getUsers(search?: string) {
    return this.prisma.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined,
      select: { // Use select to omit password
        id: true, name: true, email: true, phone: true, role: true, createdAt: true,
        organization: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, name: true, email: true, phone: true, role: true, orgId: true, createdAt: true,
        organization: true, tickets: true 
      },
    });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    try {
      const data: any = {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        orgId: dto.orgId,
      };

      if (dto.role) {
        data.role = dto.role as any; 
      }

      // If a new password is provided, hash it before saving
      if (dto.password && dto.password.trim() !== '') {
        data.password = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, phone: true, role: true, organization: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update user: ' + message);
    }
  }

    async updateMyProfile(id: number, dto: any) {
    try {
      const data: any = {
        name: dto.name,
        phone: dto.phone,
        photoUrl: dto.photoUrl,
      };

      // If a new password is provided, hash it before saving
      if (dto.password && dto.password.trim() !== '') {
        data.password = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, phone: true, role: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update profile: ' + message);
    }
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}