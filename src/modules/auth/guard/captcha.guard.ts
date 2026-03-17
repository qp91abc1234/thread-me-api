import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CAPTCHA_CONFIG } from '../captcha.service';
import { BusinessExceptions } from '@/common/utils/exception/business.exception';
import { RedisService } from '@/infrastructure/redis/redis.service';

/**
 * 验证码守卫
 * 在登录前验证验证码
 */
@Injectable()
export class CaptchaGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (!body?.captchaId || !body?.captchaCode) {
      throw BusinessExceptions.CAPTCHA_INVALID('验证码信息异常');
    }

    // 从Redis获取验证码
    const storedCode = await this.redisService.get<string>(
      `${CAPTCHA_CONFIG.keyPrefix}${body.captchaId}`,
    );

    if (!storedCode) {
      throw BusinessExceptions.CAPTCHA_EXPIRED();
    }

    // 不区分大小写比较
    const isValid = storedCode.toLowerCase() === body.captchaCode.toLowerCase();

    // 验证后立即删除验证码（防止重复使用）
    if (isValid) {
      await this.redisService.del(
        `${CAPTCHA_CONFIG.keyPrefix}${body.captchaId}`,
      );
    } else {
      throw BusinessExceptions.CAPTCHA_INVALID();
    }

    return true;
  }
}
