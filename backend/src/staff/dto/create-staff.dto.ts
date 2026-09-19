import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  username: string;

  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
  
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'KB_CREATOR', 'KB_REVIEWER', 'KB_APPROVER']) // <-- ADD THIS
  kbRole?: string;

  @IsOptional()
  @IsNumber()
  deptId?: number;

  @IsOptional()
  @IsNumber()
  teamId?: number;
}