import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RoleQueryParamsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentPage: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number;
}

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  status: number;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

export class RolePermissionDto {
  @IsNotEmpty()
  @IsArray()
  @Type(() => Number)
  menuIds: number[];

  @IsNotEmpty()
  @IsArray()
  @Type(() => Number)
  apiPermissionIds: number[];
}
