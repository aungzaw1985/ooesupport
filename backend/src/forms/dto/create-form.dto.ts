import { IsString, ValidateNested, IsOptional, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class FormFieldDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  @IsIn(['OPTIONAL', 'REQUIRED', 'REQUIRED_END_USERS', 'REQUIRED_AGENTS', 'INTERNAL_OPTIONAL', 'INTERNAL_REQUIRED', 'END_USERS_ONLY'])
  visibility?: string;
}

export class CreateFormDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  deptId?: number;

  @IsOptional()
  @IsNumber()
  slaId?: number;

  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];
}