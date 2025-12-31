import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryParamsDto {
  @IsOptional()
  @IsString()
  username?: string;

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

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  realName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @Type(() => Number)
  @IsInt()
  status: number;

  @IsArray()
  @Type(() => Number)
  roleIds: number[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  realName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  roleIds?: number[];
}
