import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(dto: CreateTeamDto) {
    try {
      return await this.prisma.team.create({
        data: {
          name: dto.name,
          deptId: dto.deptId,
          leaderId: dto.leaderId || null,
        },
        include: { leader: true, members: true, department: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create team: ' + message);
    }
  }

  async getTeams() {
    return this.prisma.team.findMany({
      include: { leader: true, members: true, department: true },
      orderBy: { name: 'asc' }
    });
  }

  async deleteTeam(id: number) {
    return this.prisma.team.delete({ where: { id } });
  }

  async getTeamById(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { leader: true, members: true, department: true },
    });

    if (!team) {
      throw new BadRequestException('Team not found');
    }

    return team;
  }

  async updateTeam(id: number, dto: any) {
    return this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name,
        deptId: dto.deptId,
        leaderId: dto.leaderId || null,
      },
      include: { leader: true, members: true, department: true }
    });
  }
}
