import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CaptchaService } from '../captcha.service';
import { BusinessExceptions } from '@/common/utils/exception/business.exception';

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

    // 检查请求体中是否包含验证码信息
    if (!body?.captchaId || !body?.captchaCode) {
      throw BusinessExceptions.CAPTCHA_INVALID('缺少验证码ID或验证码信息');
    }

    // 验证验证码
    const isValid = await this.captchaService.verify(
      body.captchaId,
      body.captchaCode,
    );

    if (!isValid) {
      throw BusinessExceptions.CAPTCHA_INVALID();
    }

    return true;
  }
}
