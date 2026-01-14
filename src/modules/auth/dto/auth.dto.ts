import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-Z][a-zA-Z0-9._-]*$/, {
    message: '用户名必须以英文字母开头，可包含字母、数字及符号（. _ -）',
  })
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 100)
  password: string;

  @IsNotEmpty()
  @IsString()
  captchaId: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 4)
  captchaCode: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class CaptchaResponseVo {
  /** 验证码ID */
  captchaId: string;

  /** SVG图片数据 */
  svg: string;
}
