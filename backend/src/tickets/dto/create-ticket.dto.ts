import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateTicketDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional() // <-- Change to Optional
  @IsNumber()
  deptId?: number;

  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  formId?: number; 
}