import { IsString, IsEmail, MinLength, IsOptional, IsNumber, IsIn } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsNumber()
  orgId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['USER', 'MANAGER'])
  role?: string;
}