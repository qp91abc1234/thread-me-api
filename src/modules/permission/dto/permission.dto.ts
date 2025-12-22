import { PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Matches,
} from 'class-validator';
export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @Matches(/^(?!\d+$)[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5:._-]*$/, {
    message: '名称必须以中英文开头，可包含字母、数字、中文及符号（: . _ -）',
  })
  name: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class GetPermissionVo {
  id: number;
  name: string;
  isSystem: boolean;
  createTime: Date;
  updateTime: Date;
}

export class GetPermissionListVo {
  list: GetPermissionVo[];
  total: number;
  page: number;
  pageSize: number;
}
