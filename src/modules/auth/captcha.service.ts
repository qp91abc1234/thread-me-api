import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { BusinessExceptions } from '@/common/utils/exception/business.exception';

/**
 * 验证码配置
 */
const CAPTCHA_CONFIG = {
  /** 验证码长度 */
  length: 4,
  /** 验证码过期时间（秒） */
  expireTime: 300, // 5分钟
  /** 排除的字符（避免混淆：0和O，1和I、l） */
  charExclude: '0O1Il',
  /** Redis键前缀 */
  keyPrefix: 'captcha:',
} as const;

@Injectable()
export class CaptchaService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 生成验证码
   * @returns 验证码ID和SVG图片数据
   */
  async generate(): Promise<{ captchaId: string; svg: string }> {
    // 生成验证码ID
    const captchaId = uuidv4();

    // 生成验证码（4位数字+字母，排除易混淆字符）
    const captcha = svgCaptcha.create({
      size: CAPTCHA_CONFIG.length,
      ignoreChars: CAPTCHA_CONFIG.charExclude,
      noise: 2, // 干扰线条数量
      color: true, // 彩色
      background: '#f0f2f5', // 背景色
    });

    // 将验证码文本转换为小写存储（验证时不区分大小写）
    const captchaText = captcha.text.toLowerCase();

    // 存储到Redis，设置过期时间
    await this.redisService.set(
      `${CAPTCHA_CONFIG.keyPrefix}${captchaId}`,
      captchaText,
      {
        ttl: CAPTCHA_CONFIG.expireTime,
      },
    );

    return {
      captchaId,
      svg: captcha.data,
    };
  }

  /**
   * 验证验证码
   * @param captchaId 验证码ID
   * @param captchaCode 用户输入的验证码
   * @returns 是否验证通过
   */
  async verify(captchaId: string, captchaCode: string) {
    if (!captchaId || !captchaCode) {
      throw BusinessExceptions.CAPTCHA_INVALID('验证码信息异常');
    }

    // 从Redis获取验证码
    const storedCode = await this.redisService.get<string>(
      `${CAPTCHA_CONFIG.keyPrefix}${captchaId}`,
    );

    if (!storedCode) {
      throw BusinessExceptions.CAPTCHA_EXPIRED();
    }

    // 不区分大小写比较
    const isValid = storedCode.toLowerCase() === captchaCode.toLowerCase();

    // 验证后立即删除验证码（防止重复使用）
    if (isValid) {
      await this.redisService.del(`${CAPTCHA_CONFIG.keyPrefix}${captchaId}`);
    } else {
      throw BusinessExceptions.CAPTCHA_INVALID();
    }
  }
}
