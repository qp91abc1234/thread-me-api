import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Permission } from '../entities/permission.entity';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  name: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsNotEmpty()
  id: number;
}

export class GetPermissionVo extends Permission {}

export class GetPermissionListVo {
  list: GetPermissionVo[];
  total: number;
  page: number;
  pageSize: number;
}
