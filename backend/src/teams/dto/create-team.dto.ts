import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsNumber()
  deptId: number;

  @IsOptional()
  @IsNumber()
  leaderId?: number;
}
