import { OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  password: string;

  roleIds?: number[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  id: number;
}

export class GetUserVo extends OmitType(User, ['password', 'roles']) {}

export class GetUserListVo {
  list: GetUserVo[];
  total: number;
  page: number;
  pageSize: number;
}
