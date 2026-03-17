import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CaptchaService } from '../captcha.service';

/**
 * 验证码守卫
 * 在登录前验证验证码
 */
@Injectable()
export class CaptchaGuard implements CanActivate {
  constructor(private readonly captchaService: CaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    // 验证验证码
    await this.captchaService.verify(body.captchaId, body.captchaCode);

    return true;
  }
}
