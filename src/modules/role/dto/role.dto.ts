import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class RoleQueryParamsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  currentPage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsInt()
  status: number;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}

export class RolePermissionDto {
  @IsArray()
  menuIds: number[];

  @IsArray()
  apiPermissionIds: number[];
}
