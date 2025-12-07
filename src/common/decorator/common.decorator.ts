import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const RequireLogin = () =>
  applyDecorators(ApiBearerAuth(), SetMetadata('require-login', true));

export const RequirePermission = (...permissions: string[]) =>
  applyDecorators(
    RequireLogin(),
    SetMetadata('require-permission', permissions),
  );
