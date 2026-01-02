import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// ========== Menu DTOs ==========

export class CreateMenuDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  path: string;

  @IsString()
  icon: string;

  @IsString()
  @ValidateIf((o) => o.type === 1)
  @IsNotEmpty()
  compPath: string;

  @IsInt()
  type: number;

  @IsInt()
  sort: number;

  @IsBoolean()
  visible: boolean;

  @IsInt()
  status: number;

  @IsOptional()
  @IsInt()
  parentId?: number;
}

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  compPath?: string;

  @IsOptional()
  @IsInt()
  type?: number;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsInt()
  parentId?: number;
}

export class MenuSortItemDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsInt()
  sort: number;
}

export class MenuSortDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuSortItemDto)
  items: MenuSortItemDto[];
}

// ========== Button Permission DTOs ==========

export class CreateButtonPermissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsInt()
  status: number;

  @IsInt()
  menuId: number;
}

export class UpdateButtonPermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}
