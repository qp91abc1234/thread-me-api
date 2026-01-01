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

export class UserQueryParamsDto {
  @IsOptional()
  @IsString()
  username?: string;

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

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsInt()
  status: number;

  @IsArray()
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
  @IsInt()
  status?: number;

  @IsOptional()
  @IsArray()
  roleIds?: number[];
}
