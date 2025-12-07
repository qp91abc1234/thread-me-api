import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Permission } from '../entities/permission.entity';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  name: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsNotEmpty()
  id: number;
}

export class GetPermissionVo extends Permission {}
