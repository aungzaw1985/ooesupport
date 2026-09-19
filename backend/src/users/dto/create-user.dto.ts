import { IsString, IsEmail, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  password?: string;

  @IsOptional() @IsString()
  phone?: string; // <-- ADD THIS

  @IsOptional() @IsNumber()
  orgId?: number;

  @IsOptional() @IsString()
  @IsIn(['USER', 'MANAGER'])
  role?: string;
}