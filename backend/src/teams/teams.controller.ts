import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Patch } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':id')
  async getTeamById(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.getTeamById(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateTeam(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.teamsService.updateTeam(id, dto);
  }

  @UseGuards(AdminGuard)
  @Post()
  async createTeam(@Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(dto);
  }

  @Get()
  async getTeams() {
    return this.teamsService.getTeams();
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteTeam(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.deleteTeam(id);
  }
}
