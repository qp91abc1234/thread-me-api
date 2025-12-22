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
import { GetPermissionVo } from '../../permission/dto/permission.dto';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 20)
  @Matches(/^(?!\d+$)[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5:._-]*$/, {
    message: '名称必须以中英文开头，可包含字母、数字、中文及符号（: . _ -）',
  })
  name: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class GetRoleVo {
  id: number;
  name: string;
  isSystem: boolean;
  createTime: Date;
  updateTime: Date;
  permissions?: GetPermissionVo[];
}

export class GetRoleListVo {
  list: GetRoleVo[];
  total: number;
  page: number;
  pageSize: number;
}
