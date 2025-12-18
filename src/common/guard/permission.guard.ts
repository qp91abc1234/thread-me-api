import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessExceptions } from '../utils/exception';
import { METADATA_KEY } from '../constant/constant';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user: { userId: number; permissions: string[] } }>();

    if (!request.user) {
      return true;
    }

    const permissions = request.user.permissions;
    if (permissions.includes('sys:manage')) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      METADATA_KEY.REQUIRE_PERMISSION,
      [context.getClass(), context.getHandler()],
    );

    if (!requiredPermissions) {
      return true;
    }

    for (let i = 0; i < requiredPermissions.length; i++) {
      const curPermission = requiredPermissions[i];
      const found = permissions.find((item) => item === curPermission);
      if (!found) {
        throw BusinessExceptions.NO_PERMISSION(`缺少 ${curPermission} 权限`);
      }
    }
  }
}
