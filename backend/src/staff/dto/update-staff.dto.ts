import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, IsIn } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional() @IsString() firstname?: string;
  @IsOptional() @IsString() lastname?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() password?: string;
  @IsOptional() @IsBoolean() isAdmin?: boolean;
  
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'KB_CREATOR', 'KB_REVIEWER', 'KB_APPROVER'])
  kbRole?: string;

  @IsOptional() @IsNumber() deptId?: number | null;
  @IsOptional() @IsNumber() teamId?: number | null;
}