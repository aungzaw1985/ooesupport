import { IsString, IsEmail, IsOptional, IsNumber, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string; // <-- ADD THIS
  @IsOptional() @IsString() password?: string; // <-- ADD THIS for manual reset
  @IsOptional() @IsNumber() orgId?: number | null;
  @IsOptional() @IsString() @IsIn(['USER', 'MANAGER']) role?: string;
}