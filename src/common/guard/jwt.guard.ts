import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { METADATA_KEY } from '../constant/constant';

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
}
