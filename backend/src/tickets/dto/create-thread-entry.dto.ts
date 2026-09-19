// src/tickets/dto/create-thread-entry.dto.ts
import { IsString, IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateThreadEntryDto {
  @IsOptional()
  @IsString()
  @IsIn(['message', 'response', 'note'])
  type: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsNumber()
  staffId?: number; 
}