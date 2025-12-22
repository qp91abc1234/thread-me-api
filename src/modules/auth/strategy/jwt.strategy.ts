import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 策略
 *
 * 通过授权守卫（Guard）调用，用于验证请求中的 JWT token
 * 工作流程：
 * 1. 从请求头 Authorization 中提取 Bearer token
 * 2. 验证 token 的签名和有效期
 * 3. 如果 token 有效，解析 payload 并调用 validate 方法
 * 4. validate 方法的返回值会被添加到 req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload) {
    return payload;
  }
}
