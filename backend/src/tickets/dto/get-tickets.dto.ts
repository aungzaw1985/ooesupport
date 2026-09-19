import { IsOptional, IsString, IsNumber, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTicketsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit: number = 10;
  @IsOptional() @IsString() @IsIn(['', 'OPEN', 'CLOSED', 'RESOLVED', 'ARCHIVED']) status?: string;
  @IsOptional() @IsString() @IsIn(['', 'LOW', 'NORMAL', 'HIGH', 'URGENT']) priority?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() @IsIn(['', 'createdAt', 'updatedAt', 'priority', 'status', 'number']) sort?: string;
  @IsOptional() @IsString() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc' = 'desc';
  @IsOptional() @Type(() => Number) @IsInt() deptId?: number;
  @IsOptional() @Type(() => Number) @IsInt() staffId?: number;
  
  // <-- ADD THIS
  @IsOptional() @IsString() @IsIn(['mine', 'unassigned', 'all']) view?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() customFilterField?: string;
  @IsOptional() @IsString() customFilterValue?: string; 
}