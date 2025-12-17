import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
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
