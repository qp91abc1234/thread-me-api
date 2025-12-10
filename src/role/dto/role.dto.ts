import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Role } from '../entities/role.entity';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  name: string;

  permissionIds?: number[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsNotEmpty()
  id: number;
}

export class GetRoleVo extends Role {}

export class GetRoleListVo {
  list: GetRoleVo[];
  total: number;
  page: number;
  pageSize: number;
}
