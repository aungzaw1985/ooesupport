import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'CLOSED', 'RESOLVED', 'ARCHIVED'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  staffId?: number | null;

  @IsOptional()
  teamId?: number | null;

  @IsOptional()
  deptId?: number | null;
}