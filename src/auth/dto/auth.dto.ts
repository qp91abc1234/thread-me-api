import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  password: string;
}

export class LoginUserVo {
  token: string;
  refreshToken: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class RefreshTokenVo extends LoginUserVo {}
