import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateOrganizationDto {
  @IsString() name: string;
  @IsOptional() @IsNumber() parentId?: number;
  
  // New Fields
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() country?: string;
}