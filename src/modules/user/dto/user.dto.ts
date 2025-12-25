import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { GetRoleVo } from '../../role/dto/role.dto';
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z][a-zA-Z0-9._-]*$/, {
    message: '用户名必须以英文字母开头，可包含字母、数字及符号（. _ -）',
  })
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  password: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds?: number[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  id: number;
}

export class GetUserVo {
  id: number;
  username: string;
  isSystem: boolean;
  createTime: Date;
  updateTime: Date;
  roles?: GetRoleVo[];
}
export class GetUserListVo {
  list: GetUserVo[];
  total: number;
  page: number;
  pageSize: number;
}
