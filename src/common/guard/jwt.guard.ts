import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { METADATA_KEY } from '../constant/constant';
import { BusinessExceptions } from '../utils/exception';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const requireLogin = this.reflector.getAllAndOverride<boolean>(
      METADATA_KEY.REQUIRE_LOGIN,
      [context.getHandler(), context.getClass()],
    );

    if (!requireLogin) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Token 过期 - 前端可以续签
    if (info?.name === 'TokenExpiredError') {
      throw BusinessExceptions.TOKEN_EXPIRED();
    }

    // 其他所有错误（格式错误、签名错误、无用户等）统一当作 Token 无效
    if (err || !user) {
      throw BusinessExceptions.TOKEN_INVALID();
    }

    return user;
  }
}
