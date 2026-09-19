import { IsString, IsNumber, IsIn, IsOptional } from 'class-validator';

export class CreateSlaDto {
  @IsString() name: string;
  @IsNumber() graceHours: number;
  @IsString() @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']) priority: string;
  @IsOptional() @IsNumber() scheduleId?: number; // <-- ADD THIS
}